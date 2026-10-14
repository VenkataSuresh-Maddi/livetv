import React, { useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  Settings2, 
  AlertCircle, 
  Tv, 
  Star, 
  PictureInPicture, 
  Crop, 
  Check, 
  Radio 
} from 'lucide-react';
import { Channel, AspectRatioMode, PlayerState, QualityLevel } from '../types';

interface PlayerProps {
  channel: Channel | null;
  playerState: PlayerState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isFavorite: boolean;
  onToggleFavorite: (channelId: string) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSetVolume: (volume: number) => void;
  onSetQuality: (qualityIndex: number) => void;
  onSetAspectRatio: (mode: AspectRatioMode) => void;
  onRetry: () => void;
  onNextChannel: () => void;
  highContrast?: boolean;
  largeText?: boolean;
}

export const Player: React.FC<PlayerProps> = ({
  channel,
  playerState,
  videoRef,
  isFavorite,
  onToggleFavorite,
  onTogglePlay,
  onToggleMute,
  onSetVolume,
  onSetQuality,
  onSetAspectRatio,
  onRetry,
  onNextChannel,
  highContrast = false,
  largeText = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAspectMenu, setShowAspectMenu] = useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('[EasyTV] PiP error:', err);
    }
  };

  // Determine aspect ratio class
  const getObjectFitClass = (mode: AspectRatioMode) => {
    switch (mode) {
      case 'fill':
        return 'object-cover'; // fills container, may crop
      case 'fit':
        return 'object-contain'; // fits within container
      case 'original':
      default:
        return 'object-contain'; // standard preservation of aspect ratio
    }
  };

  if (!channel) {
    return (
      <div
        className={`w-full aspect-video rounded-2xl flex flex-col items-center justify-center p-6 text-center border ${
          highContrast
            ? 'bg-black border-amber-400 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        <div className="p-4 rounded-full bg-slate-800/80 mb-3 border border-slate-700">
          <Tv className="w-10 h-10 text-amber-400 animate-pulse" />
        </div>
        <h3 className={`font-bold mb-1 ${largeText ? 'text-2xl' : 'text-xl'}`}>
          No Channel Selected
        </h3>
        <p className="text-slate-400 max-w-sm text-sm">
          Select any channel from the list below or use your TV remote D-Pad to start watching immediately.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        highContrast
          ? 'bg-black border-amber-400 ring-2 ring-amber-400'
          : 'bg-black border-slate-800 ring-1 ring-white/10'
      }`}
    >
      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className={`w-full h-full transition-all duration-300 ${getObjectFitClass(
            playerState.aspectRatio
          )}`}
          playsInline
        />

        {/* Buffering Indicator */}
        {playerState.isBuffering && !playerState.error && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
            <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-amber-300 font-semibold text-sm tracking-wide bg-black/60 px-3 py-1 rounded-full">
              Connecting Live Stream...
            </p>
          </div>
        )}

        {/* Playback Error Overlay */}
        {playerState.error && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
            <AlertCircle className="w-12 h-12 text-amber-400 mb-3 animate-bounce" />
            <h4
              className={`font-black text-white mb-2 ${
                largeText ? 'text-2xl' : 'text-xl'
              }`}
            >
              Stream Temporarily Unavailable
            </h4>
            <p className="text-slate-300 text-sm max-w-md mb-6 leading-relaxed">
              {playerState.error}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-extrabold hover:bg-amber-300 flex items-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={onNextChannel}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 border border-slate-700 flex items-center gap-2 shadow-md transition-transform active:scale-95"
              >
                <Tv className="w-4 h-4" />
                <span>Next Channel</span>
              </button>
            </div>
          </div>
        )}

        {/* Subtle Aspect Ratio Notice when Fill is active */}
        {playerState.aspectRatio === 'fill' && !playerState.error && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/70 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs">
            <Crop className="w-3.5 h-3.5" />
            <span>Fill Mode (Edges cropped)</span>
          </div>
        )}
      </div>

      {/* Control Bar & Channel Info */}
      <div
        className={`p-4 border-t ${
          highContrast
            ? 'bg-black border-amber-400 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Channel metadata */}
          <div className="flex items-center gap-3.5 min-w-0">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-12 h-12 object-contain rounded-xl bg-slate-800 p-1.5 border border-slate-700 shrink-0"
                onError={(e) => {
                  // Fallback to placeholder if logo URL is broken
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center justify-center shrink-0">
                {channel.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  className={`font-black truncate ${
                    largeText ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                  }`}
                >
                  {channel.name}
                </h2>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(channel.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFavorite
                      ? 'text-amber-400 bg-amber-400/10'
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">
                  {channel.group || 'Live TV'}
                </span>
                {channel.country && (
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    <span>{channel.countryName || channel.country}</span>
                  </span>
                )}
                {playerState.measuredResolution && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono text-[11px]">
                    {playerState.measuredResolution} (Measured)
                  </span>
                )}
                <span className="flex items-center gap-1 text-red-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Live Broadcast
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons & Player Settings */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={onTogglePlay}
              className={`p-2.5 rounded-xl font-bold transition-all ${
                highContrast
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={playerState.isPlaying ? 'Pause' : 'Play'}
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>

            {/* Mute/Volume */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60">
              <button
                type="button"
                onClick={onToggleMute}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
                title={playerState.isMuted ? 'Unmute' : 'Mute'}
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={playerState.isMuted ? 0 : playerState.volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                title="Volume"
              />
            </div>

            {/* Quality Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowAspectMenu(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  highContrast
                    ? 'bg-zinc-800 text-white border border-zinc-600'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Select stream quality"
              >
                <Settings2 className="w-4 h-4 text-amber-400" />
                <span>{playerState.activeQualityLabel}</span>
              </button>

              {showQualityMenu && (
                <div
                  className={`absolute bottom-full right-0 mb-2 w-48 rounded-xl shadow-2xl p-2 z-50 border ${
                    highContrast
                      ? 'bg-black border-amber-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1 border-b border-slate-800">
                    Stream Quality
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onSetQuality(-1);
                      setShowQualityMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      playerState.currentQualityIndex === -1
                        ? 'bg-amber-400/20 text-amber-400 font-bold'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <span>Auto (Adaptive)</span>
                    {playerState.currentQualityIndex === -1 && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {playerState.qualityLevels.length > 0 ? (
                    playerState.qualityLevels.map((lvl) => (
                      <button
                        key={lvl.index}
                        type="button"
                        onClick={() => {
                          onSetQuality(lvl.index);
                          setShowQualityMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          playerState.currentQualityIndex === lvl.index
                            ? 'bg-amber-400/20 text-amber-400 font-bold'
                            : 'hover:bg-slate-800'
                        }`}
                      >
                        <span>{lvl.label}</span>
                        {playerState.currentQualityIndex === lvl.index && (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-[11px] text-slate-500 italic">
                      Single adaptive stream
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Aspect Ratio Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAspectMenu(!showAspectMenu);
                  setShowQualityMenu(false);
                }}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  highContrast
                    ? 'bg-zinc-800 text-white border border-zinc-600'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={`Aspect Ratio: ${playerState.aspectRatio}`}
              >
                <Crop className="w-4 h-4 text-amber-400" />
              </button>

              {showAspectMenu && (
                <div
                  className={`absolute bottom-full right-0 mb-2 w-52 rounded-xl shadow-2xl p-2 z-50 border ${
                    highContrast
                      ? 'bg-black border-amber-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1 border-b border-slate-800">
                    Aspect Ratio
                  </p>
                  {(['original', 'fit', 'fill'] as AspectRatioMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        onSetAspectRatio(mode);
                        setShowAspectMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        playerState.aspectRatio === mode
                          ? 'bg-amber-400/20 text-amber-400 font-bold'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      <span className="capitalize">
                        {mode === 'original'
                          ? 'Original (16:9 / 4:3)'
                          : mode === 'fit'
                          ? 'Fit Screen'
                          : 'Fill (May crop)'}
                      </span>
                      {playerState.aspectRatio === mode && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP */}
            <button
              type="button"
              onClick={togglePiP}
              className={`p-2 rounded-xl text-xs transition-all ${
                highContrast
                  ? 'bg-zinc-800 text-white border border-zinc-600'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Picture-in-Picture mode"
            >
              <PictureInPicture className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-2 rounded-xl text-xs transition-all ${
                highContrast
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
