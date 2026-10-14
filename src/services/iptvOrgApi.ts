import { Channel, ChannelStreamSource } from '../types';
import { normalizeCategoryName } from './categories';
import { normalizeLanguageName, CANONICAL_LANGUAGES } from './languages';
import { CURATED_CHANNELS } from './iptv';
import { saveCachedChannels, loadCachedChannels } from './storage';

export const IPTV_ORG_ENDPOINTS = {
  channels: 'https://iptv-org.github.io/api/channels.json',
  feeds: 'https://iptv-org.github.io/api/feeds.json',
  logos: 'https://iptv-org.github.io/api/logos.json',
  streams: 'https://iptv-org.github.io/api/streams.json',
  categories: 'https://iptv-org.github.io/api/categories.json',
  languages: 'https://iptv-org.github.io/api/languages.json',
  countries: 'https://iptv-org.github.io/api/countries.json',
};

export interface IptvOrgChannelRaw {
  id: string;
  name: string;
  alt_names?: string[];
  network?: string | null;
  owners?: string[];
  country?: string;
  categories?: string[];
  is_nsfw?: boolean;
  launched?: string | null;
  closed?: string | null;
  replaced_by?: string | null;
  website?: string | null;
}

export interface IptvOrgFeedRaw {
  channel: string;
  id: string;
  name?: string;
  alt_names?: string[];
  is_main?: boolean;
  broadcast_area?: string[];
  timezones?: string[];
  languages?: string[];
  format?: string;
}

export interface IptvOrgLogoRaw {
  channel: string;
  feed?: string | null;
  in_use?: boolean;
  tags?: string[];
  width?: number;
  height?: number;
  format?: string;
  url: string;
}

export interface IptvOrgStreamRaw {
  channel?: string | null;
  feed?: string | null;
  title?: string | null;
  url: string;
  quality?: string | null;
  labels?: string[];
  user_agent?: string | null;
  referrer?: string | null;
}

export interface IptvOrgCategoryRaw {
  id: string;
  name: string;
  description?: string;
}

export interface IptvOrgLanguageRaw {
  code: string;
  name: string;
}

export interface IptvOrgCountryRaw {
  name: string;
  code: string;
  languages?: string[];
  flag?: string;
}

export interface IptvOrgDatasets {
  channels: IptvOrgChannelRaw[];
  feeds: IptvOrgFeedRaw[];
  logos: IptvOrgLogoRaw[];
  streams: IptvOrgStreamRaw[];
  categories: IptvOrgCategoryRaw[];
  languages: IptvOrgLanguageRaw[];
  countries: IptvOrgCountryRaw[];
}

/**
 * Fetch a JSON dataset with direct fetch and proxy fallback.
 */
async function fetchDatasetWithFallback<T>(url: string, signal?: AbortSignal): Promise<T> {
  // 1. Try direct fetch first
  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[EasyTV IPTV-org] Direct fetch failed for ${url}, trying proxy:`, err?.message || err);
  }

  // 2. Fallback to proxy
  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const proxyRes = await fetch(proxyUrl, { signal });
    if (proxyRes.ok) {
      return (await proxyRes.json()) as T;
    }
  } catch (proxyErr: any) {
    if (signal?.aborted) throw proxyErr;
    console.warn(`[EasyTV IPTV-org] Proxy fetch also failed for ${url}:`, proxyErr?.message || proxyErr);
  }

  throw new Error(`Failed to load dataset from ${url}`);
}

/**
 * Fetches all 7 official IPTV-org API datasets concurrently.
 */
export async function fetchAllIptvOrgDatasets(timeoutMs = 30000): Promise<IptvOrgDatasets> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const [channels, feeds, logos, streams, categories, languages, countries] = await Promise.all([
      fetchDatasetWithFallback<IptvOrgChannelRaw[]>(IPTV_ORG_ENDPOINTS.channels, controller.signal),
      fetchDatasetWithFallback<IptvOrgFeedRaw[]>(IPTV_ORG_ENDPOINTS.feeds, controller.signal),
      fetchDatasetWithFallback<IptvOrgLogoRaw[]>(IPTV_ORG_ENDPOINTS.logos, controller.signal),
      fetchDatasetWithFallback<IptvOrgStreamRaw[]>(IPTV_ORG_ENDPOINTS.streams, controller.signal),
      fetchDatasetWithFallback<IptvOrgCategoryRaw[]>(IPTV_ORG_ENDPOINTS.categories, controller.signal),
      fetchDatasetWithFallback<IptvOrgLanguageRaw[]>(IPTV_ORG_ENDPOINTS.languages, controller.signal),
      fetchDatasetWithFallback<IptvOrgCountryRaw[]>(IPTV_ORG_ENDPOINTS.countries, controller.signal),
    ]);

    return {
      channels: Array.isArray(channels) ? channels : [],
      feeds: Array.isArray(feeds) ? feeds : [],
      logos: Array.isArray(logos) ? logos : [],
      streams: Array.isArray(streams) ? streams : [],
      categories: Array.isArray(categories) ? categories : [],
      languages: Array.isArray(languages) ? languages : [],
      countries: Array.isArray(countries) ? countries : [],
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolves stream quality priority to integer for sorting.
 * Higher number = better quality.
 */
function getQualityPriority(quality?: string | null): number {
  if (!quality) return 0;
  const q = quality.toLowerCase();
  if (q.includes('4k') || q.includes('2160p')) return 5;
  if (q.includes('1080p') || q.includes('fhd')) return 4;
  if (q.includes('720p') || q.includes('hd')) return 3;
  if (q.includes('576p') || q.includes('480p')) return 2;
  if (q.includes('sd')) return 1;
  return 0;
}

/**
 * Combines the 7 official IPTV-org datasets using channel IDs as primary key.
 * Preserves existing application data model, verified curated streams, and deduplicates.
 */
export function combineIptvOrgMetadata(
  datasets: IptvOrgDatasets,
  curatedBase: Channel[] = CURATED_CHANNELS
): Channel[] {
  const { channels, feeds, logos, streams, categories, languages, countries } = datasets;

  // 1. Build lookup maps for fast O(1) joins
  const streamsByChannel = new Map<string, IptvOrgStreamRaw[]>();
  for (const s of streams) {
    if (!s.channel || !s.url) continue;
    const trimmedUrl = s.url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) continue;

    let list = streamsByChannel.get(s.channel);
    if (!list) {
      list = [];
      streamsByChannel.set(s.channel, list);
    }
    // Deduplicate identical URLs for the same channel
    if (!list.some((existing) => existing.url === trimmedUrl)) {
      list.push({ ...s, url: trimmedUrl });
    }
  }

  const feedsByChannel = new Map<string, IptvOrgFeedRaw[]>();
  for (const f of feeds) {
    if (!f.channel) continue;
    let list = feedsByChannel.get(f.channel);
    if (!list) {
      list = [];
      feedsByChannel.set(f.channel, list);
    }
    list.push(f);
  }

  const logosByChannel = new Map<string, string>();
  for (const l of logos) {
    if (!l.channel || !l.url) continue;
    const current = logosByChannel.get(l.channel);
    // Prefer logos marked as in_use, or set first valid logo
    if (!current || l.in_use) {
      logosByChannel.set(l.channel, l.url);
    }
  }

  // ISO 639-3 Code -> Normalized Language Name
  const langMap = new Map<string, string>();
  for (const lang of languages) {
    if (lang.code && lang.name) {
      langMap.set(lang.code.toLowerCase(), normalizeLanguageName(lang.name));
    }
  }

  // Category ID -> Normalized Category Name
  const catMap = new Map<string, string>();
  for (const cat of categories) {
    if (cat.id && cat.name) {
      catMap.set(cat.id.toLowerCase(), normalizeCategoryName(cat.name));
    }
  }

  // Country Code -> Country Metadata
  const countryMap = new Map<string, { name: string; flag?: string }>();
  for (const c of countries) {
    if (c.code) {
      countryMap.set(c.code.toUpperCase(), { name: c.name, flag: c.flag });
    }
  }

  // Index existing curated channels by ID and URL to preserve verified streams
  const curatedById = new Map<string, Channel>();
  const curatedByTvgId = new Map<string, Channel>();
  const seenUrls = new Set<string>();

  const result: Channel[] = [];

  // Add verified curated channels first
  for (const curated of curatedBase) {
    curatedById.set(curated.id.toLowerCase(), curated);
    if (curated.tvgId) {
      curatedByTvgId.set(curated.tvgId.toLowerCase(), curated);
    }
    seenUrls.add(curated.url);
    result.push({ ...curated, isVerified: true });
  }

  // 2. Iterate through channels.json
  for (const ch of channels) {
    if (!ch.id || !ch.name) continue;
    // Exclude adult NSFW channels
    if (ch.is_nsfw) continue;

    const chStreams = streamsByChannel.get(ch.id);
    // Only include channels that have available stream URLs
    if (!chStreams || chStreams.length === 0) continue;

    // Check if channel already exists in curated list
    const existingCurated =
      curatedById.get(ch.id.toLowerCase()) ||
      (ch.id && curatedByTvgId.get(ch.id.toLowerCase()));

    // Sort streams by quality priority (best quality first)
    const sortedStreams = [...chStreams].sort((a, b) => {
      const pDiff = getQualityPriority(b.quality) - getQualityPriority(a.quality);
      if (pDiff !== 0) return pDiff;
      if (a.feed === 'HD' && b.feed !== 'HD') return -1;
      if (b.feed === 'HD' && a.feed !== 'HD') return 1;
      return 0;
    });

    const streamSources: ChannelStreamSource[] = sortedStreams.map((s) => ({
      url: s.url,
      quality: s.quality || null,
      title: s.title || null,
      feed: s.feed || null,
      labels: s.labels || [],
      user_agent: s.user_agent || null,
      referrer: s.referrer || null,
    }));

    const streamVariants = sortedStreams.map((s) => s.url);

    // Extract languages from feeds.json
    const chFeeds = feedsByChannel.get(ch.id) || [];
    const languageSet = new Set<string>();
    for (const feed of chFeeds) {
      if (Array.isArray(feed.languages)) {
        for (const code of feed.languages) {
          const lower = code.toLowerCase().trim();
          const readable = langMap.get(lower) || normalizeLanguageName(lower);
          if (readable && readable !== 'Unknown') {
            languageSet.add(readable);
          }
        }
      }
    }

    // Extract categories
    const categorySet = new Set<string>();
    if (Array.isArray(ch.categories)) {
      for (const catId of ch.categories) {
        const lower = catId.toLowerCase().trim();
        const readable = catMap.get(lower) || normalizeCategoryName(lower);
        if (readable) {
          categorySet.add(readable);
        }
      }
    }

    // If channel was already in curated list, enrich curated metadata without replacing its verified working URL
    if (existingCurated) {
      const idx = result.findIndex((c) => c.id === existingCurated.id);
      if (idx !== -1) {
        const current = result[idx];
        const mergedCategories = Array.from(
          new Set([...(current.categories || [current.group]), ...categorySet])
        );
        const mergedLanguages = Array.from(
          new Set([...(current.languages || (current.language ? [current.language] : [])), ...languageSet])
        );
        const mergedVariants = Array.from(
          new Set([current.url, ...(current.streamVariants || []), ...streamVariants])
        );

        result[idx] = {
          ...current,
          altNames: ch.alt_names && ch.alt_names.length > 0 ? ch.alt_names : current.altNames,
          website: ch.website || current.website,
          categories: mergedCategories.length > 0 ? mergedCategories : current.categories,
          languages: mergedLanguages.length > 0 ? mergedLanguages : current.languages,
          language: current.language || mergedLanguages[0] || 'Unknown',
          streamVariants: mergedVariants,
          streams: streamSources,
          tvgId: current.tvgId || ch.id,
        };
      }
      continue;
    }

    // Select primary stream URL
    const primaryStream = sortedStreams[0];
    if (!primaryStream || seenUrls.has(primaryStream.url)) {
      // Find first stream URL not already in seenUrls
      const alternate = sortedStreams.find((s) => !seenUrls.has(s.url));
      if (!alternate) continue;
      seenUrls.add(alternate.url);
    } else {
      seenUrls.add(primaryStream.url);
    }

    const primaryUrl = primaryStream.url;
    const countryCode = ch.country ? ch.country.toUpperCase() : undefined;
    const countryInfo = countryCode ? countryMap.get(countryCode) : undefined;
    const logoUrl = logosByChannel.get(ch.id) || '';

    const categoriesArray = Array.from(categorySet);
    const primaryGroup = categoriesArray[0] || 'Uncategorized';

    const languagesArray = Array.from(languageSet);
    if (languagesArray.length === 0) {
      // Last-resort controlled heuristic: channel name keywords for canonical languages
      for (const canon of CANONICAL_LANGUAGES) {
        if (new RegExp(`\\b${canon.name.toLowerCase()}\\b`, 'i').test(ch.name)) {
          languagesArray.push(canon.name);
          break;
        }
      }
    }
    // Explicitly mark unknown as 'Unknown' rather than defaulting to English
    const primaryLanguage = languagesArray[0] || 'Unknown';

    // Best resolution
    let resolution = primaryStream.quality || 'HD';
    if (!primaryStream.quality) {
      const resMatch = (primaryStream.title || ch.name).match(/\b(1080p|720p|576p|480p|4K|2160p|FHD|HD)\b/i);
      if (resMatch) resolution = resMatch[1].toUpperCase();
    }

    result.push({
      id: ch.id,
      name: ch.name,
      logo: logoUrl,
      url: primaryUrl,
      group: primaryGroup,
      categories: categoriesArray.length > 0 ? categoriesArray : ['Uncategorized'],
      country: countryCode,
      countryName: countryInfo?.name || countryCode,
      language: primaryLanguage,
      languages: languagesArray,
      resolution,
      tvgId: ch.id,
      tvgName: ch.name,
      streamVariants,
      streams: streamSources,
      altNames: ch.alt_names || [],
      website: ch.website || undefined,
      isVerified: false,
    });
  }

  return result;
}

/**
 * High-performance catalog loader.
 * Loads cached catalogue from IndexedDB first for instant rendering,
 * and fetches/refreshes from IPTV-org API in background.
 */
export async function loadIptvOrgCatalog(options: {
  forceRefresh?: boolean;
  onProgress?: (step: string) => void;
} = {}): Promise<Channel[]> {
  const { forceRefresh = false, onProgress } = options;

  // 1. If not forcing refresh, check local cache
  if (!forceRefresh) {
    try {
      const cached = await loadCachedChannels();
      if (cached.channels && cached.channels.length > 2000) {
        // Check age: if less than 24h old, return cached
        const ageHours = cached.meta ? (Date.now() - cached.meta.timestamp) / (1000 * 60 * 60) : 999;
        if (ageHours < 24) {
          return cached.channels;
        }
      }
    } catch (cacheErr) {
      console.warn('[EasyTV IPTV-org] Cache check failed:', cacheErr);
    }
  }

  // 2. Fetch fresh datasets from official IPTV-org API
  try {
    if (onProgress) onProgress('Downloading channels, feeds, and stream metadata from IPTV-org...');
    const datasets = await fetchAllIptvOrgDatasets();

    if (onProgress) onProgress('Joining metadata by channel ID and normalizing languages...');
    const combined = combineIptvOrgMetadata(datasets, CURATED_CHANNELS);

    if (combined && combined.length > 0) {
      // Save to IndexedDB cache in background
      saveCachedChannels(combined, 'https://iptv-org.github.io/api').catch((err) => {
        console.warn('[EasyTV IPTV-org] Failed to save catalog cache:', err);
      });
      return combined;
    }
  } catch (apiErr: any) {
    console.warn('[EasyTV IPTV-org] API fetch failed, falling back to cache or curated:', apiErr?.message || apiErr);
  }

  // 3. Fallback: load existing cache if available
  try {
    const cached = await loadCachedChannels();
    if (cached.channels && cached.channels.length > 0) {
      return cached.channels;
    }
  } catch (_) {}

  // 4. Last resort fallback: verified curated channels
  return CURATED_CHANNELS;
}
