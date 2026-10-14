import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Channel } from '../types';
import { ChannelCard } from './ChannelCard';

interface NetflixRowProps {
  title: string;
  subtitle?: string;
  channels: Channel[];
  selectedChannel: Channel | null;
  favorites: string[];
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  icon?: React.ReactNode;
}

export const NetflixRow: React.FC<NetflixRowProps> = ({
  title,
  subtitle,
  channels,
  selectedChannel,
  favorites,
  onSelectChannel,
  onToggleFavorite,
  icon,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  if (!channels || channels.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollContainerRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="space-y-3 py-2 group/row relative">
      {/* Row Header */}
      <div className="flex items-baseline justify-between px-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          {icon}
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs text-zinc-500 font-semibold font-mono">
                ({channels.length})
              </span>
            </h2>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Desktop Quick Scroll Controls */}
        <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:scale-105 transition-all shadow-md"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:scale-105 transition-all shadow-md"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-8 pb-3 pt-1 no-scrollbar scroll-smooth"
        >
          {channels.slice(0, 30).map((channel) => (
            <div key={channel.id} className="w-56 sm:w-64 shrink-0">
              <ChannelCard
                channel={channel}
                isSelected={selectedChannel?.id === channel.id}
                isFavorite={favorites.includes(channel.id)}
                onSelect={onSelectChannel}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
