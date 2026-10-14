import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Channel, 
  UserPreferences, 
  Category, 
  Country, 
  DeviceMode 
} from './types';
import { 
  DEFAULT_PREFERENCES, 
  loadPreferences, 
  savePreferences, 
  loadCachedChannels, 
  saveCachedChannels 
} from './services/storage';
import { 
  CURATED_CHANNELS, 
  fetchPlaylist, 
  extractCategories, 
  extractCountries 
} from './services/iptv';
import { useHlsPlayer } from './hooks/useHlsPlayer';
import { useTvNavigation } from './hooks/useTvNavigation';
import { Header } from './components/Header';
import { Player } from './components/Player';
import { ChannelBrowser } from './components/ChannelBrowser';
import { EasyModeHero } from './components/EasyModeHero';
import { VirtualRemote } from './components/VirtualRemote';
import { SettingsModal } from './components/SettingsModal';
import { FireTvGuideModal } from './components/FireTvGuideModal';

export default function App() {
  // 1. Preferences & Persistence
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());
  const [channels, setChannels] = useState<Channel[]>(CURATED_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(() => {
    // Check if there was a last watched channel
    const saved = loadPreferences();
    if (saved.lastWatchedChannelId) {
      const match = CURATED_CHANNELS.find((c) => c.id === saved.lastWatchedChannelId);
      if (match) return match;
    }
    return CURATED_CHANNELS[0];
  });

  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recents'>('all');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFireTvGuideOpen, setIsFireTvGuideOpen] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  // 2. Responsive device detector
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (preferences.deviceModeOverride !== 'auto') {
        setDeviceMode(preferences.deviceModeOverride);
      } else if (width < 640) {
        setDeviceMode('mobile');
      } else if (width < 1024) {
        setDeviceMode('tablet');
      } else if (width >= 1600) {
        setDeviceMode('tv');
      } else {
        setDeviceMode('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [preferences.deviceModeOverride]);

  // 3. Save preferences whenever they change
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      savePreferences(next);
      return next;
    });
  }, []);

  // 4. Video Player hook
  const {
    videoRef,
    playerState,
    togglePlay,
    toggleMute,
    setVolume,
    setQuality,
    setAspectRatio,
    retryPlayback,
  } = useHlsPlayer({
    streamUrl: selectedChannel?.url || null,
    preferredQuality: preferences.preferredQuality,
    preferredAspectRatio: preferences.preferredAspectRatio,
    onPlaybackSuccess: () => {
      if (selectedChannel) {
        // Record recent
        updatePreferences({
          lastWatchedChannelId: selectedChannel.id,
          recentChannels: [
            { channelId: selectedChannel.id, timestamp: Date.now() },
            ...preferences.recentChannels.filter((r) => r.channelId !== selectedChannel.id),
          ].slice(0, 20),
        });
      }
    },
  });

  // 5. Load cached channels on mount and check for background refresh
  useEffect(() => {
    let isMounted = true;

    async function initChannels() {
      // 1. Try loading cached catalogue first for instant startup
      const cached = await loadCachedChannels();
      if (isMounted && cached.channels && cached.channels.length > 0) {
        setChannels(cached.channels);
        if (cached.meta) {
          updatePreferences({ lastCatalogueUpdate: cached.meta.timestamp });
        }
      }

      // 2. If no cache or cache older than 24 hours, perform background fetch
      const lastUpdate = cached.meta?.timestamp || preferences.lastCatalogueUpdate || 0;
      const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);

      if (hoursSinceUpdate > 24 || !cached.channels || cached.channels.length === 0) {
        refreshChannelsSilently();
      }
    }

    initChannels();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual or automatic refresh
  const refreshChannels = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fetched = await fetchPlaylist(preferences.activePlaylistUrl);
      if (fetched && fetched.length > 0) {
        setChannels(fetched);
        await saveCachedChannels(fetched, preferences.activePlaylistUrl);
        updatePreferences({ lastCatalogueUpdate: Date.now() });
      }
    } catch (err) {
      console.warn('[EasyTV] Channel refresh notice (preserving cached catalogue):', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [preferences.activePlaylistUrl, updatePreferences]);

  const refreshChannelsSilently = useCallback(async () => {
    try {
      const fetched = await fetchPlaylist(preferences.activePlaylistUrl);
      if (fetched && fetched.length > 0) {
        setChannels(fetched);
        await saveCachedChannels(fetched, preferences.activePlaylistUrl);
        updatePreferences({ lastCatalogueUpdate: Date.now() });
      }
    } catch (err) {
      console.warn('[EasyTV] Background refresh failed silently:', err);
    }
  }, [preferences.activePlaylistUrl, updatePreferences]);

  // Categories and countries derived from channels
  const categories = useMemo(() => extractCategories(channels), [channels]);
  const countries = useMemo(() => extractCountries(channels), [channels]);

  // Filtered channels list for navigation
  const currentFilteredList = useMemo(() => {
    let list = channels;
    if (activeTab === 'favorites') {
      const favSet = new Set(preferences.favorites);
      list = list.filter((ch) => favSet.has(ch.id));
    } else if (activeTab === 'recents') {
      const recIds = preferences.recentChannels.map((r) => r.channelId);
      list = recIds
        .map((id) => channels.find((c) => c.id === id))
        .filter((c): c is Channel => Boolean(c));
    }

    if (preferences.selectedCategory && preferences.selectedCategory !== 'all') {
      list = list.filter(
        (ch) => (ch.group || '').toLowerCase() === preferences.selectedCategory.toLowerCase()
      );
    }

    if (preferences.selectedCountry && preferences.selectedCountry !== 'all') {
      list = list.filter((ch) => ch.country === preferences.selectedCountry);
    }

    if (preferences.searchQuery.trim()) {
      const q = preferences.searchQuery.toLowerCase().trim();
      list = list.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          (ch.group || '').toLowerCase().includes(q) ||
          (ch.countryName || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    channels,
    activeTab,
    preferences.favorites,
    preferences.recentChannels,
    preferences.selectedCategory,
    preferences.selectedCountry,
    preferences.searchQuery,
  ]);

  // Channel switching
  const handleSelectChannel = useCallback(
    (channel: Channel) => {
      setSelectedChannel(channel);
      updatePreferences({ lastWatchedChannelId: channel.id });
    },
    [updatePreferences]
  );

  const handleNextChannel = useCallback(() => {
    if (channels.length === 0) return;
    const currIdx = channels.findIndex((c) => c.id === selectedChannel?.id);
    const nextIdx = (currIdx + 1) % channels.length;
    handleSelectChannel(channels[nextIdx]);
  }, [channels, selectedChannel, handleSelectChannel]);

  const handlePrevChannel = useCallback(() => {
    if (channels.length === 0) return;
    const currIdx = channels.findIndex((c) => c.id === selectedChannel?.id);
    const prevIdx = currIdx - 1 < 0 ? channels.length - 1 : currIdx - 1;
    handleSelectChannel(channels[prevIdx]);
  }, [channels, selectedChannel, handleSelectChannel]);

  // Favorite toggle
  const handleToggleFavorite = useCallback(
    (channelId: string) => {
      const isFav = preferences.favorites.includes(channelId);
      const nextFavs = isFav
        ? preferences.favorites.filter((id) => id !== channelId)
        : [...preferences.favorites, channelId];
      updatePreferences({ favorites: nextFavs });
    },
    [preferences.favorites, updatePreferences]
  );

  // TV Remote Navigation Handlers
  useTvNavigation(
    {
      onUp: () => {
        setFocusedIndex((prev) => Math.max(0, prev - 4));
      },
      onDown: () => {
        setFocusedIndex((prev) => Math.min(currentFilteredList.length - 1, prev + 4));
      },
      onLeft: () => {
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      },
      onRight: () => {
        setFocusedIndex((prev) => Math.min(currentFilteredList.length - 1, prev + 1));
      },
      onSelect: () => {
        if (currentFilteredList[focusedIndex]) {
          handleSelectChannel(currentFilteredList[focusedIndex]);
        }
      },
      onBack: () => {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isFireTvGuideOpen) {
          setIsFireTvGuideOpen(false);
        } else if (preferences.searchQuery) {
          updatePreferences({ searchQuery: '' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      onPlayPause: togglePlay,
      onChannelNext: handleNextChannel,
      onChannelPrev: handlePrevChannel,
      onMuteToggle: toggleMute,
    },
    true
  );

  // Recent channel objects
  const recentChannelList = useMemo(() => {
    return preferences.recentChannels
      .map((r) => channels.find((c) => c.id === r.channelId))
      .filter((c): c is Channel => Boolean(c));
  }, [preferences.recentChannels, channels]);

  // Favorite channel objects
  const favoriteChannelList = useMemo(() => {
    const favSet = new Set(preferences.favorites);
    return channels.filter((c) => favSet.has(c.id));
  }, [preferences.favorites, channels]);

  return (
    <div
      className={`min-h-screen transition-colors ${
        preferences.highContrast
          ? 'bg-black text-white'
          : 'bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-black'
      } ${preferences.largeText ? 'text-lg' : 'text-base'}`}
    >
      {/* Top Accessible Header */}
      <Header
        preferences={preferences}
        onUpdatePreferences={updatePreferences}
        onRefreshChannels={refreshChannels}
        isRefreshing={isRefreshing}
        channelCount={channels.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFireTvGuide={() => setIsFireTvGuideOpen(true)}
        activeDeviceMode={deviceMode}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Elder-Friendly Easy Mode Hero */}
        {preferences.easyMode && (
          <EasyModeHero
            lastWatchedChannel={
              selectedChannel ||
              recentChannelList[0] ||
              channels[0] ||
              null
            }
            favoriteChannels={favoriteChannelList}
            recentChannels={recentChannelList}
            onPlayChannel={handleSelectChannel}
            onRefresh={refreshChannels}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSelectCategory={(cat) => updatePreferences({ selectedCategory: cat })}
            isRefreshing={isRefreshing}
            highContrast={preferences.highContrast}
          />
        )}

        {/* Video Player Section */}
        <section aria-label="Video Player Section" className="w-full">
          <Player
            channel={selectedChannel}
            playerState={playerState}
            videoRef={videoRef}
            isFavorite={selectedChannel ? preferences.favorites.includes(selectedChannel.id) : false}
            onToggleFavorite={handleToggleFavorite}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
            onSetVolume={setVolume}
            onSetQuality={setQuality}
            onSetAspectRatio={setAspectRatio}
            onRetry={retryPlayback}
            onNextChannel={handleNextChannel}
            highContrast={preferences.highContrast}
            largeText={preferences.largeText}
          />
        </section>

        {/* Channel Browser & Navigation */}
        <ChannelBrowser
          channels={channels}
          selectedChannel={selectedChannel}
          favorites={preferences.favorites}
          recentIds={preferences.recentChannels.map((r) => r.channelId)}
          categories={categories}
          countries={countries}
          selectedCategory={preferences.selectedCategory}
          selectedCountry={preferences.selectedCountry}
          searchQuery={preferences.searchQuery}
          activeTab={activeTab}
          focusedIndex={focusedIndex}
          onSelectChannel={handleSelectChannel}
          onToggleFavorite={handleToggleFavorite}
          onSelectCategory={(cat) => updatePreferences({ selectedCategory: cat })}
          onSelectCountry={(c) => updatePreferences({ selectedCountry: c })}
          onSearchChange={(q) => updatePreferences({ searchQuery: q })}
          onChangeTab={setActiveTab}
          highContrast={preferences.highContrast}
          largeText={preferences.largeText}
        />
      </main>

      {/* Virtual Fire TV Stick Lite Remote Overlay (Toggleable in Header) */}
      {preferences.virtualRemoteVisible && (
        <VirtualRemote
          onUp={() => setFocusedIndex((prev) => Math.max(0, prev - 4))}
          onDown={() =>
            setFocusedIndex((prev) => Math.min(currentFilteredList.length - 1, prev + 4))
          }
          onLeft={() => setFocusedIndex((prev) => Math.max(0, prev - 1))}
          onRight={() =>
            setFocusedIndex((prev) => Math.min(currentFilteredList.length - 1, prev + 1))
          }
          onSelect={() => {
            if (currentFilteredList[focusedIndex]) {
              handleSelectChannel(currentFilteredList[focusedIndex]);
            }
          }}
          onBack={() => {
            if (preferences.searchQuery) {
              updatePreferences({ searchQuery: '' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onPlayPause={togglePlay}
          onChannelNext={handleNextChannel}
          onChannelPrev={handlePrevChannel}
          onMuteToggle={toggleMute}
          onVolumeUp={() => setVolume(playerState.volume + 0.1)}
          onVolumeDown={() => setVolume(playerState.volume - 0.1)}
          onClose={() => updatePreferences({ virtualRemoteVisible: false })}
          isPlaying={playerState.isPlaying}
          isMuted={playerState.isMuted}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={updatePreferences}
        onRefreshCatalogue={refreshChannels}
        isRefreshing={isRefreshing}
        channelCount={channels.length}
      />

      {/* Fire TV APK & Android Build Guide Modal */}
      <FireTvGuideModal
        isOpen={isFireTvGuideOpen}
        onClose={() => setIsFireTvGuideOpen(false)}
        highContrast={preferences.highContrast}
      />
    </div>
  );
}
