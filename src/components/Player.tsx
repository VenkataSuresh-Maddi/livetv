import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Volume1, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Settings2, 
  AlertCircle, 
  Tv, 
  Star, 
  PictureInPicture, 
  Crop, 
  Check, 
  ArrowLeft, 
  SkipBack, 
  SkipForward, 
  Plus, 
  Minus, 
  Sparkles, 
  Globe 
} from 'lucide-react';
import { Channel, AspectRatioMode, PlayerState } from '../types';

interface PlayerProps {
  channel: Channel | null;
  playerState: PlayerState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isFavorite: boolean;
  onToggleFavorite: (channelId: string) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSetVolume: (volume: number) => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onSetQuality: (qualityIndex: number) => void;
  onSetAspectRatio: (mode: AspectRatioMode) => void;
  onRetry: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onBack?: () => void;
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
  onVolumeUp,
  onVolumeDown,
  onSetQuality,
  onSetAspectRatio,
  onRetry,
  onNextChannel,
  onPrevChannel,
  onBack,
  relatedChannels = [],
  onSelectChannel,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAspectMenu, setShowAspectMenu] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [showVolumeHud, setShowVolumeHud] = useState(false);
  const [playStateFeedback, setPlayStateFeedback] = useState<'play' | 'pause' | null>(null);

  const hideControlsTimerRef = useRef<any>(null);
  const volumeHudTimerRef = useRef<any>(null);
  const feedbackTimerRef = useRef<any>(null);
  const isHoveringControlsRef = useRef(false);
  const isAdjustingVolumeRef = useRef(false);
  const prevVolumeRef = useRef(playerState.volume);
  const prevMutedRef = useRef(playerState.isMuted);

  // Monitor browser fullscreen state via fullscreenchange event
  useEffect(() => {
    const handleFsChange = () => {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFullscreen(Boolean(fsEl));
      setAreControlsVisible(true);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Controls auto-hide timer management (3-second inactivity rule during active playback)
  const resetControlsTimer = useCallback(() => {
    setAreControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }

    // Keep controls visible if paused, buffering, in error state, adjusting volume, or if dropdown menu is open
    if (
      !playerState.isPlaying ||
      playerState.isBuffering ||
      playerState.error ||
      playerState.isAutoplayBlocked ||
      showQualityMenu ||
      showAspectMenu ||
      isHoveringControlsRef.current ||
      isAdjustingVolumeRef.current
    ) {
      return;
    }

    hideControlsTimerRef.current = setTimeout(() => {
      setAreControlsVisible(false);
    }, 3000);
  }, [
    playerState.isPlaying,
    playerState.isBuffering,
    playerState.error,
    playerState.isAutoplayBlocked,
    showQualityMenu,
    showAspectMenu,
  ]);

  // Trigger timer check whenever relevant playback or menu states change
  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [resetControlsTimer]);

  // Volume HUD: Display floating animated indicator when volume or muted state changes
  useEffect(() => {
    if (
      prevVolumeRef.current !== playerState.volume ||
      prevMutedRef.current !== playerState.isMuted
    ) {
      prevVolumeRef.current = playerState.volume;
      prevMutedRef.current = playerState.isMuted;
      setShowVolumeHud(true);
      if (volumeHudTimerRef.current) clearTimeout(volumeHudTimerRef.current);
      volumeHudTimerRef.current = setTimeout(() => {
        setShowVolumeHud(false);
      }, 1500);
    }
  }, [playerState.volume, playerState.isMuted]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
      if (volumeHudTimerRef.current) clearTimeout(volumeHudTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Toggle browser fullscreen
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const isFs = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (isFs) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } else {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        }
      }
    } catch (err) {
      console.warn('[EasyTV] Fullscreen request error:', err);
    }
  }, []);

  // Toggle picture-in-picture
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

  // Back button handler: exits fullscreen if open and calls onBack callback
  const handleBack = useCallback(() => {
    const isFs = document.fullscreenElement || (document as any).webkitFullscreenElement;
    if (isFs) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen().catch(() => {});
      }
    }
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  // Video click handler: toggle play/pause with quick visual pulse
  const handleVideoClick = useCallback(() => {
    onTogglePlay();
    setPlayStateFeedback(playerState.isPlaying ? 'pause' : 'play');
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setPlayStateFeedback(null);
    }, 600);
    resetControlsTimer();
  }, [onTogglePlay, playerState.isPlaying, resetControlsTimer]);

  // Keyboard accessibility listeners (Space, M, F, Esc, ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.getAttribute('contenteditable') === 'true')
      ) {
        if (e.key === 'Escape') target.blur();
        return;
      }

      resetControlsTimer();

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          onToggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (onVolumeUp) {
            onVolumeUp();
          } else {
            onSetVolume(Math.min(1, playerState.volume + 0.05));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (onVolumeDown) {
            onVolumeDown();
          } else {
            onSetVolume(Math.max(0, playerState.volume - 0.05));
          }
          break;
        case 'ArrowLeft':
          if (onPrevChannel) {
            e.preventDefault();
            onPrevChannel();
          }
          break;
        case 'ArrowRight':
          if (onNextChannel) {
            e.preventDefault();
            onNextChannel();
          }
          break;
        case 'Escape':
          const isFs = document.fullscreenElement || (document as any).webkitFullscreenElement;
          if (isFs) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          } else if (onBack) {
            e.preventDefault();
            onBack();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onTogglePlay,
    onToggleMute,
    toggleFullscreen,
    onVolumeUp,
    onVolumeDown,
    onSetVolume,
    playerState.volume,
    onPrevChannel,
    onNextChannel,
    onBack,
    resetControlsTimer,
  ]);

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

  const effectiveVolume = playerState.isMuted ? 0 : playerState.volume;
  const volumePercent = Math.round(effectiveVolume * 100);

  return (
    <div className="space-y-4">
      {/* Cinema Player Container */}
      <div
        ref={containerRef}
        onMouseMove={resetControlsTimer}
        onMouseEnter={resetControlsTimer}
        onTouchStart={resetControlsTimer}
        className={`relative w-full overflow-hidden bg-black select-none ${
          isFullscreen
            ? 'fixed inset-0 z-50 w-screen h-screen flex items-center justify-center rounded-none border-none p-0 m-0'
            : 'aspect-video rounded-2xl sm:rounded-3xl border border-zinc-800 shadow-2xl flex items-center justify-center'
        } ${!areControlsVisible && playerState.isPlaying ? 'cursor-none' : 'cursor-default'}`}
      >
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          className={`w-full h-full max-w-full max-h-full ${getObjectFitClass(playerState.aspectRatio)}`}
          playsInline
        />

        {/* Video Click Target for Play/Pause and Tap to Reveal */}
        <button
          type="button"
          onClick={handleVideoClick}
          aria-label={playerState.isPlaying ? 'Pause video' : 'Play video'}
          className="absolute inset-0 w-full h-full bg-transparent border-none cursor-pointer focus:outline-none z-10"
        />

        {/* Play/Pause Pulse Feedback on Tap */}
        {playStateFeedback && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-25">
            <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white scale-125 animate-ping opacity-75">
              {playStateFeedback === 'play' ? (
                <Play className="w-10 h-10 fill-current ml-1" />
              ) : (
                <Pause className="w-10 h-10" />
              )}
            </div>
          </div>
        )}

        {/* Top Overlay Bar (Back button, Channel info, Live badge, Favorite toggle) */}
        <div
          className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
            areControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onMouseEnter={() => {
            isHoveringControlsRef.current = true;
            resetControlsTimer();
          }}
          onMouseLeave={() => {
            isHoveringControlsRef.current = false;
            resetControlsTimer();
          }}
        >
          {/* Top Left: Back button & Channel Info */}
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back to channels"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-black/60 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-zinc-700/80 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                title="Back to Channels"
              >
                <ArrowLeft className="w-4 h-4 text-red-500" />
                <span className="hidden xs:inline">Back</span>
              </button>
            )}

            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg bg-zinc-950 p-1 border border-zinc-800 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-zinc-800 text-red-500 font-bold text-xs flex items-center justify-center border border-zinc-700 shrink-0">
                {channel.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-black text-white truncate max-w-[180px] sm:max-w-md drop-shadow">
                  {channel.name}
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] sm:text-xs font-black shadow-md shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-300">
                <span className="truncate">{channel.group || 'Live TV'}</span>
                {channel.countryName && (
                  <>
                    <span>•</span>
                    <span className="truncate">{channel.countryName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Top Right: Favorite Button & Extra info */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(channel.id)}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-2 rounded-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 border cursor-pointer ${
                isFavorite
                  ? 'bg-amber-400/20 text-amber-400 border-amber-400/50'
                  : 'bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border-zinc-700/80'
              }`}
              title={isFavorite ? 'Remove from My List' : 'Add to My List'}
            >
              <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Center Volume Animated HUD */}
        {showVolumeHud && (
          <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-zinc-700/80 shadow-2xl flex items-center gap-3 animate-fadeIn pointer-events-none">
            {playerState.isMuted || volumePercent === 0 ? (
              <VolumeX className="w-5 h-5 text-red-500 shrink-0" />
            ) : volumePercent < 50 ? (
              <Volume1 className="w-5 h-5 text-white shrink-0" />
            ) : (
              <Volume2 className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <div className="w-24 sm:w-32 h-2 rounded-full bg-zinc-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-150 ease-out"
                style={{ width: `${playerState.isMuted ? 0 : volumePercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-white w-9 text-right">
              {playerState.isMuted ? 'MUTE' : `${volumePercent}%`}
            </span>
          </div>
        )}

        {/* Buffering Indicator */}
        {playerState.isBuffering && !playerState.error && !playerState.isAutoplayBlocked && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20 pointer-events-none">
            <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
            <p className="text-zinc-200 font-bold text-xs sm:text-sm tracking-wide bg-zinc-900/90 border border-zinc-700 px-4 py-1.5 rounded-full shadow-lg">
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
              {onNextChannel && (
                <button
                  type="button"
                  onClick={onNextChannel}
                  className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-700 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Tv className="w-4 h-4" />
                  <span>Next Live Channel</span>
                </button>
              )}
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
          <div className="absolute top-16 left-4 z-20 px-2.5 py-1 rounded-md bg-black/80 border border-red-600/40 text-red-400 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs pointer-events-none">
            <Crop className="w-3.5 h-3.5" />
            <span>Fill Mode (Zoomed)</span>
          </div>
        )}

        {/* Tap to Unmute Banner */}
        {playerState.isMuted && playerState.isPlaying && !playerState.error && (
          <button
            type="button"
            onClick={onToggleMute}
            className="absolute top-16 right-4 z-20 px-3.5 py-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-black/50 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs animate-pulse"
            title="Click to Unmute Sound"
          >
            <VolumeX className="w-4 h-4" />
            <span>Tap to Unmute</span>
          </button>
        )}

        {/* Bottom Cinema Controls Overlay */}
        <div
          className={`absolute bottom-0 inset-x-0 z-30 pt-12 pb-4 sm:pb-6 px-4 sm:px-6 md:px-8 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 ${
            areControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onMouseEnter={() => {
            isHoveringControlsRef.current = true;
            resetControlsTimer();
          }}
          onMouseLeave={() => {
            isHoveringControlsRef.current = false;
            resetControlsTimer();
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Controls: Play/Pause, Channel Switching, and Volume */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={onTogglePlay}
                aria-label={playerState.isPlaying ? 'Pause' : 'Play'}
                className="p-2 sm:p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md shadow-red-600/40 hover:scale-105 active:scale-95 cursor-pointer"
                title={playerState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {playerState.isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Prev Channel */}
              {onPrevChannel && (
                <button
                  type="button"
                  onClick={onPrevChannel}
                  aria-label="Previous Channel"
                  className="p-2 sm:p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition-all active:scale-95 cursor-pointer"
                  title="Previous Channel (Left Arrow)"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              )}

              {/* Next Channel */}
              {onNextChannel && (
                <button
                  type="button"
                  onClick={onNextChannel}
                  aria-label="Next Channel"
                  className="p-2 sm:p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition-all active:scale-95 cursor-pointer"
                  title="Next Channel (Right Arrow)"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}

              {/* Volume Controls Group */}
              <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2 sm:px-3 py-1.5 rounded-xl border border-zinc-700/80 shadow-md">
                {/* Mute/Unmute */}
                <button
                  type="button"
                  onClick={onToggleMute}
                  aria-label={playerState.isMuted ? 'Unmute' : 'Mute'}
                  className="p-1 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title={playerState.isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {playerState.isMuted || volumePercent === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-500" />
                  ) : volumePercent < 50 ? (
                    <Volume1 className="w-4 h-4 text-zinc-200" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-zinc-200" />
                  )}
                </button>

                {/* Volume Down Step Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onVolumeDown) onVolumeDown();
                    else onSetVolume(Math.max(0, playerState.volume - 0.05));
                  }}
                  aria-label="Decrease Volume"
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Decrease Volume (- / Down Arrow)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                {/* Volume Slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={effectiveVolume}
                  onMouseDown={() => {
                    isAdjustingVolumeRef.current = true;
                  }}
                  onMouseUp={() => {
                    isAdjustingVolumeRef.current = false;
                    resetControlsTimer();
                  }}
                  onTouchStart={() => {
                    isAdjustingVolumeRef.current = true;
                  }}
                  onTouchEnd={() => {
                    isAdjustingVolumeRef.current = false;
                    resetControlsTimer();
                  }}
                  onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                  className="w-16 sm:w-24 accent-red-600 cursor-pointer h-1.5 bg-zinc-700 rounded-lg transition-all"
                  aria-label="Volume level"
                  title={`Volume: ${volumePercent}%`}
                />

                {/* Volume Up Step Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onVolumeUp) onVolumeUp();
                    else onSetVolume(Math.min(1, playerState.volume + 0.05));
                  }}
                  aria-label="Increase Volume"
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Increase Volume (+ / Up Arrow)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <span className="text-[11px] font-mono text-zinc-400 w-8 text-right hidden sm:inline">
                  {playerState.isMuted ? 'Off' : `${volumePercent}%`}
                </span>
              </div>
            </div>

            {/* Right Controls: Stream Quality, Aspect Ratio, PiP, Fullscreen */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Measured Resolution badge */}
              {playerState.measuredResolution && (
                <span className="hidden md:inline px-2 py-1 rounded-lg bg-zinc-900/90 text-emerald-400 border border-emerald-900/40 font-mono text-[11px] font-semibold">
                  {playerState.measuredResolution}
                </span>
              )}

              {/* Quality Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowAspectMenu(false);
                  }}
                  aria-label="Stream Quality"
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  title="Stream Quality"
                >
                  <Settings2 className="w-3.5 h-3.5 text-red-500" />
                  <span className="max-w-[75px] truncate">{playerState.activeQualityLabel}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 rounded-2xl shadow-2xl p-2 z-50 bg-zinc-900 border border-zinc-700 text-zinc-200 backdrop-blur-md">
                    <p className="text-xs font-bold text-zinc-400 px-2 py-1 mb-1 border-b border-zinc-800">
                      Stream Quality
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onSetQuality(-1);
                        setShowQualityMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
                  aria-label="Aspect Ratio"
                  className="p-2 sm:p-2.5 rounded-xl text-xs font-bold bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-all cursor-pointer shadow-md"
                  title="Aspect Ratio"
                >
                  <Crop className="w-4 h-4 text-red-500" />
                </button>

                {showAspectMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-52 rounded-2xl shadow-2xl p-2 z-50 bg-zinc-900 border border-zinc-700 text-zinc-200 backdrop-blur-md">
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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

              {/* Picture-in-Picture */}
              <button
                type="button"
                onClick={togglePiP}
                aria-label="Picture in Picture"
                className="p-2 sm:p-2.5 rounded-xl text-xs bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-all cursor-pointer shadow-md"
                title="Picture-in-Picture"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen Toggle Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                className="p-2 sm:p-2.5 rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md shadow-red-600/30 hover:scale-105 active:scale-95 cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen (F / Esc)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Up Next / More Like This Carousel below Player (Visible in standard cinema view) */}
      {!isFullscreen && relatedChannels.length > 0 && onSelectChannel && (
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
                className={`w-48 sm:w-56 shrink-0 p-3 rounded-2xl border text-left flex items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer ${
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
