import { Channel, Category, Country, Language } from '../types';
import {
  normalizeCategoryName,
  extractChannelCategories,
  channelMatchesCategory,
  splitCategoryString,
  extractCategories,
  getChannelCanonicalCategory,
  groupChannelsByCategory,
  CategoryGroup,
  MY_LIST_CATEGORY_ORDER,
} from './categories';
import {
  normalizeLanguageName,
  getNativeLanguageName,
  channelMatchesLanguage,
  extractLanguages,
  getRecommendedChannelsForLanguages,
  CANONICAL_LANGUAGES,
} from './languages';

export {
  normalizeCategoryName,
  extractChannelCategories,
  channelMatchesCategory,
  splitCategoryString,
  extractCategories,
  getChannelCanonicalCategory,
  groupChannelsByCategory,
  MY_LIST_CATEGORY_ORDER,
  normalizeLanguageName,
  getNativeLanguageName,
  channelMatchesLanguage,
  extractLanguages,
  getRecommendedChannelsForLanguages,
  CANONICAL_LANGUAGES,
};
export type { CategoryGroup };

// Curated 24/7 high-reliability, public, legitimate live broadcast streams (tested & verified)
export const CURATED_CHANNELS: Channel[] = [
  {
    id: 'dw-news-en',
    name: 'DW News Live (English)',
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
    id: '3cat-info',
    name: '3Cat Info News (1080p)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/3Cat_logo.svg',
    url: 'https://directes-tv-int.3catdirectes.cat/live-origin/canal324-hls/master.m3u8',
    group: 'News',
    country: 'ES',
    countryName: 'Spain',
    language: 'Catalan',
    resolution: '1080p',
    tvgId: '3CatInfo.es',
    tvgName: '3Cat Info',
    isVerified: true,
  },
  {
    id: 'redbull-tv',
    name: 'Red Bull TV Sports & Action',
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
    id: 'nhk-world-japan',
    name: 'NHK World Japan',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/87/NHK_World-Japan_logo.svg',
    url: 'http://170.83.16.50/NHK_WORLD/index.m3u8',
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
    url: 'https://d2e1asnsl7br7b.cloudfront.net/7782e205e72f43aeb4a48ec97f66ebbe/index.m3u8',
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
    id: 'tv9-telugu-live',
    name: 'TV9 Telugu Live News (HD)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://dyjmyiv3bp2ez.cloudfront.net/pub-iotv9telcmjhcs/liveabr/playlist.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Telugu',
    resolution: '1080p',
    tvgId: 'TV9Telugu.in',
    tvgName: 'TV9 Telugu',
    isVerified: true,
  },
  {
    id: 'star-maa-telugu',
    name: 'Star Maa (Telugu Entertainment)',
    logo: 'https://images.unsplash.com/photo-1578022761797-b8636ac1773c?w=200&auto=format&fit=crop&q=80',
    url: 'https://da86m1sqpm3o0.cloudfront.net/28072023/smil:starmaa1.smil/chunklist_b2628000.m3u8',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Telugu',
    resolution: '1080p',
    tvgId: 'StarMaa.in',
    tvgName: 'Star Maa',
    isVerified: true,
  },
  {
    id: 'star-maa-movies-hd',
    name: 'Star Maa Movies HD',
    logo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&auto=format&fit=crop&q=80',
    url: 'https://da86m1sqpm3o0.cloudfront.net/28072023/smil:maamovies.smil/chunklist_b2628000.m3u8',
    group: 'Movies',
    categories: ['Movies'],
    country: 'IN',
    countryName: 'India',
    language: 'Telugu',
    resolution: '1080p',
    tvgId: 'StarMaaMovies.in',
    tvgName: 'Star Maa Movies',
    isVerified: true,
  },
  {
    id: 'zee-telugu',
    name: 'Zee Telugu HD (Entertainment)',
    logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
    url: 'https://raw.githubusercontent.com/amazeyourself/adaptive-streams/refs/heads/main/streams/in/YuppTV/ZeeTeluguHD.m3u8',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Telugu',
    resolution: '1080p',
    tvgId: 'ZeeTelugu.in',
    tvgName: 'Zee Telugu',
    isVerified: true,
  },
  {
    id: 'sun-gemini-tv',
    name: 'Sun Gemini TV Telugu',
    logo: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&auto=format&fit=crop&q=80',
    url: 'http://ptuf.ridsys.in/riptv/live/GEMINI_TV/index.m3u8',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Telugu',
    resolution: '1080p',
    tvgId: 'GeminiTV.in',
    tvgName: 'Sun Gemini TV',
    isVerified: true,
  },
  {
    id: 'aaj-tak-hindi',
    name: 'Aaj Tak Live (Hindi News)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Hindi',
    resolution: '1080p',
    tvgId: 'AajTak.in',
    tvgName: 'Aaj Tak',
    isVerified: true,
  },
  {
    id: 'ndtv-india-hindi',
    name: 'NDTV India (Hindi News HD)',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&auto=format&fit=crop&q=80',
    url: 'https://raw.githubusercontent.com/amazeyourself/adaptive-streams/refs/heads/main/streams/in/YuppTV/NDTVIndia.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Hindi',
    resolution: '1080p',
    tvgId: 'NDTVIndia.in',
    tvgName: 'NDTV India',
    isVerified: true,
  },
  {
    id: 'zee-tv-hindi',
    name: 'Zee TV HD (Hindi Entertainment)',
    logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
    url: 'http://103.151.60.162:2122/play/a01u/index.m3u8?hls',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Hindi',
    resolution: '1080p',
    tvgId: 'ZeeTV.in',
    tvgName: 'Zee TV',
    isVerified: true,
  },
  {
    id: 'aastha-tv-hindi',
    name: 'Aastha TV (Hindi Devotional)',
    logo: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=200&auto=format&fit=crop&q=80',
    url: 'https://aasthaott.akamaized.net/110923/smil:aasthatv.smil/index.m3u8',
    group: 'Devotional',
    categories: ['Devotional'],
    country: 'IN',
    countryName: 'India',
    language: 'Hindi',
    resolution: '1080p',
    tvgId: 'AasthaTV.in',
    tvgName: 'Aastha TV',
    isVerified: true,
  },
  // Tamil
  {
    id: 'sun-tv-tamil',
    name: 'Sun TV (Tamil Entertainment HD)',
    logo: 'https://images.unsplash.com/photo-1578022761797-b8636ac1773c?w=200&auto=format&fit=crop&q=80',
    url: 'https://d2px1d6ssc60fw.cloudfront.net/SunTV/SunTV-HDR10-IN-index.m3u8',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Tamil',
    resolution: '1080p',
    tvgId: 'SunTV.in',
    tvgName: 'Sun TV',
    isVerified: true,
  },
  {
    id: 'star-vijay-tamil',
    name: 'Star Vijay (Tamil Entertainment)',
    logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
    url: 'https://da86m1sqpm3o0.cloudfront.net/28072023/smil:starvijayuk.smil/playlist.m3u8',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Tamil',
    resolution: '1080p',
    tvgId: 'StarVijay.in',
    tvgName: 'Star Vijay',
    isVerified: true,
  },
  {
    id: 'tv9-kannada-live',
    name: 'TV9 Kannada Live News',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://dyjmyiv3bp2ez.cloudfront.net/pub-iotv9kanmo6oiq/liveabr/playlist.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Kannada',
    resolution: '1080p',
    tvgId: 'TV9Kannada.in',
    tvgName: 'TV9 Kannada',
    isVerified: true,
  },
  {
    id: 'zee-kannada',
    name: 'Zee Kannada (Entertainment)',
    logo: 'https://images.unsplash.com/photo-1578022761797-b8636ac1773c?w=200&auto=format&fit=crop&q=80',
    url: 'https://yuppnimresmum.akamaized.net/28072023/smil:zeekannadahd.smil/playlist.m3u8?hdnts=st=1735898689~exp=1835898688~acl=*~hmac=f5fe24724fe05481e3841f9eb5ab8efdee0a3dd83645ae9dcf45703f525bab7b',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Kannada',
    resolution: '1080p',
    tvgId: 'ZeeKannada.in',
    tvgName: 'Zee Kannada',
    isVerified: true,
  },
  // Malayalam
  {
    id: 'asianet-news-malayalam',
    name: 'Asianet News Malayalam (Live)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://amg13737-amg13737c1-amgplt0016.playout.now3.amagi.tv/playlist/amg13737-amg13737c1-amgplt0016/playlist.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Malayalam',
    resolution: '1080p',
    tvgId: 'AsianetNews.in',
    tvgName: 'Asianet News',
    isVerified: true,
  },
  {
    id: 'asianet-malayalam',
    name: 'Asianet (Malayalam Entertainment)',
    logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
    url: 'https://da86m1sqpm3o0.cloudfront.net/28072023/smil:starasianet.smil/chunklist_b1928000.m3u8',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Malayalam',
    resolution: '1080p',
    tvgId: 'Asianet.in',
    tvgName: 'Asianet TV',
    isVerified: true,
  },
  // Bengali
  {
    id: 'abp-ananda-bengali',
    name: 'ABP Ananda (Bengali News)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://d2l4ar6y3mrs4k.cloudfront.net/live-streaming/ananda-livetv/master.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Bengali',
    resolution: '1080p',
    tvgId: 'ABPAnanda.in',
    tvgName: 'ABP Ananda',
    isVerified: true,
  },
  // Marathi
  {
    id: 'abp-majha-marathi',
    name: 'ABP Majha (Marathi News)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://yupprestreamliveus.akamaized.net/vglive-sk-355289/majha/master.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Marathi',
    resolution: '1080p',
    tvgId: 'ABPMajha.in',
    tvgName: 'ABP Majha',
    isVerified: true,
  },
  // Gujarati
  {
    id: 'abp-asmita-gujarati',
    name: 'ABP Asmita (Gujarati News)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://d2l4ar6y3mrs4k.cloudfront.net/live-streaming/asmita-livetv/master.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Gujarati',
    resolution: '1080p',
    tvgId: 'ABPAsmita.in',
    tvgName: 'ABP Asmita',
    isVerified: true,
  },
  // Punjabi
  {
    id: 'ptc-news-punjabi',
    name: 'PTC News (Punjabi Live)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://streams.tangotv.in/PTCNEWS/ORIGIN/index.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Punjabi',
    resolution: '1080p',
    tvgId: 'PTCNews.in',
    tvgName: 'PTC News',
    isVerified: true,
  },
  // Odia
  {
    id: 'news-live-assamese',
    name: 'News Live (Assamese 24/7)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://prideeast.thelegitpro.in/newslive/newslive/index.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Assamese',
    resolution: '1080p',
    tvgId: 'NewsLive.in',
    tvgName: 'News Live Assam',
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
  KR: { name: 'South Korea', flag: '🇰🇷' },
  NL: { name: 'Netherlands', flag: '🇳🇱' },
  SE: { name: 'Sweden', flag: '🇸🇪' },
  NO: { name: 'Norway', flag: '🇳🇴' },
  FI: { name: 'Finland', flag: '🇫🇮' },
  DK: { name: 'Denmark', flag: '🇩🇰' },
  PL: { name: 'Poland', flag: '🇵🇱' },
  TR: { name: 'Turkey', flag: '🇹🇷' },
  GR: { name: 'Greece', flag: '🇬🇷' },
  PT: { name: 'Portugal', flag: '🇵🇹' },
  AR: { name: 'Argentina', flag: '🇦🇷' },
  CL: { name: 'Chile', flag: '🇨🇱' },
  CO: { name: 'Colombia', flag: '🇨🇴' },
};

export const POPULAR_PLAYLIST_SOURCES = [
  { id: 'iptv-org-main', name: 'IPTV-org Full Index (~11,000+ channels)', url: 'https://iptv-org.github.io/iptv/index.m3u' },
  { id: 'iptv-org-news', name: 'IPTV-org Global News (~1,000 channels)', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
  { id: 'iptv-org-us', name: 'IPTV-org United States (~1,500 channels)', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  { id: 'iptv-org-uk', name: 'IPTV-org United Kingdom (~500 channels)', url: 'https://iptv-org.github.io/iptv/countries/uk.m3u' },
  { id: 'curated', name: 'EasyTV Verified Curated Channels', url: 'curated' },
];

/**
 * Fast, unconstrained M3U playlist parser.
 * Processes the entire downloaded playlist without arbitrary limits.
 */
/**
 * Subset of the iptv-org public API channel record (channels.json).
 * The M3U playlist only carries tvg-id, logo and group-title, so this metadata
 * is used to fill in the country / language / category information the app
 * filters and personalizes on.
 */
export interface IptvChannelMetadata {
  id: string;
  name?: string;
  country?: string;
  languages?: string[];
  categories?: string[];
  is_nsfw?: boolean;
}

const IPTV_ORG_CHANNELS_API = 'https://iptv-org.github.io/api/channels.json';
const IPTV_ORG_LANGUAGE_PLAYLIST = 'https://iptv-org.github.io/iptv/index.language.m3u';
let channelMetadataPromise: Promise<Map<string, IptvChannelMetadata>> | null = null;
let languageMapPromise: Promise<Map<string, string>> | null = null;

function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal, headers: { Accept: '*/*' } })
    .then((res) => (res.ok ? (res.json() as Promise<T>) : null))
    .catch(() => null)
    .finally(() => clearTimeout(timer));
}

/** Downloads (once per session) the iptv-org channel metadata map. Never throws. */
export function fetchIptvOrgChannelMetadata(timeoutMs = 15000): Promise<Map<string, IptvChannelMetadata>> {
  if (!channelMetadataPromise) {
    channelMetadataPromise = (async () => {
      const data = await fetchJsonWithTimeout<IptvChannelMetadata[]>(IPTV_ORG_CHANNELS_API, timeoutMs);
      const map = new Map<string, IptvChannelMetadata>();
      if (Array.isArray(data)) {
        for (const entry of data) {
          if (entry && typeof entry.id === 'string') {
            map.set(entry.id, entry);
          }
        }
      }
      if (map.size === 0) {
        console.warn('[EasyTV IPTV] Channel metadata unavailable, continuing with playlist data only');
      }
      return map;
    })();
  }
  return channelMetadataPromise;
}

/**
 * iptv-org publishes the same catalogue grouped by spoken language
 * (`index.language.m3u`). Its group-title is the language name, which is the
 * only public source of per-channel language data, so it is joined on tvg-id.
 */
export function fetchIptvOrgLanguageMap(timeoutMs = 15000): Promise<Map<string, string>> {
  if (!languageMapPromise) {
    languageMapPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const map = new Map<string, string>();
      try {
        const res = await fetch(IPTV_ORG_LANGUAGE_PLAYLIST, { signal: controller.signal });
        if (!res.ok) return map;

        const text = await res.text();
        for (const line of text.split(/\r?\n/)) {
          if (!line.startsWith('#EXTINF:')) continue;
          const idMatch = line.match(/tvg-id="([^"]*)"/i);
          const groupMatch = line.match(/group-title="([^"]*)"/i);
          if (!idMatch || !groupMatch || !idMatch[1] || !groupMatch[1]) continue;
          const base = tvgIdBase(idMatch[1]);
          if (base && !map.has(base)) map.set(base, groupMatch[1]);
        }
      } catch (err) {
        console.warn('[EasyTV IPTV] Could not load iptv-org language map:', err);
      } finally {
        clearTimeout(timer);
      }
      return map;
    })();
  }
  return languageMapPromise;
}

/** `StarMaa.in@HD` -> `StarMaa.in` */
function tvgIdBase(tvgId?: string): string {
  return (tvgId || '').split('@')[0].trim();
}

/** iptv-org encodes the country in the channel id: `StarMaa.in@HD` -> `IN`. */
function countryFromTvgId(tvgId?: string): string | undefined {
  const match = tvgIdBase(tvgId).match(/\.([a-zA-Z]{2})$/);
  return match ? match[1].toUpperCase() : undefined;
}

/** Small deterministic hash so channel ids stay stable across playlist refreshes. */
function stableHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * Parses an M3U/M3U8 IPTV playlist into Channel records.
 *
 * Works with the iptv-org index playlist format:
 *   #EXTINF:-1 tvg-id="StarMaa.in@SD" tvg-logo="..." group-title="Entertainment",Star Maa
 *   https://...
 *
 * Country, language and categories are resolved from (in order) the playlist
 * attributes, the iptv-org metadata map, the tvg-id country suffix, and finally
 * name heuristics.
 */
export function parseM3U(
  m3uContent: string,
  maxChannels?: number,
  metadata?: Map<string, IptvChannelMetadata>,
  languageMap?: Map<string, string>
): Channel[] {
  const lines = m3uContent.split(/\r?\n/);
  const channels: Channel[] = [];
  const seenUrls = new Set<string>();
  const usedIds = new Set<string>();

  let currentInfo: Partial<Channel> | null = null;

  const buildId = (tvgId: string | undefined, name: string, url: string): string => {
    const base = tvgId && tvgId.trim()
      ? tvgId.trim()
      : `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${stableHash(url)}`;

    if (!usedIds.has(base)) {
      usedIds.add(base);
      return base;
    }

    // Same tvg-id served from a different URL (backup source): keep it unique but stable.
    const fallback = `${base}#${stableHash(url)}`;
    usedIds.add(fallback);
    return fallback;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentInfo = {};

      // Parse tvg attributes
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

        // Deduplicate only identical URLs
        if (!seenUrls.has(streamUrl)) {
          seenUrls.add(streamUrl);

          const info = currentInfo;
          const channelName = info.name as string;
          const meta = metadata?.get(tvgIdBase(info.tvgId));

          // Country: playlist attribute -> iptv-org metadata -> tvg-id suffix -> US
          const countryCode = (
            info.country ||
            meta?.country ||
            countryFromTvgId(info.tvgId) ||
            'US'
          ).toUpperCase();
          const countryMeta = COUNTRY_NAMES[countryCode];

          // Category: playlist group-title, falling back to iptv-org categories
          let rawGroup = info.group && info.group.trim();
          if (!rawGroup || /^(undefined|uncategorized|unknown|other)$/i.test(rawGroup)) {
            rawGroup = meta?.categories && meta.categories.length > 0
              ? meta.categories.join(';')
              : 'General';
          }
          const categories = extractChannelCategories({ group: rawGroup });
          const primaryGroup = categories[0] || 'General';

          // Language: playlist attribute -> iptv-org language playlist -> API -> name heuristics
          let channelLanguage: string | undefined;
          if (info.language) {
            channelLanguage = normalizeLanguageName(info.language);
          } else {
            const languageFromPlaylist = languageMap?.get(tvgIdBase(info.tvgId));
            if (languageFromPlaylist) {
              channelLanguage = normalizeLanguageName(languageFromPlaylist);
            } else if (meta?.languages && meta.languages.length > 0) {
              channelLanguage = normalizeLanguageName(meta.languages[0]);
            }
          }

          if (!channelLanguage) {
            const normalizedGroup = normalizeLanguageName(rawGroup);
            if (CANONICAL_LANGUAGES.some((l) => l.name.toLowerCase() === normalizedGroup.toLowerCase())) {
              channelLanguage = normalizedGroup;
            } else {
              for (const canon of CANONICAL_LANGUAGES) {
                if (new RegExp(`\\b${canon.name.toLowerCase()}\\b`, 'i').test(channelName)) {
                  channelLanguage = canon.name;
                  break;
                }
              }
            }
          }

          channelLanguage = channelLanguage || 'English';

          channels.push({
            id: buildId(info.tvgId, channelName, streamUrl),
            name: channelName,
            logo: info.logo || '',
            url: streamUrl,
            group: primaryGroup,
            categories,
            country: countryCode,
            countryName: countryMeta ? countryMeta.name : countryCode,
            language: channelLanguage,
            resolution: info.resolution || 'HD',
            tvgId: info.tvgId,
            tvgName: info.tvgName || meta?.name,
          });

          if (maxChannels && channels.length >= maxChannels) {
            break;
          }
        }

        currentInfo = null;
      }
    }
  }

  return channels;
}

/**
 * Fetch playlist from URL with CORS fallback and timeout.
 * Replaces cached data only when valid channels are parsed.
 */
export async function fetchPlaylist(url: string): Promise<Channel[]> {
  if (url === 'curated' || !url) {
    return CURATED_CHANNELS;
  }

  const timeoutMs = 25000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let rawM3U = '';
  let succeeded = false;

  // The playlist and the iptv-org metadata are downloaded in parallel: the
  // metadata is what gives each channel its correct country/language/category.
  const metadataPromise = fetchIptvOrgChannelMetadata(20000);
  const languageMapPromise = fetchIptvOrgLanguageMap(20000);

  // 1. Try direct fetch first (IPTV-org on GitHub Pages has Access-Control-Allow-Origin: *)
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

  if (!succeeded || !rawM3U || !rawM3U.includes('#EXTM3U')) {
    throw new Error('Unable to download playlist. Please check your network connection.');
  }

  const withTimeout = <T>(promise: Promise<T>, fallback: T) =>
    Promise.race([
      promise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 10000)),
    ]);

  const [metadata, languageMap] = await Promise.all([
    withTimeout(metadataPromise, new Map<string, IptvChannelMetadata>()),
    withTimeout(languageMapPromise, new Map<string, string>()),
  ]);

  // Parse without maxChannels cap to load the entire source
  const parsed = parseM3U(rawM3U, undefined, metadata, languageMap);
  if (parsed.length === 0) {
    throw new Error('Downloaded playlist contained no playable stream entries.');
  }

  // Prepend verified curated channels to ensure core channels are always at the top,
  // skipping playlist entries that duplicate a curated channel (same tvg-id or URL).
  const verifiedUrls = new Set(CURATED_CHANNELS.map((c) => c.url));
  const curatedTvgIds = new Set(
    CURATED_CHANNELS.map((c) => tvgIdBase(c.tvgId).toLowerCase()).filter(Boolean)
  );

  const uniqueParsed = parsed.filter((c) => {
    if (verifiedUrls.has(c.url)) return false;
    const base = tvgIdBase(c.tvgId).toLowerCase();
    if (base && curatedTvgIds.has(base)) return false;
    return true;
  });

  return [...CURATED_CHANNELS, ...uniqueParsed];
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
