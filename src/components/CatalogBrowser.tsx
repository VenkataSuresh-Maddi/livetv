import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Globe, ListFilter, AlertCircle, Tv, ChevronDown } from 'lucide-react';
import { Channel, Category, Country } from '../types';
import { ChannelCard } from './ChannelCard';
import { channelMatchesCategory } from '../services/iptv';

interface CatalogBrowserProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  favorites: string[];
  categories: Category[];
  countries: Country[];
  selectedCategory: string;
  selectedCountry: string;
  searchQuery: string;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectCountry: (countryCode: string) => void;
  onSearchChange: (query: string) => void;
}

const PAGE_SIZE = 48;

export const CatalogBrowser: React.FC<CatalogBrowserProps> = ({
  channels,
  selectedChannel,
  favorites,
  categories,
  countries,
  selectedCategory,
  selectedCountry,
  searchQuery,
  onSelectChannel,
  onToggleFavorite,
  onSelectCategory,
  onSelectCountry,
  onSearchChange,
}) => {
  const [displayCount, setDisplayCount] = useState<number>(PAGE_SIZE);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [selectedCategory, selectedCountry, searchQuery]);

  // Filter channels based on category, country, and search
  const filteredChannels = useMemo(() => {
    let list = channels;

    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter((ch) => channelMatchesCategory(ch, selectedCategory));
    }

    if (selectedCountry && selectedCountry !== 'all') {
      list = list.filter((ch) => ch.country === selectedCountry);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          (ch.group || '').toLowerCase().includes(q) ||
          (ch.categories && ch.categories.some((cat) => cat.toLowerCase().includes(q))) ||
          (ch.countryName || '').toLowerCase().includes(q) ||
          (ch.language || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [channels, selectedCategory, selectedCountry, searchQuery]);

  // Paginated slice for silky smooth 60fps rendering
  const visibleChannels = useMemo(() => {
    return filteredChannels.slice(0, displayCount);
  }, [filteredChannels, displayCount]);

  const hasMore = displayCount < filteredChannels.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <section className="space-y-6 py-4">
      {/* Header and Filter Controls */}
      <div className="bg-[#181818] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-red-600" />
              <span>Explore All Live Channels</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Showing <span className="font-bold text-white">{filteredChannels.length.toLocaleString()}</span> of{' '}
              <span className="font-bold text-red-500">{channels.length.toLocaleString()}</span> available global channels
            </p>
          </div>

          {/* Search Input & Country Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, category..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5">
              <Globe className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedCountry}
                onChange={(e) => onSelectCountry(e.target.value)}
                aria-label="Filter channels by country"
                className="bg-transparent text-xs sm:text-sm text-zinc-200 focus:outline-none cursor-pointer"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-bold text-zinc-400 shrink-0 flex items-center gap-1 mr-1">
            <ListFilter className="w-3.5 h-3.5 text-red-500" />
            <span>Category:</span>
          </span>

          {categories.map((cat) => {
            const isCatActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isCatActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                {cat.name} ({cat.count.toLocaleString()})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Channel Cards */}
      {visibleChannels.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
            {visibleChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isSelected={selectedChannel?.id === channel.id}
                isFavorite={favorites.includes(channel.id)}
                onSelect={onSelectChannel}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>

          {/* Load More Button for Infinite Catalog */}
          {hasMore && (
            <div className="flex flex-col items-center justify-center pt-4 pb-8 gap-2">
              <button
                type="button"
                onClick={handleLoadMore}
                className="px-8 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg border border-zinc-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Load More Channels</span>
                <ChevronDown className="w-4 h-4 text-red-500" />
              </button>
              <p className="text-xs text-zinc-500 font-mono">
                Showing {visibleChannels.length.toLocaleString()} of {filteredChannels.length.toLocaleString()} channels
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center flex flex-col items-center justify-center">
          <div className="p-3.5 rounded-full bg-zinc-800 text-red-500 mb-3 border border-zinc-700">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="font-black text-xl text-white mb-1">No Matching Channels</h3>
          <p className="text-zinc-400 max-w-md text-sm mb-4">
            No live channels matched your current search filters. Try selecting a different category or clearing search.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              onSelectCountry('all');
              onSearchChange('');
            }}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </section>
  );
};
