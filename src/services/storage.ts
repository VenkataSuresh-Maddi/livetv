import { Channel, UserPreferences, AspectRatioMode, DeviceMode } from '../types';

const PREFS_KEY = 'easytv_preferences_v2';
const CHANNELS_CACHE_KEY = 'easytv_channels_cache_v2';
const CHANNELS_CACHE_META_KEY = 'easytv_channels_cache_meta_v2';
const DB_NAME = 'EasyTV_DB_v2';
const DB_VERSION = 2;

export const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
  recentChannels: [],
  lastWatchedChannelId: null,
  selectedCategory: 'all',
  selectedCountry: 'all',
  selectedLanguage: 'all',
  preferredLanguages: [],
  hasCompletedLanguageOnboarding: false,
  searchQuery: '',
  highContrast: false,
  largeText: false,
  easyMode: false,
  preferredAspectRatio: 'original',
  preferredQuality: 'auto',
  deviceModeOverride: 'auto',
  virtualRemoteVisible: false,
  activePlaylistUrl: 'https://iptv-org.github.io/iptv/index.m3u',
  lastCatalogueUpdate: null,
};

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (err) {
    console.warn('[EasyTV Storage] Could not read preferences from localStorage:', err);
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('[EasyTV Storage] Could not save preferences to localStorage:', err);
  }
}

export interface CatalogueCacheMetadata {
  timestamp: number;
  channelCount: number;
  sourceUrl: string;
}

// Save complete channels to IndexedDB (with localStorage fallback for lightweight data)
export async function saveCachedChannels(channels: Channel[], sourceUrl: string): Promise<void> {
  if (!channels || channels.length === 0) return;

  const meta: CatalogueCacheMetadata = {
    timestamp: Date.now(),
    channelCount: channels.length,
    sourceUrl,
  };

  try {
    if (window.indexedDB) {
      const db = await openIDB();
      const tx = db.transaction('channels_store', 'readwrite');
      const store = tx.objectStore('channels_store');
      store.put(channels, 'cached_catalogue');
      store.put(meta, 'cached_meta');
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return;
    }
  } catch (idbErr) {
    console.warn('[EasyTV Storage] IndexedDB save failed, attempting localStorage:', idbErr);
  }

  // Fallback to localStorage if IndexedDB is disabled
  try {
    // Only compress / trim for localStorage if browser throws QuotaExceededError
    localStorage.setItem(CHANNELS_CACHE_META_KEY, JSON.stringify(meta));
    localStorage.setItem(CHANNELS_CACHE_KEY, JSON.stringify(channels.slice(0, 3000)));
  } catch (lsErr) {
    console.warn('[EasyTV Storage] localStorage save failed:', lsErr);
  }
}

export async function loadCachedChannels(): Promise<{ channels: Channel[]; meta: CatalogueCacheMetadata | null }> {
  try {
    if (window.indexedDB) {
      const db = await openIDB();
      const tx = db.transaction('channels_store', 'readonly');
      const store = tx.objectStore('channels_store');

      const channelsReq = store.get('cached_catalogue');
      const metaReq = store.get('cached_meta');

      const result = await new Promise<{ channels: Channel[]; meta: CatalogueCacheMetadata | null }>((resolve) => {
        tx.oncomplete = () => {
          resolve({
            channels: channelsReq.result || [],
            meta: metaReq.result || null,
          });
        };
        tx.onerror = () => {
          resolve({ channels: [], meta: null });
        };
      });

      if (result.channels && result.channels.length > 0) {
        return result;
      }
    }
  } catch (idbErr) {
    console.warn('[EasyTV Storage] IndexedDB load failed, falling back to localStorage:', idbErr);
  }

  // Fallback to localStorage
  try {
    const rawMeta = localStorage.getItem(CHANNELS_CACHE_META_KEY);
    const rawChannels = localStorage.getItem(CHANNELS_CACHE_KEY);
    if (rawChannels) {
      return {
        channels: JSON.parse(rawChannels),
        meta: rawMeta ? JSON.parse(rawMeta) : null,
      };
    }
  } catch (lsErr) {
    console.warn('[EasyTV Storage] localStorage load failed:', lsErr);
  }

  return { channels: [], meta: null };
}

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('channels_store')) {
        db.createObjectStore('channels_store');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
