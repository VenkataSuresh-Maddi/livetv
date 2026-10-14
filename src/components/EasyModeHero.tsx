import React from 'react';
import { Play, Star, Clock, Tv, RotateCw, Settings, Sparkles, Radio } from 'lucide-react';
import { Channel } from '../types';

interface EasyModeHeroProps {
  lastWatchedChannel: Channel | null;
  favoriteChannels: Channel[];
  recentChannels: Channel[];
  onPlayChannel: (channel: Channel) => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onSelectCategory: (category: string) => void;
  isRefreshing: boolean;
  highContrast?: boolean;
}

export const EasyModeHero: React.FC<EasyModeHeroProps> = ({
  lastWatchedChannel,
  favoriteChannels,
  recentChannels,
  onPlayChannel,
  onRefresh,
  onOpenSettings,
  onSelectCategory,
  isRefreshing,
  highContrast = false,
}) => {
  return (
    <div className="space-y-6 mb-8">
      {/* Elder-Friendly Hero: Giant "Watch Live TV" Button */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          highContrast
            ? 'bg-black border-amber-400 text-white ring-4 ring-amber-400'
            : 'bg-gradient-to-r from-amber-600/20 via-slate-900 to-slate-900 border-amber-500/40 text-slate-100 shadow-2xl'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Easy Senior Mode Active</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
              Watch Live TV
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl">
              {lastWatchedChannel
                ? `Ready to resume: "${lastWatchedChannel.name}"`
                : 'Select any free channel below to begin watching now with one tap.'}
            </p>
          </div>

          {/* Big One-Tap Play Action */}
          {lastWatchedChannel ? (
            <button
              type="button"
              onClick={() => onPlayChannel(lastWatchedChannel)}
              className="px-8 py-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xl sm:text-2xl flex items-center gap-4 shadow-xl shadow-amber-400/20 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center">
                <Play className="w-7 h-7 fill-black" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold opacity-80 uppercase tracking-wider">
                  Last Watched Channel
                </span>
                <span>Play {lastWatchedChannel.name}</span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Radio className="w-6 h-6 animate-pulse" />
              <span>Pick a channel below to watch</span>
            </div>
          )}
        </div>

        {/* Elder Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onSelectCategory('news')}
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Tv className="w-5 h-5 text-amber-400" />
            <span>Live News</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectCategory('sports')}
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Tv className="w-5 h-5 text-emerald-400" />
            <span>Live Sports</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <RotateCw className={`w-5 h-5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Channels</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Settings className="w-5 h-5 text-rose-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Quick Favorites Row if any exist */}
      {favoriteChannels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-xl font-extrabold text-white">Your Favorite Channels</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {favoriteChannels.slice(0, 4).map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => onPlayChannel(ch)}
                className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 text-left hover:scale-[1.02] transition-transform"
              >
                {ch.logo ? (
                  <img
                    src={ch.logo}
                    alt={ch.name}
                    className="w-10 h-10 object-contain rounded-lg bg-slate-950 p-1 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    {ch.name.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm sm:text-base truncate">{ch.name}</p>
                  <p className="text-xs text-amber-400 font-medium">⭐ Favorite</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recently Watched Quick Row */}
      {recentChannels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white">Recently Watched</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentChannels.slice(0, 4).map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => onPlayChannel(ch)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-400 flex items-center gap-3 text-left hover:scale-[1.02] transition-transform"
              >
                {ch.logo ? (
                  <img
                    src={ch.logo}
                    alt={ch.name}
                    className="w-10 h-10 object-contain rounded-lg bg-slate-950 p-1 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
                    {ch.name.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm sm:text-base truncate">{ch.name}</p>
                  <p className="text-xs text-cyan-400 font-medium">Resume</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
