export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string; // Category (e.g. News, Entertainment, Sports)
  country?: string; // Country code e.g. "US", "UK", "FR"
  countryName?: string;
  language?: string;
  resolution?: string; // e.g. "1080p", "720p", "576p"
  tvgId?: string;
  tvgName?: string;
  streamVariants?: string[];
  isVerified?: boolean;
}

export interface Category {
  id: string;
  name: string;
  count: number;
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
  retryCount: number;
}

export type DeviceMode = 'auto' | 'mobile' | 'tablet' | 'desktop' | 'tv';

export interface UserPreferences {
  favorites: string[]; // List of channel IDs
  recentChannels: { channelId: string; timestamp: number }[];
  lastWatchedChannelId: string | null;
  selectedCategory: string;
  selectedCountry: string;
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
