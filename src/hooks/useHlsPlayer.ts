import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { AspectRatioMode, QualityLevel, PlayerState } from '../types';

interface UseHlsPlayerProps {
  streamUrl: string | null;
  preferredQuality?: string;
  preferredAspectRatio?: AspectRatioMode;
  onPlaybackSuccess?: () => void;
  onPlaybackError?: (error: string) => void;
}

export function useHlsPlayer({
  streamUrl,
  preferredQuality = 'auto',
  preferredAspectRatio = 'original',
  onPlaybackSuccess,
  onPlaybackError,
}: UseHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const currentLoadedUrlRef = useRef<string | null>(null);
  const watchdogTimerRef = useRef<any>(null);
  const networkRetriesRef = useRef<number>(0);

  // Keep stable callback refs to prevent dependency invalidation loops
  const onPlaybackSuccessRef = useRef(onPlaybackSuccess);
  onPlaybackSuccessRef.current = onPlaybackSuccess;

  const onPlaybackErrorRef = useRef(onPlaybackError);
  onPlaybackErrorRef.current = onPlaybackError;

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isBuffering: false,
    isAutoplayBlocked: false,
    isMuted: false,
    volume: 0.9,
    aspectRatio: preferredAspectRatio,
    qualityLevels: [],
    currentQualityIndex: -1,
    activeQualityLabel: 'Auto',
    measuredResolution: undefined,
    error: null,
    statusMessage: undefined,
    retryCount: 0,
  });

  // Sync preferred aspect ratio when prop changes
  useEffect(() => {
    setState((prev) => (prev.aspectRatio !== preferredAspectRatio ? { ...prev, aspectRatio: preferredAspectRatio } : prev));
  }, [preferredAspectRatio]);

  // Clean up existing HLS instance and timers
  const cleanup = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    currentLoadedUrlRef.current = null;
  }, []);

  // Main playback setup with bounded retries and timeouts
  const initPlayer = useCallback(
    (targetUrl: string, isRetry = false) => {
      const video = videoRef.current;
      if (!video || !targetUrl) return;

      cleanup();
      currentLoadedUrlRef.current = targetUrl;

      if (!isRetry) {
        networkRetriesRef.current = 0;
      }

      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isBuffering: true,
        isAutoplayBlocked: false,
        error: null,
        statusMessage: 'Connecting to live stream...',
        retryCount: isRetry ? prev.retryCount + 1 : 0,
      }));

      // Bounded Watchdog: If nothing plays within 12 seconds, display actionable error instead of infinite spinner
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = setTimeout(() => {
        if (!state.isPlaying && videoRef.current?.paused) {
          console.warn('[EasyTV Video] Watchdog timeout: stream took too long to connect');
          cleanup();
          const timeoutMsg = 'Broadcast connection timed out. The stream may be offline or geo-restricted.';
          setState((prev) => ({
            ...prev,
            isBuffering: false,
            error: timeoutMsg,
            statusMessage: undefined,
          }));
          onPlaybackErrorRef.current?.(timeoutMsg);
        }
      }, 12000);

      // Determine if Hls.js is supported
      if (Hls.isSupported() && (targetUrl.includes('.m3u8') || !targetUrl.endsWith('.mp4'))) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          manifestLoadingTimeOut: 9000,
          manifestLoadingMaxRetry: 1,
          levelLoadingTimeOut: 9000,
          levelLoadingMaxRetry: 1,
          fragLoadingTimeOut: 9000,
          fragLoadingMaxRetry: 1,
        });

        hlsRef.current = hls;
        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          setState((prev) => ({ ...prev, statusMessage: 'Loading manifest...' }));
          hls.loadSource(targetUrl);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const levels: QualityLevel[] = data.levels.map((lvl, index) => {
            const height = lvl.height || 0;
            const label = height > 0 ? `${height}p` : `${Math.round(lvl.bitrate / 1000)}k`;
            return {
              index,
              height,
              width: lvl.width || 0,
              bitrate: lvl.bitrate || 0,
              label,
            };
          });

          levels.sort((a, b) => b.height - a.height);

          setState((prev) => ({
            ...prev,
            qualityLevels: levels,
            statusMessage: 'Starting playback...',
          }));

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                if (watchdogTimerRef.current) {
                  clearTimeout(watchdogTimerRef.current);
                  watchdogTimerRef.current = null;
                }
                setState((prev) => ({
                  ...prev,
                  isPlaying: true,
                  isBuffering: false,
                  isAutoplayBlocked: false,
                  statusMessage: undefined,
                }));
                onPlaybackSuccessRef.current?.();
              })
              .catch((playErr) => {
                console.warn('[EasyTV Video] Autoplay prevented by browser:', playErr);
                if (watchdogTimerRef.current) {
                  clearTimeout(watchdogTimerRef.current);
                  watchdogTimerRef.current = null;
                }
                // Autoplay blocked: allow user gesture to play
                setState((prev) => ({
                  ...prev,
                  isBuffering: false,
                  isAutoplayBlocked: true,
                  statusMessage: 'Click to start playback',
                }));
              });
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const lvl = hls.levels[data.level];
          if (lvl) {
            const height = lvl.height;
            const label = hls.autoLevelEnabled ? `Auto (${height}p)` : `${height}p`;
            setState((prev) => ({
              ...prev,
              activeQualityLabel: label,
            }));
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.warn('[EasyTV Video] HLS Error:', data.type, data.details, data.fatal);

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Only try proxy once, and do not loop indefinitely
                if (!targetUrl.startsWith('/api/proxy') && targetUrl.startsWith('http') && networkRetriesRef.current === 0) {
                  networkRetriesRef.current += 1;
                  console.log('[EasyTV Video] Network error on direct stream, attempting proxy fallback once...');
                  cleanup();
                  initPlayer(`/api/proxy?url=${encodeURIComponent(targetUrl)}`, true);
                  return;
                }

                // If already proxied or retried once, do NOT loop. Fail cleanly.
                cleanup();
                const netErrMsg = 'Stream is offline or blocked by broadcaster CORS / security policy.';
                setState((prev) => ({
                  ...prev,
                  isBuffering: false,
                  error: netErrMsg,
                  statusMessage: undefined,
                }));
                onPlaybackErrorRef.current?.(netErrMsg);
                break;

              case Hls.ErrorTypes.MEDIA_ERROR:
                if (networkRetriesRef.current < 2) {
                  networkRetriesRef.current += 1;
                  console.log('[EasyTV Video] Media error encountered, recovering...');
                  hls.recoverMediaError();
                } else {
                  cleanup();
                  const mediaErrMsg = 'Broadcaster video codec or media format is not supported.';
                  setState((prev) => ({
                    ...prev,
                    isBuffering: false,
                    error: mediaErrMsg,
                    statusMessage: undefined,
                  }));
                  onPlaybackErrorRef.current?.(mediaErrMsg);
                }
                break;

              default:
                cleanup();
                const errMsg = 'Stream is currently offline or unreachable. Please try another channel.';
                setState((prev) => ({
                  ...prev,
                  isBuffering: false,
                  error: errMsg,
                  statusMessage: undefined,
                }));
                onPlaybackErrorRef.current?.(errMsg);
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl') || targetUrl.endsWith('.mp4')) {
        // Native Safari / Apple HLS or direct MP4
        video.src = targetUrl;
        video.addEventListener(
          'loadedmetadata',
          () => {
            if (watchdogTimerRef.current) {
              clearTimeout(watchdogTimerRef.current);
              watchdogTimerRef.current = null;
            }
            setState((prev) => ({ ...prev, isBuffering: false }));
            video
              .play()
              .then(() => {
                setState((prev) => ({ ...prev, isPlaying: true, isAutoplayBlocked: false }));
                onPlaybackSuccessRef.current?.();
              })
              .catch(() => {
                setState((prev) => ({ ...prev, isAutoplayBlocked: true }));
              });
          },
          { once: true }
        );

        video.addEventListener(
          'error',
          () => {
            if (watchdogTimerRef.current) {
              clearTimeout(watchdogTimerRef.current);
              watchdogTimerRef.current = null;
            }
            const errMsg = 'Playback failed. The broadcaster stream may be temporarily unavailable.';
            setState((prev) => ({ ...prev, error: errMsg, isBuffering: false }));
            onPlaybackErrorRef.current?.(errMsg);
          },
          { once: true }
        );
      } else {
        if (watchdogTimerRef.current) {
          clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = null;
        }
        const errMsg = 'HLS streaming is not supported in this browser environment.';
        setState((prev) => ({ ...prev, error: errMsg, isBuffering: false }));
        onPlaybackErrorRef.current?.(errMsg);
      }
    },
    [cleanup, state.isPlaying]
  );

  // Watch for streamUrl changes
  useEffect(() => {
    if (!streamUrl) {
      cleanup();
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isBuffering: false,
        isAutoplayBlocked: false,
        error: null,
        statusMessage: undefined,
      }));
      return;
    }

    // Only re-init if the stream URL actually changed
    if (streamUrl !== currentLoadedUrlRef.current) {
      initPlayer(streamUrl);
    }

    return () => {
      cleanup();
    };
  }, [streamUrl, initPlayer, cleanup]);

  // Handle native video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () =>
      setState((prev) => ({ ...prev, isPlaying: true, isBuffering: false, isAutoplayBlocked: false }));
    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false }));
    const onWaiting = () => setState((prev) => ({ ...prev, isBuffering: true }));
    const onPlaying = () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      setState((prev) => ({ ...prev, isBuffering: false, isPlaying: true, isAutoplayBlocked: false }));
    };
    const onVolumeChange = () =>
      setState((prev) => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted,
      }));

    const onResize = () => {
      if (video.videoWidth && video.videoHeight) {
        setState((prev) => ({
          ...prev,
          measuredResolution: `${video.videoWidth}x${video.videoHeight}`,
        }));
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('resize', onResize);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('resize', onResize);
    };
  }, []);

  // Controls
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => {
          setState((prev) => ({ ...prev, isPlaying: true, isAutoplayBlocked: false, isBuffering: false }));
        })
        .catch(() => {});
    } else {
      video.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const setVolume = useCallback((val: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, val));
    video.volume = clamped;
    if (clamped > 0 && video.muted) {
      video.muted = false;
    }
  }, []);

  const setQuality = useCallback((index: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = index;
    setState((prev) => ({
      ...prev,
      currentQualityIndex: index,
      activeQualityLabel: index === -1 ? 'Auto' : prev.qualityLevels.find((q) => q.index === index)?.label || 'Manual',
    }));
  }, []);

  const setAspectRatio = useCallback((mode: AspectRatioMode) => {
    setState((prev) => ({ ...prev, aspectRatio: mode }));
  }, []);

  const retryPlayback = useCallback(() => {
    if (streamUrl) {
      networkRetriesRef.current = 0;
      initPlayer(streamUrl, true);
    }
  }, [streamUrl, initPlayer]);

  return {
    videoRef,
    playerState: state,
    togglePlay,
    toggleMute,
    setVolume,
    setQuality,
    setAspectRatio,
    retryPlayback,
  };
}
