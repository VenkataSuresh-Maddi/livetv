import React, { useMemo } from 'react';
import { Search, X, Star, Clock, Globe, ListFilter, AlertCircle, Tv } from 'lucide-react';
import { Channel, Category, Country } from '../types';
import { ChannelCard } from './ChannelCard';

interface ChannelBrowserProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  favorites: string[];
  recentIds: string[];
  categories: Category[];
  countries: Country[];
  selectedCategory: string;
  selectedCountry: string;
  searchQuery: string;
  activeTab: 'all' | 'favorites' | 'recents';
  focusedIndex: number;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectCountry: (countryCode: string) => void;
  onSearchChange: (query: string) => void;
  onChangeTab: (tab: 'all' | 'favorites' | 'recents') => void;
  highContrast?: boolean;
  largeText?: boolean;
}

export const ChannelBrowser: React.FC<ChannelBrowserProps> = ({
  channels,
  selectedChannel,
  favorites,
  recentIds,
  categories,
  countries,
  selectedCategory,
  selectedCountry,
  searchQuery,
  activeTab,
  focusedIndex,
  onSelectChannel,
  onToggleFavorite,
  onSelectCategory,
  onSelectCountry,
  onSearchChange,
  onChangeTab,
  highContrast = false,
  largeText = false,
}) => {
  // Filter channels based on active tab, category, country, and search query
  const filteredChannels = useMemo(() => {
    let list = channels;

    // Filter by tab
    if (activeTab === 'favorites') {
      const favSet = new Set(favorites);
      list = list.filter((ch) => favSet.has(ch.id));
    } else if (activeTab === 'recents') {
      const recSet = new Set(recentIds);
      // Preserve recent order
      list = recentIds
        .map((id) => channels.find((c) => c.id === id))
        .filter((c): c is Channel => Boolean(c));
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter((ch) => (ch.group || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by country
    if (selectedCountry && selectedCountry !== 'all') {
      list = list.filter((ch) => ch.country === selectedCountry);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          (ch.group || '').toLowerCase().includes(q) ||
          (ch.countryName || '').toLowerCase().includes(q) ||
          (ch.language || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [channels, activeTab, favorites, recentIds, selectedCategory, selectedCountry, searchQuery]);

  return (
    <section className="space-y-4">
      {/* Top Filter Bar: Tabs, Search & Dropdowns */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          highContrast
            ? 'bg-black border-amber-400 text-white'
            : 'bg-slate-900/90 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => onChangeTab('all')}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'all'
                  ? highContrast
                    ? 'bg-amber-400 text-black'
                    : 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>All Channels</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400">
                {channels.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('favorites')}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'favorites'
                  ? highContrast
                    ? 'bg-amber-400 text-black'
                    : 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-4 h-4 fill-current text-amber-400" />
              <span>Favorites</span>
              {favorites.length > 0 && (
                <span className="text-xs px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('recents')}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'recents'
                  ? highContrast
                    ? 'bg-amber-400 text-black'
                    : 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Recently Watched</span>
              {recentIds.length > 0 && (
                <span className="text-xs px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
                  {recentIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search channels, news, country..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-9 pr-9 py-2 rounded-xl text-sm border focus:outline-none transition-all ${
                highContrast
                  ? 'bg-zinc-950 text-white border-zinc-600 focus:border-amber-400'
                  : 'bg-slate-950 text-slate-100 border-slate-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Country Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCountry}
              onChange={(e) => onSelectCountry(e.target.value)}
              aria-label="Filter channels by country"
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border focus:outline-none transition-all ${
                highContrast
                  ? 'bg-zinc-950 text-white border-zinc-600 focus:border-amber-400'
                  : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-amber-500'
              }`}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <ListFilter className="w-3.5 h-3.5 text-amber-400" />
            <span>Categories:</span>
          </span>

          {categories.map((cat) => {
            const isCatActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isCatActive
                    ? highContrast
                      ? 'bg-amber-400 text-black font-black'
                      : 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : highContrast
                    ? 'bg-zinc-900 text-white border border-zinc-700 hover:border-amber-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel Count & Current Results Indicator */}
      <div className="flex items-center justify-between text-xs px-2 text-slate-400">
        <div>
          Showing <span className="font-bold text-amber-400">{filteredChannels.length}</span> channels
          {selectedCategory !== 'all' && (
            <span> in <span className="text-slate-200 font-semibold">{selectedCategory}</span></span>
          )}
          {selectedCountry !== 'all' && (
            <span> from <span className="text-slate-200 font-semibold">{selectedCountry}</span></span>
          )}
          {searchQuery && (
            <span> matching &ldquo;<span className="text-slate-200 font-semibold">{searchQuery}</span>&rdquo;</span>
          )}
        </div>

        {(selectedCategory !== 'all' || selectedCountry !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              onSelectCountry('all');
              onSearchChange('');
            }}
            className="text-amber-400 hover:underline font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Channel Grid */}
      {filteredChannels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredChannels.map((channel, index) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isSelected={selectedChannel?.id === channel.id}
              isFavorite={favorites.includes(channel.id)}
              isFocused={focusedIndex === index}
              onSelect={onSelectChannel}
              onToggleFavorite={onToggleFavorite}
              highContrast={highContrast}
              largeText={largeText}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div
          className={`p-10 rounded-2xl border text-center flex flex-col items-center justify-center ${
            highContrast
              ? 'bg-black border-amber-400 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <div className="p-3 rounded-full bg-slate-800 text-amber-400 mb-3 border border-slate-700">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className={`font-black mb-1 ${largeText ? 'text-2xl' : 'text-xl'}`}>
            No Channels Found
          </h3>
          <p className="text-slate-400 max-w-md text-sm mb-4">
            {activeTab === 'favorites'
              ? 'You have not added any channels to your Favorites yet. Tap the star icon on any channel card to keep it here.'
              : activeTab === 'recents'
              ? 'You have not watched any channels yet. Pick a channel above to begin streaming.'
              : 'No channels matched your current search filters. Try selecting a different category or clearing search.'}
          </p>
          <button
            type="button"
            onClick={() => {
              onChangeTab('all');
              onSelectCategory('all');
              onSelectCountry('all');
              onSearchChange('');
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-300 transition-colors shadow-md text-sm"
          >
            Show All Channels
          </button>
        </div>
      )}
    </section>
  );
};
