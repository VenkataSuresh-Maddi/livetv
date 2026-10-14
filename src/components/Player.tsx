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
  Radio, 
  ChevronRight, 
  Sparkles, 
  Globe 
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
  relatedChannels?: Channel[];
  onSelectChannel?: (channel: Channel) => void;
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
  relatedChannels = [],
  onSelectChannel,
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

  const getObjectFitClass = (mode: AspectRatioMode) => {
    switch (mode) {
      case 'fill':
        return 'object-cover';
      case 'fit':
        return 'object-contain';
      case 'original':
      default:
        return 'object-contain';
    }
  };

  if (!channel) {
    return (
      <div className="w-full aspect-video rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center p-8 text-center shadow-2xl">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-700 mb-4">
          <Tv className="w-12 h-12 text-red-600 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">No Channel Selected</h3>
        <p className="text-zinc-400 max-w-md text-sm">
          Select any live channel from the catalogue to begin watching instantly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cinema Player Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl"
      >
        {/* Video Area */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className={`w-full h-full ${getObjectFitClass(playerState.aspectRatio)}`}
            playsInline
          />

          {/* Buffering Indicator */}
          {playerState.isBuffering && !playerState.error && !playerState.isAutoplayBlocked && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
              <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
              <p className="text-zinc-200 font-bold text-sm tracking-wide bg-zinc-900/90 border border-zinc-700 px-4 py-1.5 rounded-full shadow-lg">
                {playerState.statusMessage || 'Connecting to live stream...'}
              </p>
            </div>
          )}

          {/* Autoplay Blocked - Click to Play Overlay */}
          {playerState.isAutoplayBlocked && !playerState.error && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
              <button
                type="button"
                onClick={onTogglePlay}
                className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 active:scale-95 transition-all mb-4 cursor-pointer"
              >
                <Play className="w-10 h-10 fill-current ml-1" />
              </button>
              <h4 className="text-xl sm:text-2xl font-black text-white mb-1">Click to Watch Live Stream</h4>
              <p className="text-zinc-400 text-sm max-w-sm">
                Browser audio policy requires user interaction before live playback begins.
              </p>
            </div>
          )}

          {/* Playback Error Overlay */}
          {playerState.error && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="p-3 rounded-full bg-red-950/60 text-red-500 border border-red-800/60 mb-3">
                <AlertCircle className="w-10 h-10 animate-bounce" />
              </div>
              <h4 className="font-black text-white text-xl sm:text-2xl mb-2">
                Live Broadcast Currently Offline
              </h4>
              <p className="text-zinc-300 text-sm max-w-md mb-6 leading-relaxed">
                {playerState.error}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Stream</span>
                </button>
                <button
                  type="button"
                  onClick={onNextChannel}
                  className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-700 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Tv className="w-4 h-4" />
                  <span>Next Live Channel</span>
                </button>
              </div>

              {/* Technical Diagnostics */}
              {playerState.diagnostics && (
                <div className="mt-4 pt-3 border-t border-zinc-800/80 max-w-lg w-full text-left">
                  <details className="text-[11px] text-zinc-400 cursor-pointer">
                    <summary className="font-semibold text-zinc-300 hover:text-white">
                      Technical Stream Diagnostics
                    </summary>
                    <div className="mt-2 p-2.5 rounded-lg bg-black/60 font-mono text-[10px] space-y-1 text-zinc-300 border border-zinc-800">
                      {playerState.diagnostics.lastErrorType && (
                        <p>
                          <span className="text-zinc-500">Error Type:</span>{' '}
                          <span className="text-red-400 font-bold">{playerState.diagnostics.lastErrorType}</span>
                        </p>
                      )}
                      {playerState.diagnostics.lastErrorDetails && (
                        <p>
                          <span className="text-zinc-500">Details:</span>{' '}
                          <span>{playerState.diagnostics.lastErrorDetails}</span>
                        </p>
                      )}
                      <p>
                        <span className="text-zinc-500">Proxied Route:</span>{' '}
                        <span>{playerState.diagnostics.isProxied ? 'Yes (/api/proxy)' : 'No (Direct)'}</span>
                      </p>
                      {playerState.diagnostics.streamUrl && (
                        <p className="truncate">
                          <span className="text-zinc-500">Stream URI:</span>{' '}
                          <span className="text-zinc-400">{playerState.diagnostics.streamUrl}</span>
                        </p>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* Aspect Ratio Fill Notice */}
          {playerState.aspectRatio === 'fill' && !playerState.error && (
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/80 border border-red-600/40 text-red-400 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs">
              <Crop className="w-3.5 h-3.5" />
              <span>Fill Mode (Picture cropped)</span>
            </div>
          )}

          {/* Tap to Unmute Banner */}
          {playerState.isMuted && playerState.isPlaying && !playerState.error && (
            <button
              type="button"
              onClick={onToggleMute}
              className="absolute top-3 right-3 z-10 px-3.5 py-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-black/50 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs animate-pulse"
              title="Click to Unmute Sound"
            >
              <VolumeX className="w-4 h-4" />
              <span>Tap to Unmute</span>
            </button>
          )}
        </div>

        {/* Video Control Bar & Channel Info */}
        <div className="p-4 sm:p-5 bg-gradient-to-t from-zinc-950 via-zinc-900 to-zinc-900 border-t border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Channel Info */}
            <div className="flex items-center gap-3.5 min-w-0">
              {channel.logo ? (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl bg-zinc-950 p-1.5 border border-zinc-800 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-800 text-red-500 font-black text-lg flex items-center justify-center border border-zinc-700 shrink-0">
                  {channel.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                    {channel.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(channel.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isFavorite ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-500 hover:text-amber-400'
                    }`}
                    title={isFavorite ? 'Remove from My List' : 'Add to My List'}
                  >
                    <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-600/30 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    LIVE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-semibold border border-zinc-700">
                    {channel.group || 'Live TV'}
                  </span>
                  {channel.countryName && (
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Globe className="w-3 h-3 text-zinc-400" />
                      <span>{channel.countryName}</span>
                    </span>
                  )}
                  {playerState.measuredResolution && (
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 border border-emerald-900/50 font-mono text-[11px]">
                      {playerState.measuredResolution} (Measured)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Playback Controls */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={onTogglePlay}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all border border-zinc-700"
                title={playerState.isPlaying ? 'Pause' : 'Play'}
              >
                {playerState.isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </button>

              {/* Volume & Mute */}
              <div className="flex items-center gap-1.5 bg-zinc-800/90 px-2.5 py-1.5 rounded-xl border border-zinc-700">
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="p-1 rounded text-zinc-300 hover:text-white"
                  title={playerState.isMuted ? 'Unmute' : 'Mute'}
                >
                  {playerState.isMuted || playerState.volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={playerState.isMuted ? 0 : playerState.volume}
                  onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 accent-red-600 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
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
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-all"
                  title="Stream Quality"
                >
                  <Settings2 className="w-3.5 h-3.5 text-red-500" />
                  <span>{playerState.activeQualityLabel}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 rounded-2xl shadow-2xl p-2 z-50 bg-zinc-900 border border-zinc-700 text-zinc-200">
                    <p className="text-xs font-bold text-zinc-400 px-2 py-1 mb-1 border-b border-zinc-800">
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
                          ? 'bg-red-600/20 text-red-400 font-bold'
                          : 'hover:bg-zinc-800'
                      }`}
                    >
                      <span>Auto (Adaptive)</span>
                      {playerState.currentQualityIndex === -1 && <Check className="w-3.5 h-3.5 text-red-500" />}
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
                              ? 'bg-red-600/20 text-red-400 font-bold'
                              : 'hover:bg-zinc-800'
                          }`}
                        >
                          <span>{lvl.label}</span>
                          {playerState.currentQualityIndex === lvl.index && (
                            <Check className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-[11px] text-zinc-500 italic">
                        Standard Single Stream
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
                  className="p-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
                  title="Aspect Ratio"
                >
                  <Crop className="w-4 h-4 text-red-500" />
                </button>

                {showAspectMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-52 rounded-2xl shadow-2xl p-2 z-50 bg-zinc-900 border border-zinc-700 text-zinc-200">
                    <p className="text-xs font-bold text-zinc-400 px-2 py-1 mb-1 border-b border-zinc-800">
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
                            ? 'bg-red-600/20 text-red-400 font-bold'
                            : 'hover:bg-zinc-800'
                        }`}
                      >
                        <span className="capitalize">
                          {mode === 'original'
                            ? 'Original (16:9 / 4:3)'
                            : mode === 'fit'
                            ? 'Fit Screen'
                            : 'Fill (May crop)'}
                        </span>
                        {playerState.aspectRatio === mode && <Check className="w-3.5 h-3.5 text-red-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PiP */}
              <button
                type="button"
                onClick={togglePiP}
                className="p-2.5 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
                title="Picture-in-Picture"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md shadow-red-600/30"
                title="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Up Next / More Like This Carousel below Player */}
      {relatedChannels.length > 0 && onSelectChannel && (
        <div className="pt-2">
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>More Channels in {channel.group || 'Live TV'}</span>
            </h3>
            <span className="text-xs text-zinc-400">{relatedChannels.length} channels</span>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
            {relatedChannels.slice(0, 16).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectChannel(item)}
                className={`w-48 sm:w-56 shrink-0 p-3 rounded-2xl border text-left flex items-center gap-3 transition-all hover:scale-[1.02] ${
                  item.id === channel.id
                    ? 'bg-zinc-900 border-red-600 ring-2 ring-red-600/50'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800'
                }`}
              >
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={item.name}
                    className="w-10 h-10 object-contain p-1 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 text-red-500 font-bold flex items-center justify-center shrink-0">
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-white truncate">{item.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{item.countryName || item.group}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
