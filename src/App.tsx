import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  extractCountries,
  channelMatchesCategory,
} from './services/iptv';
import { useHlsPlayer } from './hooks/useHlsPlayer';
import { useTvNavigation } from './hooks/useTvNavigation';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { NetflixRow } from './components/NetflixRow';
import { Player } from './components/Player';
import { CatalogBrowser } from './components/CatalogBrowser';
import { SettingsModal } from './components/SettingsModal';
import { FireTvGuideModal } from './components/FireTvGuideModal';
import { VirtualRemote } from './components/VirtualRemote';
import { 
  Radio, 
  Clock, 
  Star, 
  Tv, 
  Film, 
  Trophy, 
  Newspaper, 
  Music, 
  Compass, 
  RotateCw, 
  CheckCircle2, 
  Sparkles, 
  Layers,
  Smile,
  Heart,
  Folder,
  FolderOpen,
  X
} from 'lucide-react';

export default function App() {
  // 1. Preferences & Persistence
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());
  const [channels, setChannels] = useState<Channel[]>(CURATED_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(() => CURATED_CHANNELS[0]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'home' | 'player' | 'categories' | 'favorites' | 'recents'>('home');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshProgressMsg, setRefreshProgressMsg] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFireTvGuideOpen, setIsFireTvGuideOpen] = useState<boolean>(false);

  // Update preferences helper
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      savePreferences(next);
      return next;
    });
  }, []);

  // Stable playback success handler
  const handlePlaybackSuccess = useCallback(() => {
    if (!selectedChannel) return;
    setPreferences((prev) => {
      if (
        prev.lastWatchedChannelId === selectedChannel.id &&
        prev.recentChannels[0]?.channelId === selectedChannel.id
      ) {
        return prev;
      }
      const updatedRecents = [
        { channelId: selectedChannel.id, timestamp: Date.now() },
        ...prev.recentChannels.filter((r) => r.channelId !== selectedChannel.id),
      ].slice(0, 30);

      const next = {
        ...prev,
        lastWatchedChannelId: selectedChannel.id,
        recentChannels: updatedRecents,
      };
      savePreferences(next);
      return next;
    });
  }, [selectedChannel]);

  // Video Player Hook
  const {
    videoRef,
    playerState,
    togglePlay,
    toggleMute,
    setVolume,
    volumeUp,
    volumeDown,
    seek,
    setQuality,
    setAspectRatio,
    retryPlayback,
  } = useHlsPlayer({
    streamUrl: selectedChannel?.url || null,
    preferredQuality: preferences.preferredQuality,
    preferredAspectRatio: preferences.preferredAspectRatio,
    onPlaybackSuccess: handlePlaybackSuccess,
  });

  // Manual or automatic refresh logic (resolves state-timing bug by taking optional overrideUrl)
  const refreshChannels = useCallback(
    async (overrideUrl?: string) => {
      const targetUrl = overrideUrl || preferences.activePlaylistUrl;
      setIsRefreshing(true);
      setRefreshProgressMsg('Fetching full live TV playlist...');

      try {
        const fetched = await fetchPlaylist(targetUrl);
        if (fetched && fetched.length > 0) {
          setRefreshProgressMsg(`Indexing ${fetched.length.toLocaleString()} channels...`);
          setChannels(fetched);
          await saveCachedChannels(fetched, targetUrl);
          updatePreferences({
            lastCatalogueUpdate: Date.now(),
            activePlaylistUrl: targetUrl,
          });
        }
      } catch (err) {
        console.warn('[EasyTV] Channel refresh notice (retaining existing catalogue):', err);
      } finally {
        setIsRefreshing(false);
        setRefreshProgressMsg(null);
      }
    },
    [preferences.activePlaylistUrl, updatePreferences]
  );

  // Initial catalogue load on mount
  useEffect(() => {
    let isMounted = true;

    async function initChannels() {
      // 1. Try loading cached catalogue first for instant startup
      const cached = await loadCachedChannels();
      if (isMounted && cached.channels && cached.channels.length > 0) {
        setChannels(cached.channels);
        if (cached.meta) {
          setPreferences((prev) => {
            if (prev.lastCatalogueUpdate === cached.meta!.timestamp) return prev;
            const next = { ...prev, lastCatalogueUpdate: cached.meta!.timestamp };
            savePreferences(next);
            return next;
          });
        }

        // If cached catalogue is small (old 1,515 cap) and active playlist is full index, auto-refresh to get all 11,000+
        if (cached.channels.length < 5000 && preferences.activePlaylistUrl.includes('index.m3u')) {
          refreshChannels();
          return;
        }
      } else {
        // No cache yet, fetch initial catalogue
        refreshChannels();
      }

      // 2. Background update check (every 24 hours)
      const lastUpdate = cached.meta?.timestamp || preferences.lastCatalogueUpdate || 0;
      const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
      if (hoursSinceUpdate > 24) {
        refreshChannels();
      }
    }

    initChannels();

    return () => {
      isMounted = false;
    };
  }, []);

  // Categories and countries derived from channels
  const categories = useMemo(() => extractCategories(channels), [channels]);
  const countries = useMemo(() => extractCountries(channels), [channels]);

  // Safe back from player handler: exits fullscreen if open and returns to home view
  const handleBackFromPlayer = useCallback(() => {
    const isFs = document.fullscreenElement || (document as any).webkitFullscreenElement;
    if (isFs) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen().catch(() => {});
      }
    }
    setActiveTab('home');
    try {
      if (window.location.hash === '#player') {
        window.history.replaceState({ tab: 'home' }, '', window.location.pathname + window.location.search);
      }
    } catch (_) {}
  }, []);

  // Channel selection with safe browser history integration
  const handleSelectChannel = useCallback(
    (channel: Channel) => {
      setSelectedChannel(channel);
      setActiveTab('player');
      updatePreferences({ lastWatchedChannelId: channel.id });
      try {
        if (window.location.hash !== '#player') {
          window.history.pushState({ tab: 'player', channelId: channel.id }, '', '#player');
        }
      } catch (_) {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [updatePreferences]
  );

  // Browser back navigation sync
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash !== '#player') {
        const isFs = document.fullscreenElement || (document as any).webkitFullscreenElement;
        if (isFs) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        }
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // TV Remote Navigation (only enabled when outside player tab to prevent duplicate keyboard adjustments)
  useTvNavigation(
    {
      onSelect: () => {
        if (selectedChannel) {
          handleSelectChannel(selectedChannel);
        }
      },
      onPlayPause: () => {
        if (selectedChannel) {
          handleSelectChannel(selectedChannel);
        }
      },
      onChannelNext: handleNextChannel,
      onChannelPrev: handlePrevChannel,
      onMuteToggle: toggleMute,
      onUp: volumeUp,
      onDown: volumeDown,
      onBack: handleBackFromPlayer,
    },
    activeTab !== 'player'
  );

  // Filtered lists for Netflix-style carousels
  const recentChannels = useMemo(() => {
    return preferences.recentChannels
      .map((r) => channels.find((c) => c.id === r.channelId))
      .filter((c): c is Channel => Boolean(c));
  }, [preferences.recentChannels, channels]);

  const favoriteChannels = useMemo(() => {
    const favSet = new Set(preferences.favorites);
    return channels.filter((c) => favSet.has(c.id));
  }, [preferences.favorites, channels]);

  // Dynamic genre channel lists based strictly on channel metadata
  const newsChannels = useMemo(() => {
    return channels.filter((c) => channelMatchesCategory(c, 'News'));
  }, [channels]);

  const sportsChannels = useMemo(() => {
    return channels.filter((c) => channelMatchesCategory(c, 'Sports'));
  }, [channels]);

  const movieChannels = useMemo(() => {
    return channels.filter((c) => channelMatchesCategory(c, 'Movies'));
  }, [channels]);

  const entertainmentChannels = useMemo(() => {
    return channels.filter((c) => channelMatchesCategory(c, 'Entertainment'));
  }, [channels]);

  const musicChannels = useMemo(() => {
    return channels.filter((c) => channelMatchesCategory(c, 'Music'));
  }, [channels]);

  const kidsChannels = useMemo(() => {
    return channels.filter((c) => channelMatchesCategory(c, 'Kids'));
  }, [channels]);

  const devotionalChannels = useMemo(() => {
    return channels.filter((c) => channelMatchesCategory(c, 'Devotional'));
  }, [channels]);

  const documentaryChannels = useMemo(() => {
    return channels.filter((c) => channelMatchesCategory(c, 'Documentary'));
  }, [channels]);

  // Related channels in current playing channel's category
  const relatedChannels = useMemo(() => {
    if (!selectedChannel) return [];
    return channels
      .filter((c) => c.id !== selectedChannel.id && channelMatchesCategory(c, selectedChannel.group))
      .slice(0, 24);
  }, [channels, selectedChannel]);

  return (
    <div className="min-h-screen bg-[#141414] text-zinc-100 selection:bg-red-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        channelCount={channels.length}
        searchQuery={preferences.searchQuery}
        onSearchChange={(q) => {
          updatePreferences({ searchQuery: q });
          if (q.trim() && activeTab !== 'home' && activeTab !== 'player') {
            setActiveTab('home');
          }
        }}
        onRefreshChannels={() => refreshChannels()}
        isRefreshing={isRefreshing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        favoritesCount={preferences.favorites.length}
        recentsCount={recentChannels.length}
      />

      {/* Global Refresh Notification Banner */}
      {isRefreshing && (
        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-lg">
          <RotateCw className="w-4 h-4 animate-spin" />
          <span>{refreshProgressMsg || 'Refreshing catalogue from live IPTV source...'}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-8">
        {/* VIEW 1: PLAYER VIEW */}
        {activeTab === 'player' && (
          <div className="space-y-8 animate-fadeIn">
            <Player
              channel={selectedChannel}
              playerState={playerState}
              videoRef={videoRef}
              isFavorite={selectedChannel ? preferences.favorites.includes(selectedChannel.id) : false}
              onToggleFavorite={handleToggleFavorite}
              onTogglePlay={togglePlay}
              onToggleMute={toggleMute}
              onSetVolume={setVolume}
              onVolumeUp={volumeUp}
              onVolumeDown={volumeDown}
              onSeek={seek}
              onSetQuality={setQuality}
              onSetAspectRatio={setAspectRatio}
              onRetry={retryPlayback}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
              onBack={handleBackFromPlayer}
              relatedChannels={relatedChannels}
              onSelectChannel={handleSelectChannel}
            />

            {/* Quick Catalog Explorer below Player */}
            <CatalogBrowser
              channels={channels}
              selectedChannel={selectedChannel}
              favorites={preferences.favorites}
              categories={categories}
              countries={countries}
              selectedCategory={preferences.selectedCategory}
              selectedCountry={preferences.selectedCountry}
              searchQuery={preferences.searchQuery}
              onSelectChannel={handleSelectChannel}
              onToggleFavorite={handleToggleFavorite}
              onSelectCategory={(cat) => updatePreferences({ selectedCategory: cat })}
              onSelectCountry={(c) => updatePreferences({ selectedCountry: c })}
              onSearchChange={(q) => updatePreferences({ searchQuery: q })}
            />
          </div>
        )}

        {/* VIEW 2: HOME VIEW (Netflix Billboard + Horizontal Carousels) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* If searching, prioritize the search catalog grid directly */}
            {preferences.searchQuery.trim() ? (
              <CatalogBrowser
                channels={channels}
                selectedChannel={selectedChannel}
                favorites={preferences.favorites}
                categories={categories}
                countries={countries}
                selectedCategory={preferences.selectedCategory}
                selectedCountry={preferences.selectedCountry}
                searchQuery={preferences.searchQuery}
                onSelectChannel={handleSelectChannel}
                onToggleFavorite={handleToggleFavorite}
                onSelectCategory={(cat) => updatePreferences({ selectedCategory: cat })}
                onSelectCountry={(c) => updatePreferences({ selectedCountry: c })}
                onSearchChange={(q) => updatePreferences({ searchQuery: q })}
              />
            ) : (
              <>
                {/* Netflix Hero Billboard */}
                <HeroBanner
                  channel={selectedChannel || CURATED_CHANNELS[0]}
                  isFavorite={selectedChannel ? preferences.favorites.includes(selectedChannel.id) : false}
                  onWatchNow={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                  totalChannels={channels.length}
                />

                {/* Continue Watching / Recents Carousel */}
                {recentChannels.length > 0 && (
                  <NetflixRow
                    title="Continue Watching"
                    subtitle="Resume recently streamed live channels"
                    channels={recentChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Clock className="w-5 h-5 text-red-500" />}
                  />
                )}

                {/* My List / Favorites Carousel */}
                {favoriteChannels.length > 0 && (
                  <NetflixRow
                    title="My List"
                    subtitle="Your bookmarked favorite channels"
                    channels={favoriteChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
                  />
                )}

                {/* Trending & Curated Verified Broadcasters */}
                <NetflixRow
                  title="Trending Live Broadcasters"
                  subtitle="24/7 high-reliability global channels"
                  channels={CURATED_CHANNELS}
                  selectedChannel={selectedChannel}
                  favorites={preferences.favorites}
                  onSelectChannel={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                  icon={<Radio className="w-5 h-5 text-red-500 animate-pulse" />}
                />

                {/* Live News */}
                {newsChannels.length > 0 && (
                  <NetflixRow
                    title="Live News & World Events"
                    subtitle="Breaking news and 24-hour journalism"
                    channels={newsChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Newspaper className="w-5 h-5 text-red-500" />}
                  />
                )}

                {/* Sports */}
                {sportsChannels.length > 0 && (
                  <NetflixRow
                    title="Sports & Live Action"
                    subtitle="Racing, football, extreme sports & athletics"
                    channels={sportsChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Trophy className="w-5 h-5 text-red-500" />}
                  />
                )}

                {/* Movies & Cinema */}
                {movieChannels.length > 0 && (
                  <NetflixRow
                    title="Movies & Cinema"
                    subtitle="Feature films, classic movies & blockbusters"
                    channels={movieChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Film className="w-5 h-5 text-red-500" />}
                  />
                )}

                {/* Entertainment */}
                {entertainmentChannels.length > 0 && (
                  <NetflixRow
                    title="Entertainment & Shows"
                    subtitle="TV series, comedy, drama & lifestyle"
                    channels={entertainmentChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Tv className="w-5 h-5 text-red-500" />}
                  />
                )}

                {/* Science & Documentaries */}
                {documentaryChannels.length > 0 && (
                  <NetflixRow
                    title="Science & Documentaries"
                    subtitle="Nature, space exploration & history"
                    channels={documentaryChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Compass className="w-5 h-5 text-red-500" />}
                  />
                )}

                {/* Music */}
                {musicChannels.length > 0 && (
                  <NetflixRow
                    title="Music & Live Concerts"
                    subtitle="Music videos, pop, rock & festivals"
                    channels={musicChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Music className="w-5 h-5 text-red-500" />}
                  />
                )}

                {/* Kids & Family */}
                {kidsChannels.length > 0 && (
                  <NetflixRow
                    title="Kids & Family Animation"
                    subtitle="Cartoons, youth programs & family friendly series"
                    channels={kidsChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Smile className="w-5 h-5 text-red-500" />}
                  />
                )}

                {/* Devotional & Faith */}
                {devotionalChannels.length > 0 && (
                  <NetflixRow
                    title="Devotional & Spiritual"
                    subtitle="Faith broadcasts, spiritual lectures, hymns & live prayers"
                    channels={devotionalChannels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    icon={<Heart className="w-5 h-5 text-red-500" />}
                  />
                )}

                {/* Complete Catalog Explorer */}
                <div className="pt-8">
                  <CatalogBrowser
                    channels={channels}
                    selectedChannel={selectedChannel}
                    favorites={preferences.favorites}
                    categories={categories}
                    countries={countries}
                    selectedCategory={preferences.selectedCategory}
                    selectedCountry={preferences.selectedCountry}
                    searchQuery={preferences.searchQuery}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectCategory={(cat) => updatePreferences({ selectedCategory: cat })}
                    onSelectCountry={(c) => updatePreferences({ selectedCountry: c })}
                    onSearchChange={(q) => updatePreferences({ searchQuery: q })}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW 3: CATEGORIES VIEW */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-[#181818] border border-zinc-800 rounded-3xl p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 flex items-center gap-3">
                <Layers className="w-7 h-7 text-red-600" />
                <span>Browse by Category</span>
              </h1>
              <p className="text-zinc-400 text-sm max-w-xl">
                Explore thousands of channels organized by broadcast genre. Tap any category to view all channels.
              </p>

              {/* Category Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mt-6">
                {categories.map((cat) => {
                  const isSelected = preferences.selectedCategory.toLowerCase() === cat.id.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        updatePreferences({ selectedCategory: cat.id });
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30 ring-2 ring-red-400'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={isSelected ? 'text-white' : 'text-red-500'}>
                          {cat.id === 'all' ? (
                            <Layers className="w-5 h-5" />
                          ) : cat.id === 'entertainment' ? (
                            <Tv className="w-5 h-5" />
                          ) : cat.id === 'sports' ? (
                            <Trophy className="w-5 h-5" />
                          ) : cat.id === 'news' ? (
                            <Newspaper className="w-5 h-5" />
                          ) : cat.id === 'movies' ? (
                            <Film className="w-5 h-5" />
                          ) : cat.id === 'kids' ? (
                            <Smile className="w-5 h-5" />
                          ) : cat.id === 'devotional' ? (
                            <Heart className="w-5 h-5" />
                          ) : cat.id === 'music' ? (
                            <Music className="w-5 h-5" />
                          ) : cat.id === 'documentary' ? (
                            <Compass className="w-5 h-5" />
                          ) : (
                            <Folder className="w-5 h-5" />
                          )}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                          {cat.count.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base leading-snug">{cat.name}</h3>
                        <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                          {cat.id === 'all' ? 'All live channels' : `${cat.name} channels`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Category Folder Indicator */}
            {preferences.selectedCategory !== 'all' && (
              <div className="bg-gradient-to-r from-red-950/60 via-zinc-900 to-zinc-900 border border-red-800/40 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-red-400">Category Folder</span>
                      <span className="text-xs text-zinc-400">• Filtered Channels</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {categories.find((c) => c.id === preferences.selectedCategory)?.name || preferences.selectedCategory}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePreferences({ selectedCategory: 'all' })}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>View All Categories</span>
                </button>
              </div>
            )}

            {/* Catalog Explorer filtered by category */}
            <CatalogBrowser
              channels={channels}
              selectedChannel={selectedChannel}
              favorites={preferences.favorites}
              categories={categories}
              countries={countries}
              selectedCategory={preferences.selectedCategory}
              selectedCountry={preferences.selectedCountry}
              searchQuery={preferences.searchQuery}
              onSelectChannel={handleSelectChannel}
              onToggleFavorite={handleToggleFavorite}
              onSelectCategory={(cat) => updatePreferences({ selectedCategory: cat })}
              onSelectCountry={(c) => updatePreferences({ selectedCountry: c })}
              onSearchChange={(q) => updatePreferences({ searchQuery: q })}
            />
          </div>
        )}

        {/* VIEW 4: MY LIST / FAVORITES VIEW */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                <span>My List ({favoriteChannels.length})</span>
              </h1>
            </div>

            {favoriteChannels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {favoriteChannels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => handleSelectChannel(channel)}
                    className="p-4 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-zinc-800 hover:border-zinc-700 text-left flex flex-col justify-between gap-3 group transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="w-12 h-12 object-contain p-1 rounded-xl bg-zinc-950 border border-zinc-800"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 text-red-500 font-bold flex items-center justify-center">
                          {channel.name.slice(0, 2)}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(channel.id);
                        }}
                        className="text-amber-400 p-1 hover:scale-110 transition-transform"
                      >
                        <Star className="w-5 h-5 fill-amber-400" />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-bold text-white group-hover:text-red-400 line-clamp-1">{channel.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{channel.group || 'Live TV'}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-16 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-center flex flex-col items-center justify-center">
                <div className="p-4 rounded-full bg-zinc-800 text-amber-400 mb-3">
                  <Star className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Your List is Empty</h3>
                <p className="text-zinc-400 text-sm max-w-sm mb-4">
                  Add channels to My List by clicking the star icon on any channel card while browsing.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  Explore Channels
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: RECENTLY WATCHED VIEW */}
        {activeTab === 'recents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                <Clock className="w-7 h-7 text-red-500" />
                <span>Recently Watched Channels ({recentChannels.length})</span>
              </h1>
            </div>

            {recentChannels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {recentChannels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => handleSelectChannel(channel)}
                    className="p-4 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-zinc-800 hover:border-zinc-700 text-left flex flex-col justify-between gap-3 group transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="w-12 h-12 object-contain p-1 rounded-xl bg-zinc-950 border border-zinc-800"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 text-red-500 font-bold flex items-center justify-center">
                          {channel.name.slice(0, 2)}
                        </div>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        Recent
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white group-hover:text-red-400 line-clamp-1">{channel.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{channel.group || 'Live TV'}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-16 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-center flex flex-col items-center justify-center">
                <div className="p-4 rounded-full bg-zinc-800 text-red-500 mb-3">
                  <Clock className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">No Watch History</h3>
                <p className="text-zinc-400 text-sm max-w-sm mb-4">
                  Channels you watch will automatically be saved here so you can easily resume them later.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  Start Watching
                </button>
              </div>
            )}
          </div>
        )}
      </main>

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

      {/* Fire TV APK Guide Modal */}
      <FireTvGuideModal
        isOpen={isFireTvGuideOpen}
        onClose={() => setIsFireTvGuideOpen(false)}
      />

      {/* On-Screen Fire TV Remote Controller */}
      {preferences.virtualRemoteVisible && (
        <VirtualRemote
          onUp={() => window.scrollBy({ top: -200, behavior: 'smooth' })}
          onDown={() => window.scrollBy({ top: 200, behavior: 'smooth' })}
          onLeft={handlePrevChannel}
          onRight={handleNextChannel}
          onSelect={togglePlay}
          onBack={() => setActiveTab('home')}
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
    </div>
  );
}
