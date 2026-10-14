export interface ChannelStreamSource {
  url: string;
  quality?: string | null;
  title?: string | null;
  feed?: string | null;
  labels?: string[];
  user_agent?: string | null;
  referrer?: string | null;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string; // Primary category (e.g. News, Entertainment, Sports)
  categories?: string[]; // Normalized categories list
  country?: string; // Country code e.g. "US", "UK", "FR"
  countryName?: string;
  language?: string; // Primary broadcast language display name
  languages?: string[]; // All broadcast languages for this channel
  resolution?: string; // e.g. "1080p", "720p", "576p"
  tvgId?: string;
  tvgName?: string;
  streamVariants?: string[];
  streams?: ChannelStreamSource[]; // Detailed stream sources from IPTV-org
  altNames?: string[];
  website?: string;
  isVerified?: boolean;
  viewCount?: number;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface RankedCategory extends Category {
  streamCount: number;
  viewCount: number;
  score: number;
}

export interface CategoryRankingResult {
  categories: RankedCategory[];
  rankingSource: 'user_views' | 'catalog_signals';
  label: string;
  description: string;
  hasGenuineUsageData: boolean;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export type AspectRatioMode = 'original' | 'fit' | 'fill';

export interface QualityLevel {
  index: number;
  height: number;
  width: number;
  bitrate: number;
  label: string;
}

export interface PlayerState {
  isPlaying: boolean;
  isBuffering: boolean;
  isAutoplayBlocked: boolean;
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  aspectRatio: AspectRatioMode;
  qualityLevels: QualityLevel[];
  currentQualityIndex: number; // -1 = Auto
  activeQualityLabel: string;
  measuredResolution?: string;
  error: string | null;
  statusMessage?: string;
  diagnostics?: {
    lastErrorType?: string;
    lastErrorDetails?: string;
    isProxied?: boolean;
    streamUrl?: string;
  };
  retryCount: number;
}

export interface Language {
  id: string;
  name: string;
  nativeName?: string;
  count: number;
}

export type DeviceMode = 'auto' | 'mobile' | 'tablet' | 'desktop' | 'tv';

export interface UserPreferences {
  favorites: string[]; // List of channel IDs
  recentChannels: { channelId: string; timestamp: number }[];
  lastWatchedChannelId: string | null;
  channelViews?: Record<string, number>; // Real play/watch counts per channel ID
  selectedCategory: string;
  selectedCountry: string;
  selectedLanguage?: string; // Filter catalog by language
  preferredLanguages: string[]; // User's preferred languages for personalization
  hasCompletedLanguageOnboarding: boolean;
  searchQuery: string;
  highContrast: boolean;
  largeText: boolean;
  easyMode: boolean; // Elder-friendly simplified navigation
  preferredAspectRatio: AspectRatioMode;
  preferredQuality: string; // 'auto', '1080p', '720p', etc.
  deviceModeOverride: DeviceMode;
  virtualRemoteVisible: boolean;
  activePlaylistUrl: string;
  lastCatalogueUpdate: number | null;
}
