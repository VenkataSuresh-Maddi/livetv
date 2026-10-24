import React from 'react';
import { Star, Play, Radio, CheckCircle2 } from 'lucide-react';
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
  highContrast,
  largeText,
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
      className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border ${
        isSelected
          ? 'bg-zinc-900 border-red-600 ring-2 ring-red-600 shadow-xl shadow-red-950/40 scale-[1.02]'
          : isFocused
          ? 'bg-zinc-800 border-red-500 ring-2 ring-red-500 scale-[1.02] shadow-xl'
          : 'bg-[#181818] hover:bg-[#222222] border-zinc-800/80 hover:border-zinc-600 hover:scale-[1.03] shadow-md hover:shadow-2xl'
      }`}
    >
      {/* 16:9 Thumbnail Area with Channel Logo */}
      <div className="relative aspect-video w-full bg-gradient-to-b from-zinc-900/90 to-zinc-950 flex items-center justify-center p-3 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-radial from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {channel.logo ? (
          <img referrerPolicy="no-referrer"
            src={channel.logo}
            alt={channel.name}
            loading="lazy"
            className="max-h-12 max-w-[80%] object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 text-red-500 font-black text-lg flex items-center justify-center border border-zinc-700 group-hover:scale-110 transition-transform">
            {channel.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Live Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-black tracking-wider text-red-500 border border-red-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span>LIVE</span>
        </div>

        {/* Resolution tag */}
        {channel.resolution && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-700">
            {channel.resolution}
          </div>
        )}

        {/* Play Icon on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Active playing indicator banner */}
        {isSelected && (
          <div className="absolute bottom-0 inset-x-0 bg-red-600/90 text-white text-[10px] font-extrabold uppercase py-0.5 text-center flex items-center justify-center gap-1 tracking-wider">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Now Playing</span>
          </div>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3
              className={`font-bold text-sm tracking-tight leading-snug line-clamp-1 ${
                isSelected ? 'text-red-400' : 'text-zinc-100 group-hover:text-white'
              }`}
            >
              {channel.name}
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(channel.id);
              }}
              className={`p-1 rounded-lg transition-colors shrink-0 ${
                isFavorite
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={isFavorite ? 'Remove from My List' : 'Add to My List'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[11px] font-medium text-zinc-300">
              {channel.group || 'Live TV'}
            </span>
            {channel.countryName && (
              <span className="text-zinc-400 text-[11px] truncate max-w-[100px]">
                {channel.countryName}
              </span>
            )}
            {channel.isVerified && (
              <span title="Verified Stream" className="ml-auto shrink-0 flex items-center">
                <CheckCircle2 className="w-3 h-3 text-red-500" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
