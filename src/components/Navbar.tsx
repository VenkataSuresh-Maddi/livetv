import React, { useState } from 'react';
import { Tv, Search, X, RotateCw, Settings, Star, Clock, Sparkles } from 'lucide-react';
import { UserPreferences } from '../types';

interface NavbarProps {
  activeTab: 'home' | 'player' | 'categories' | 'favorites' | 'recents';
  onTabChange: (tab: 'home' | 'player' | 'categories' | 'favorites' | 'recents') => void;
  channelCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefreshChannels: () => void;
  isRefreshing: boolean;
  onOpenSettings: () => void;
  favoritesCount: number;
  recentsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  channelCount,
  searchQuery,
  onSearchChange,
  onRefreshChannels,
  isRefreshing,
  onOpenSettings,
  favoritesCount,
  recentsCount,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#141414]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="p-1.5 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">
              Easy<span className="text-red-600">TV</span>
            </span>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-zinc-300">
            <button
              type="button"
              onClick={() => onTabChange('home')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'home'
                  ? 'text-white font-bold border-b-2 border-red-600'
                  : 'hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => onTabChange('player')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'player'
                  ? 'text-white font-bold border-b-2 border-red-600'
                  : 'hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span>Live TV</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => onTabChange('categories')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'categories'
                  ? 'text-white font-bold border-b-2 border-red-600'
                  : 'hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              Categories
            </button>

            <button
              type="button"
              onClick={() => onTabChange('favorites')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'text-white font-bold border-b-2 border-red-600'
                  : 'hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span>My List</span>
              {favoritesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('recents')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'recents'
                  ? 'text-white font-bold border-b-2 border-red-600'
                  : 'hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              Recent
            </button>
          </nav>
        </div>

        {/* Right side controls: Search, Channels Badge, Refresh, Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-full px-3 py-1.5 w-44 sm:w-64 transition-all">
                <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Search 11,000+ channels..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-transparent text-white text-xs sm:text-sm focus:outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setIsSearchOpen(false);
                  }}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Search Channels"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Total Channels Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              <strong className="text-white">{channelCount.toLocaleString()}</strong> Channels
            </span>
          </div>

          {/* Refresh Catalogue */}
          <button
            type="button"
            onClick={onRefreshChannels}
            disabled={isRefreshing}
            className={`p-2 rounded-full transition-all border ${
              isRefreshing
                ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
            }`}
            title="Refresh Live TV Catalogue"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors"
            title="EasyTV Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Pills */}
      <div className="flex md:hidden items-center justify-around pt-2.5 mt-2 border-t border-zinc-800/60 text-xs font-semibold text-zinc-400">
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`py-1 px-2 rounded-md ${activeTab === 'home' ? 'text-red-500 font-bold' : ''}`}
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => onTabChange('player')}
          className={`py-1 px-2 rounded-md flex items-center gap-1 ${activeTab === 'player' ? 'text-red-500 font-bold' : ''}`}
        >
          <span>Live TV</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
        </button>
        <button
          type="button"
          onClick={() => onTabChange('categories')}
          className={`py-1 px-2 rounded-md ${activeTab === 'categories' ? 'text-red-500 font-bold' : ''}`}
        >
          Categories
        </button>
        <button
          type="button"
          onClick={() => onTabChange('favorites')}
          className={`py-1 px-2 rounded-md ${activeTab === 'favorites' ? 'text-red-500 font-bold' : ''}`}
        >
          My List ({favoritesCount})
        </button>
      </div>
    </header>
  );
};
