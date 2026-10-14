import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Circle, 
  CornerDownLeft, 
  Home, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Tv, 
  X, 
  Minus, 
  Plus 
} from 'lucide-react';

interface VirtualRemoteProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onSelect: () => void;
  onBack: () => void;
  onPlayPause: () => void;
  onChannelNext: () => void;
  onChannelPrev: () => void;
  onMuteToggle: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onClose: () => void;
  isPlaying: boolean;
  isMuted: boolean;
}

export const VirtualRemote: React.FC<VirtualRemoteProps> = ({
  onUp,
  onDown,
  onLeft,
  onRight,
  onSelect,
  onBack,
  onPlayPause,
  onChannelNext,
  onChannelPrev,
  onMuteToggle,
  onVolumeUp,
  onVolumeDown,
  onClose,
  isPlaying,
  isMuted,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-auto">
      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="px-4 py-2.5 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-400 font-black shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Tv className="w-5 h-5 text-amber-400" />
          <span>Fire TV Remote</span>
        </button>
      ) : (
        <div className="w-64 bg-zinc-950/95 backdrop-blur-md border-2 border-zinc-700 rounded-3xl p-4 shadow-2xl shadow-black/80 flex flex-col items-center select-none text-slate-200">
          {/* Remote Header */}
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Tv className="w-4 h-4" />
              <span>Fire TV Remote Lite</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded text-zinc-400 hover:text-white"
                title="Minimize"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-zinc-400 hover:text-red-400"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* D-Pad Directional Ring */}
          <div className="relative w-40 h-40 rounded-full bg-zinc-900 border-4 border-zinc-700 shadow-inner flex items-center justify-center my-3">
            {/* UP */}
            <button
              type="button"
              onClick={onUp}
              className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-10 flex items-center justify-center text-zinc-400 hover:text-amber-400 active:scale-90 transition-transform"
              title="Navigate Up (ArrowUp)"
            >
              <ChevronUp className="w-7 h-7" />
            </button>

            {/* DOWN */}
            <button
              type="button"
              onClick={onDown}
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-10 flex items-center justify-center text-zinc-400 hover:text-amber-400 active:scale-90 transition-transform"
              title="Navigate Down (ArrowDown)"
            >
              <ChevronDown className="w-7 h-7" />
            </button>

            {/* LEFT */}
            <button
              type="button"
              onClick={onLeft}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center text-zinc-400 hover:text-amber-400 active:scale-90 transition-transform"
              title="Navigate Left (ArrowLeft)"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            {/* RIGHT */}
            <button
              type="button"
              onClick={onRight}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center text-zinc-400 hover:text-amber-400 active:scale-90 transition-transform"
              title="Navigate Right (ArrowRight)"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            {/* CENTER SELECT / OK */}
            <button
              type="button"
              onClick={onSelect}
              className="w-16 h-16 rounded-full bg-zinc-800 hover:bg-amber-400 hover:text-black text-white font-extrabold text-xs shadow-md border-2 border-zinc-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              title="Select / OK (Enter)"
            >
              OK
            </button>
          </div>

          {/* Navigation Function Buttons (Back, Home, Play) */}
          <div className="grid grid-cols-3 gap-2 w-full my-2">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white active:scale-95 transition-all"
              title="Back (Escape)"
            >
              <CornerDownLeft className="w-4 h-4 text-amber-400" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white active:scale-95 transition-all"
              title="Home Screen"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={onPlayPause}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white active:scale-95 transition-all"
              title="Play / Pause"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-emerald-400" />
              ) : (
                <Play className="w-4 h-4 text-emerald-400 fill-current" />
              )}
              <span>Play</span>
            </button>
          </div>

          {/* Volume and Channel Switcher */}
          <div className="grid grid-cols-2 gap-2 w-full mt-1">
            {/* Volume Rocker */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1.5">
              <button
                type="button"
                onClick={onVolumeDown}
                className="p-1 hover:text-amber-400"
                title="Volume Down"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onMuteToggle}
                className="p-1"
                title="Mute"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-zinc-300" />
                )}
              </button>
              <button
                type="button"
                onClick={onVolumeUp}
                className="p-1 hover:text-amber-400"
                title="Volume Up"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Channel Next / Prev Rocker */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1.5">
              <button
                type="button"
                onClick={onChannelPrev}
                className="text-xs font-bold hover:text-amber-400 px-1"
                title="Channel Down"
              >
                CH-
              </button>
              <span className="text-[10px] text-zinc-500 font-mono">CH</span>
              <button
                type="button"
                onClick={onChannelNext}
                className="text-xs font-bold hover:text-amber-400 px-1"
                title="Channel Up"
              >
                CH+
              </button>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 mt-2 text-center">
            You can also use physical Arrow Keys, Enter &amp; Esc
          </p>
        </div>
      )}
    </div>
  );
};
