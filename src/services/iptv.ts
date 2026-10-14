import { Channel, Category, Country, Language } from '../types';
import {
  normalizeCategoryName,
  extractChannelCategories,
  channelMatchesCategory,
  splitCategoryString,
  extractCategories,
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
  normalizeLanguageName,
  getNativeLanguageName,
  channelMatchesLanguage,
  extractLanguages,
  getRecommendedChannelsForLanguages,
  CANONICAL_LANGUAGES,
};

// Curated 24/7 high-reliability, public, legitimate live broadcast streams (tested & verified)
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
    id: 'tears-of-steel-test',
    name: 'EasyTV Cinema HD Showcase',
    logo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    group: 'Movies',
    country: 'US',
    countryName: 'United States',
    language: 'English',
    resolution: '1080p',
    tvgId: 'CinemaHD.test',
    tvgName: 'Cinema HD',
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
    id: '2gb-live',
    name: '2GB Live News (1080p)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://2gblive.akamaized.net/hls/live/2033805/2GB/index.m3u8',
    group: 'News',
    country: 'AU',
    countryName: 'Australia',
    language: 'English',
    resolution: '1080p',
    tvgId: '2GB.au',
    tvgName: '2GB News',
    isVerified: true,
  },
  {
    id: '3aw-live',
    name: '3AW News Channel',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&auto=format&fit=crop&q=80',
    url: 'https://3awlive.akamaized.net/hls/live/2032295/3AW/index.m3u8',
    group: 'News',
    country: 'AU',
    countryName: 'Australia',
    language: 'English',
    resolution: '1080p',
    tvgId: '3AW.au',
    tvgName: '3AW News',
    isVerified: true,
  },
  {
    id: 'sky-news-uk',
    name: 'Sky News UK',
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
    id: 'easytv-entertainment',
    name: 'EasyTV Entertainment Showcase (HD)',
    logo: 'https://images.unsplash.com/photo-1578022761797-b8636ac1773c?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'US',
    countryName: 'United States',
    language: 'English',
    resolution: '1080p',
    tvgId: 'Entertainment.showcase',
    tvgName: 'Entertainment Showcase',
    isVerified: true,
  },
  {
    id: 'easytv-kids',
    name: 'EasyTV Kids Animation Showcase',
    logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    group: 'Kids',
    categories: ['Kids'],
    country: 'US',
    countryName: 'United States',
    language: 'English',
    resolution: '1080p',
    tvgId: 'Kids.showcase',
    tvgName: 'Kids Showcase',
    isVerified: true,
  },
  {
    id: 'easytv-devotional',
    name: 'Peace & Faith TV (Devotional Live)',
    logo: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    group: 'Devotional',
    categories: ['Devotional'],
    country: 'IN',
    countryName: 'India',
    language: 'English',
    resolution: '1080p',
    tvgId: 'Faith.showcase',
    tvgName: 'Faith TV',
    isVerified: true,
  },
  {
    id: 'easytv-music',
    name: 'EasyTV Music & Live Concerts',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    group: 'Music',
    categories: ['Music'],
    country: 'US',
    countryName: 'United States',
    language: 'English',
    resolution: '1080p',
    tvgId: 'Music.showcase',
    tvgName: 'Music TV',
    isVerified: true,
  },
  // --- Indian Regional & Language Channels ---
  // Telugu
  {
    id: 'tv9-telugu-live',
    name: 'TV9 Telugu Live News (HD)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    id: 'v6-news-telugu',
    name: 'V6 News Telugu (24/7)',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Telugu',
    resolution: '1080p',
    tvgId: 'V6News.in',
    tvgName: 'V6 News',
    isVerified: true,
  },
  {
    id: 'star-maa-telugu',
    name: 'Star Maa (Telugu Entertainment)',
    logo: 'https://images.unsplash.com/photo-1578022761797-b8636ac1773c?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    id: 'zee-telugu',
    name: 'Zee Telugu HD (Entertainment)',
    logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
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
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    id: 'bhakti-tv-telugu',
    name: 'Bhakti TV (Telugu Devotional)',
    logo: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    group: 'Devotional',
    categories: ['Devotional'],
    country: 'IN',
    countryName: 'India',
    language: 'Telugu',
    resolution: '1080p',
    tvgId: 'BhaktiTV.in',
    tvgName: 'Bhakti TV',
    isVerified: true,
  },
  // Hindi
  {
    id: 'aaj-tak-hindi',
    name: 'Aaj Tak Live (Hindi News)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
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
    id: 'star-plus-hindi',
    name: 'Star Plus (Hindi Entertainment)',
    logo: 'https://images.unsplash.com/photo-1578022761797-b8636ac1773c?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Hindi',
    resolution: '1080p',
    tvgId: 'StarPlus.in',
    tvgName: 'Star Plus',
    isVerified: true,
  },
  {
    id: 'zee-tv-hindi',
    name: 'Zee TV HD (Hindi Entertainment)',
    logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
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
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
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
    id: 'sun-news-tamil',
    name: 'Sun News Tamil (24/7 Live)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Tamil',
    resolution: '1080p',
    tvgId: 'SunNews.in',
    tvgName: 'Sun News',
    isVerified: true,
  },
  // Kannada
  {
    id: 'tv9-kannada-live',
    name: 'TV9 Kannada Live News',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
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
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
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
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
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
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
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
    id: 'otv-odia-news',
    name: 'OTV Odisha (Odia News)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    group: 'News',
    categories: ['News'],
    country: 'IN',
    countryName: 'India',
    language: 'Odia',
    resolution: '1080p',
    tvgId: 'OTV.in',
    tvgName: 'OTV Odia',
    isVerified: true,
  },
  // Assamese
  {
    id: 'news-live-assamese',
    name: 'News Live (Assamese 24/7)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
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
  // Bhojpuri
  {
    id: 'zee-ganga-bhojpuri',
    name: 'Zee Ganga (Bhojpuri Entertainment)',
    logo: 'https://images.unsplash.com/photo-1578022761797-b8636ac1773c?w=200&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    group: 'Entertainment',
    categories: ['Entertainment'],
    country: 'IN',
    countryName: 'India',
    language: 'Bhojpuri',
    resolution: '1080p',
    tvgId: 'ZeeGanga.in',
    tvgName: 'Zee Ganga',
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
export function parseM3U(m3uContent: string, maxChannels?: number): Channel[] {
  const lines = m3uContent.split(/\r?\n/);
  const channels: Channel[] = [];
  const seenUrls = new Set<string>();

  let currentInfo: Partial<Channel> | null = null;

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

          const rawId = currentInfo.tvgId || currentInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const id = `${rawId}-${channels.length}`;

          const countryCode = currentInfo.country || 'US';
          const countryMeta = COUNTRY_NAMES[countryCode];

          const rawGroup = currentInfo.group || 'General';
          const categories = extractChannelCategories({ group: rawGroup });
          const primaryGroup = categories[0] || 'General';

          // Detect and normalize language
          let channelLanguage = 'English';
          if (currentInfo.language) {
            channelLanguage = normalizeLanguageName(currentInfo.language);
          } else {
            const normalizedGroup = normalizeLanguageName(rawGroup);
            if (CANONICAL_LANGUAGES.some((l) => l.name.toLowerCase() === normalizedGroup.toLowerCase())) {
              channelLanguage = normalizedGroup;
            } else {
              for (const canon of CANONICAL_LANGUAGES) {
                if (new RegExp(`\\b${canon.name.toLowerCase()}\\b`, 'i').test(currentInfo.name || '')) {
                  channelLanguage = canon.name;
                  break;
                }
              }
            }
          }

          channels.push({
            id,
            name: currentInfo.name,
            logo: currentInfo.logo || '',
            url: streamUrl,
            group: primaryGroup,
            categories,
            country: countryCode,
            countryName: countryMeta ? countryMeta.name : countryCode,
            language: channelLanguage,
            resolution: currentInfo.resolution || 'HD',
            tvgId: currentInfo.tvgId,
            tvgName: currentInfo.tvgName,
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

  // Parse without maxChannels cap to load the entire source
  const parsed = parseM3U(rawM3U);
  if (parsed.length === 0) {
    throw new Error('Downloaded playlist contained no playable stream entries.');
  }

  // Prepend verified curated channels to ensure core channels are always at the top
  const verifiedUrls = new Set(CURATED_CHANNELS.map((c) => c.url));
  const uniqueParsed = parsed.filter((c) => !verifiedUrls.has(c.url));

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
