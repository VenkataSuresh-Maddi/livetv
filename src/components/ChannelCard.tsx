import React from 'react';
import { Star, Play, Radio, CheckCircle } from 'lucide-react';
import { Channel } from '../types';

interface ChannelCardProps {
  channel: Channel;
  isSelected: boolean;
  isFavorite: boolean;
  isFocused?: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  highContrast?: boolean;
  largeText?: boolean;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isSelected,
  isFavorite,
  isFocused = false,
  onSelect,
  onToggleFavorite,
  highContrast = false,
  largeText = false,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(channel)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(channel);
        }
      }}
      className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between border ${
        isSelected
          ? highContrast
            ? 'bg-zinc-950 border-amber-400 ring-4 ring-amber-400'
            : 'bg-gradient-to-br from-slate-900 to-amber-950/30 border-amber-500/80 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10'
          : isFocused
          ? 'bg-slate-800 border-amber-400 ring-4 ring-amber-400 scale-[1.02] shadow-xl'
          : highContrast
          ? 'bg-zinc-900 border-zinc-700 hover:border-amber-400 hover:bg-zinc-800'
          : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 shadow-md'
      }`}
    >
      {/* Top row: Logo + Badges + Favorite */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="relative">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-14 h-14 object-contain rounded-xl bg-slate-950 p-2 border border-slate-800 group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-lg group-hover:scale-105 transition-transform">
              {channel.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Playing indicator on logo */}
          {isSelected && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Resolution tag */}
          {channel.resolution && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-amber-300 border border-slate-700">
              {channel.resolution}
            </span>
          )}

          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel.id);
            }}
            className={`p-2 rounded-xl transition-all ${
              isFavorite
                ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
            }`}
            title={isFavorite ? 'Remove favorite' : 'Mark as favorite'}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Channel info */}
      <div className="space-y-1.5">
        <h3
          className={`font-black tracking-tight leading-snug line-clamp-2 ${
            isSelected ? 'text-amber-300' : 'text-slate-100 group-hover:text-amber-200'
          } ${largeText ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}
        >
          {channel.name}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 font-medium text-slate-300 border border-slate-700/60">
            {channel.group || 'Live TV'}
          </span>
          {channel.countryName && (
            <span className="text-slate-400 truncate max-w-[120px]">
              {channel.countryName}
            </span>
          )}
        </div>
      </div>

      {/* Active state banner or hover hint */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {isSelected ? (
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Currently Playing</span>
          </span>
        ) : (
          <span className="text-slate-400 group-hover:text-amber-300 flex items-center gap-1 font-medium transition-colors">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Tap to Watch</span>
          </span>
        )}

        {channel.isVerified && (
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]" title="Verified high-uptime broadcaster">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Verified</span>
          </span>
        )}
      </div>
    </div>
  );
};
