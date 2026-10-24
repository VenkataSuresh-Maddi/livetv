import React from 'react';
import { Play, Star, Radio, CheckCircle2, Tv, Info, Globe } from 'lucide-react';
import { Channel } from '../types';

interface HeroBannerProps {
  channel: Channel | null;
  isFavorite: boolean;
  onWatchNow: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  totalChannels: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  channel,
  isFavorite,
  onWatchNow,
  onToggleFavorite,
  totalChannels,
}) => {
  if (!channel) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-black via-zinc-950 to-zinc-900 border border-zinc-800/80 shadow-2xl my-4">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-radial from-red-600/15 via-red-900/5 to-transparent pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-20 px-6 sm:px-12 py-10 sm:py-16 max-w-4xl space-y-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-black tracking-wider text-[11px] shadow-lg shadow-red-600/40">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE BROADCAST
          </span>

          <span className="px-2.5 py-1 rounded-md bg-zinc-800/90 text-zinc-200 font-semibold border border-zinc-700">
            {channel.group || 'Live TV'}
          </span>

          {channel.countryName && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/90 text-zinc-300 font-medium border border-zinc-700">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>{channel.countryName}</span>
            </span>
          )}

          {channel.resolution && (
            <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-zinc-900 text-red-400 border border-red-900/50">
              {channel.resolution} ULTRA HD
            </span>
          )}

          {channel.isVerified && (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified 24/7 Stream</span>
            </span>
          )}
        </div>

        {/* Channel Title & Logo */}
        <div className="flex items-center gap-4 pt-1">
          {channel.logo ? (
            <img referrerPolicy="no-referrer"
              src={channel.logo}
              alt={channel.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain p-2 rounded-2xl bg-zinc-900/90 border border-zinc-700 shadow-xl shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-700 text-red-500 font-black text-2xl flex items-center justify-center border border-zinc-700 shrink-0">
              {channel.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white line-clamp-2 drop-shadow-md">
              {channel.name}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Streaming live free-to-air broadcast. One-click play with adaptive multi-bitrate HLS.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => onWatchNow(channel)}
            className="px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-base sm:text-lg flex items-center gap-3 shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Watch Live Now</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(channel.id)}
            className={`px-5 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 border transition-all ${
              isFavorite
                ? 'bg-zinc-800 text-amber-400 border-amber-500/50'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            <span>{isFavorite ? 'In My List' : '+ Add to My List'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
