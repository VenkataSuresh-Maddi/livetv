import { Channel, Category, Country } from '../types';

// Curated 24/7 high-reliability, public, legitimate live broadcast streams
export const CURATED_CHANNELS: Channel[] = [
  {
    id: 'nasa-tv',
    name: 'NASA TV Live (HD)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
    url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    group: 'Science',
    country: 'US',
    countryName: 'United States',
    language: 'English',
    resolution: '1080p',
    tvgId: 'NASA.us',
    tvgName: 'NASA TV',
    isVerified: true,
  },
  {
    id: 'bloomberg-us',
    name: 'Bloomberg TV News',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Bloomberg_News_logo.svg',
    url: 'https://liveprodupmx.akamaized.net/us/Channel-UPMX-US-HLS/master.m3u8',
    group: 'News',
    country: 'US',
    countryName: 'United States',
    language: 'English',
    resolution: '1080p',
    tvgId: 'BloombergTV.us',
    tvgName: 'Bloomberg TV',
    isVerified: true,
  },
  {
    id: 'sky-news-uk',
    name: 'Sky News Live',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Sky_News_2020.svg',
    url: 'https://linear417-gb-dash1-prd-cf.cdn.sky.com/instances/1/41701/manifest.m3u8',
    group: 'News',
    country: 'UK',
    countryName: 'United Kingdom',
    language: 'English',
    resolution: '1080p',
    tvgId: 'SkyNews.uk',
    tvgName: 'Sky News',
    isVerified: true,
  },
  {
    id: 'france-24-en',
    name: 'France 24 English',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/France_24_logo.svg',
    url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8',
    group: 'News',
    country: 'FR',
    countryName: 'France',
    language: 'English',
    resolution: '720p',
    tvgId: 'France24English.fr',
    tvgName: 'France 24 EN',
    isVerified: true,
  },
  {
    id: 'dw-news-en',
    name: 'DW News (Deutsche Welle)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Deutsche_Welle_symbol_2012.svg',
    url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    group: 'News',
    country: 'DE',
    countryName: 'Germany',
    language: 'English',
    resolution: '720p',
    tvgId: 'DWNews.de',
    tvgName: 'DW News',
    isVerified: true,
  },
  {
    id: 'al-jazeera-en',
    name: 'Al Jazeera English',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Aljazeera_eng.svg',
    url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
    group: 'News',
    country: 'QA',
    countryName: 'Qatar',
    language: 'English',
    resolution: '1080p',
    tvgId: 'AlJazeeraEnglish.qa',
    tvgName: 'Al Jazeera EN',
    isVerified: true,
  },
  {
    id: 'euronews-en',
    name: 'Euronews English',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Euronews_2016_logo.svg',
    url: 'https://euronews-euronews-world-1-au.samsung.wurl.tv/playlist.m3u8',
    group: 'News',
    country: 'EU',
    countryName: 'Europe',
    language: 'English',
    resolution: '1080p',
    tvgId: 'EuronewsEnglish.fr',
    tvgName: 'Euronews EN',
    isVerified: true,
  },
  {
    id: 'redbull-tv',
    name: 'Red Bull TV',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Red_Bull_TV_logo.svg',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    group: 'Sports',
    country: 'AT',
    countryName: 'Austria',
    language: 'English',
    resolution: '1080p',
    tvgId: 'RedBullTV.at',
    tvgName: 'Red Bull TV',
    isVerified: true,
  },
  {
    id: 'nhk-world-japan',
    name: 'NHK World Japan',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/87/NHK_World-Japan_logo.svg',
    url: 'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/global/2003458/live.m3u8',
    group: 'General',
    country: 'JP',
    countryName: 'Japan',
    language: 'English',
    resolution: '1080p',
    tvgId: 'NHKWorldJapan.jp',
    tvgName: 'NHK World Japan',
    isVerified: true,
  },
  {
    id: 'cna-singapore',
    name: 'CNA (Channel NewsAsia)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/62/CNA_%28news_channel%29_logo.svg',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/7788/live/live.m3u8',
    group: 'News',
    country: 'SG',
    countryName: 'Singapore',
    language: 'English',
    resolution: '1080p',
    tvgId: 'CNA.sg',
    tvgName: 'CNA',
    isVerified: true,
  },
  {
    id: 'rtve-24h',
    name: 'RTVE 24 Horas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Canal_24_horas_2008.svg',
    url: 'https://rtvelivestream.akamaized.net/rtvesec/24h/24h_main.m3u8',
    group: 'News',
    country: 'ES',
    countryName: 'Spain',
    language: 'Spanish',
    resolution: '1080p',
    tvgId: 'Canal24Horas.es',
    tvgName: 'RTVE 24h',
    isVerified: true,
  },
  {
    id: 'tagesschau-24',
    name: 'Tagesschau 24',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Tagesschau24_2022_logo.svg',
    url: 'https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8',
    group: 'News',
    country: 'DE',
    countryName: 'Germany',
    language: 'German',
    resolution: '720p',
    tvgId: 'Tagesschau24.de',
    tvgName: 'Tagesschau 24',
    isVerified: true,
  },
  {
    id: 'france-info',
    name: 'France Info TV',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Franceinfo_logo.svg',
    url: 'https://static.franceinfo.fr/live/franceinfo_hls/live.m3u8',
    group: 'News',
    country: 'FR',
    countryName: 'France',
    language: 'French',
    resolution: '720p',
    tvgId: 'FranceInfo.fr',
    tvgName: 'France Info',
    isVerified: true,
  },
  {
    id: 'tears-of-steel-test',
    name: 'EasyTV Ultra HD Test Stream',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Tears_of_Steel_poster.jpg',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    group: 'Movies',
    country: 'US',
    countryName: 'United States',
    language: 'English',
    resolution: '1080p',
    tvgId: 'EasyTvTest.hd',
    tvgName: 'Ultra HD Test',
    isVerified: true,
  },
  {
    id: 'big-buck-bunny-test',
    name: 'EasyTV Animation Showcase',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    group: 'Animation',
    country: 'US',
    countryName: 'United States',
    language: 'English',
    resolution: '1080p',
    tvgId: 'EasyTvAnim.test',
    tvgName: 'Animation Showcase',
    isVerified: true,
  },
];

// Popular country mappings
export const COUNTRY_NAMES: Record<string, { name: string; flag: string }> = {
  US: { name: 'United States', flag: '🇺🇸' },
  UK: { name: 'United Kingdom', flag: '🇬🇧' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  AU: { name: 'Australia', flag: '🇦🇺' },
  FR: { name: 'France', flag: '🇫🇷' },
  DE: { name: 'Germany', flag: '🇩🇪' },
  ES: { name: 'Spain', flag: '🇪🇸' },
  IT: { name: 'Italy', flag: '🇮🇹' },
  JP: { name: 'Japan', flag: '🇯🇵' },
  QA: { name: 'Qatar', flag: '🇶🇦' },
  SG: { name: 'Singapore', flag: '🇸🇬' },
  AT: { name: 'Austria', flag: '🇦🇹' },
  BR: { name: 'Brazil', flag: '🇧🇷' },
  IN: { name: 'India', flag: '🇮🇳' },
  MX: { name: 'Mexico', flag: '🇲🇽' },
  EU: { name: 'Europe', flag: '🇪🇺' },
};

export const POPULAR_PLAYLIST_SOURCES = [
  { id: 'curated', name: 'EasyTV Verified Channels (Instant)', url: 'curated' },
  { id: 'iptv-org-news', name: 'IPTV-org Global News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
  { id: 'iptv-org-us', name: 'IPTV-org United States', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  { id: 'iptv-org-uk', name: 'IPTV-org United Kingdom', url: 'https://iptv-org.github.io/iptv/countries/uk.m3u' },
  { id: 'iptv-org-main', name: 'IPTV-org Full Index (~8000+ channels)', url: 'https://iptv-org.github.io/iptv/index.m3u' },
];

/**
 * Fast, resilient M3U playlist parser
 */
export function parseM3U(m3uContent: string, maxChannels = 1500): Channel[] {
  const lines = m3uContent.split(/\r?\n/);
  const channels: Channel[] = [];
  const seenIds = new Set<string>();

  let currentInfo: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentInfo = {};

      // Parse tvg attributes using regex
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/i);
      const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/i);
      const tvgLanguageMatch = line.match(/tvg-language="([^"]*)"/i);

      if (tvgIdMatch && tvgIdMatch[1]) currentInfo.tvgId = tvgIdMatch[1];
      if (tvgNameMatch && tvgNameMatch[1]) currentInfo.tvgName = tvgNameMatch[1];
      if (tvgLogoMatch && tvgLogoMatch[1]) currentInfo.logo = tvgLogoMatch[1];
      if (groupTitleMatch && groupTitleMatch[1]) currentInfo.group = groupTitleMatch[1];
      if (tvgCountryMatch && tvgCountryMatch[1]) currentInfo.country = tvgCountryMatch[1].toUpperCase();
      if (tvgLanguageMatch && tvgLanguageMatch[1]) currentInfo.language = tvgLanguageMatch[1];

      // Extract channel title after last comma
      const lastCommaIndex = line.lastIndexOf(',');
      if (lastCommaIndex !== -1 && lastCommaIndex < line.length - 1) {
        currentInfo.name = line.substring(lastCommaIndex + 1).trim();
      }

      // If name is still missing, fallback to tvgName
      if (!currentInfo.name && currentInfo.tvgName) {
        currentInfo.name = currentInfo.tvgName;
      }

      // Parse resolution hints if present in title
      const resMatch = (currentInfo.name || '').match(/\b(1080p|720p|576p|480p|4K|2160p|FHD|HD)\b/i);
      if (resMatch) {
        currentInfo.resolution = resMatch[1].toUpperCase();
      }
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentInfo && currentInfo.name) {
        const streamUrl = line.trim();
        const rawId = currentInfo.tvgId || currentInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const id = seenIds.has(rawId) ? `${rawId}-${channels.length}` : rawId;
        seenIds.add(id);

        const countryCode = currentInfo.country || 'US';
        const countryMeta = COUNTRY_NAMES[countryCode];

        channels.push({
          id,
          name: currentInfo.name,
          logo: currentInfo.logo || '',
          url: streamUrl,
          group: currentInfo.group || 'General',
          country: countryCode,
          countryName: countryMeta ? countryMeta.name : countryCode,
          language: currentInfo.language || 'English',
          resolution: currentInfo.resolution || 'HD',
          tvgId: currentInfo.tvgId,
          tvgName: currentInfo.tvgName,
        });

        currentInfo = null;

        if (channels.length >= maxChannels) {
          break;
        }
      }
    }
  }

  return channels;
}

/**
 * Fetch playlist from URL with CORS fallback and timeout
 */
export async function fetchPlaylist(url: string): Promise<Channel[]> {
  if (url === 'curated' || !url) {
    return CURATED_CHANNELS;
  }

  const timeoutMs = 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let rawM3U = '';
  let succeeded = false;

  // 1. Try direct fetch first
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: '*/*' },
    });
    if (res.ok) {
      rawM3U = await res.text();
      succeeded = true;
    }
  } catch (directErr) {
    console.warn('[EasyTV IPTV] Direct fetch failed (likely CORS or network), trying proxy:', directErr);
  } finally {
    clearTimeout(timer);
  }

  // 2. Fallback to proxy if direct fetch failed
  if (!succeeded || !rawM3U.includes('#EXTM3U')) {
    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        rawM3U = await proxyRes.text();
        succeeded = true;
      }
    } catch (proxyErr) {
      console.warn('[EasyTV IPTV] Proxy fetch also failed:', proxyErr);
    }
  }

  if (!succeeded || !rawM3U) {
    throw new Error('Unable to download playlist. Please check your network connection.');
  }

  const parsed = parseM3U(rawM3U);
  if (parsed.length === 0) {
    throw new Error('Downloaded playlist contained no playable stream entries.');
  }

  // Deduplicate and merge with verified channels to ensure reliable top channels
  const merged: Channel[] = [...CURATED_CHANNELS];
  const existingIds = new Set(merged.map((c) => c.id));

  for (const ch of parsed) {
    if (!existingIds.has(ch.id)) {
      existingIds.add(ch.id);
      merged.push(ch);
    }
  }

  return merged;
}

/**
 * Extract unique categories and their channel counts
 */
export function extractCategories(channels: Channel[]): Category[] {
  const counts: Record<string, number> = {};
  for (const ch of channels) {
    const grp = ch.group || 'General';
    counts[grp] = (counts[grp] || 0) + 1;
  }

  const list: Category[] = Object.keys(counts)
    .sort()
    .map((name) => ({
      id: name.toLowerCase(),
      name,
      count: counts[name],
    }));

  return [{ id: 'all', name: 'All Categories', count: channels.length }, ...list];
}

/**
 * Extract unique countries from channel list
 */
export function extractCountries(channels: Channel[]): Country[] {
  const codeSet = new Set<string>();
  for (const ch of channels) {
    if (ch.country) {
      codeSet.add(ch.country);
    }
  }

  const list: Country[] = Array.from(codeSet)
    .map((code) => {
      const meta = COUNTRY_NAMES[code];
      return {
        code,
        name: meta ? meta.name : code,
        flag: meta ? meta.flag : '🌐',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return [{ code: 'all', name: 'All Countries', flag: '🌍' }, ...list];
}
