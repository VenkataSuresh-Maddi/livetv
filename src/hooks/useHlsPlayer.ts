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
  const stallTimerRef = useRef<any>(null);
  const lastCurrentTimeRef = useRef<number>(0);
  const nativeAbortControllerRef = useRef<AbortController | null>(null);

  // Live state refs to prevent stale closure bugs across events and watchdog
  const isPlayingRef = useRef<boolean>(false);
  const hasStartedPlaybackRef = useRef<boolean>(false);
  const isAutoplayBlockedRef = useRef<boolean>(false);
  const networkRetriesRef = useRef<number>(0);
  const mediaRetriesRef = useRef<number>(0);
  const isProxiedAttemptRef = useRef<boolean>(false);

  // Stable callback refs
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
    diagnostics: undefined,
    retryCount: 0,
  });

  // Sync preferred aspect ratio when prop changes
  useEffect(() => {
    setState((prev) => (prev.aspectRatio !== preferredAspectRatio ? { ...prev, aspectRatio: preferredAspectRatio } : prev));
  }, [preferredAspectRatio]);

  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  const clearStallWatchdog = useCallback(() => {
    if (stallTimerRef.current) {
      clearInterval(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  // Comprehensive cleanup of Hls.js instance, video element, native event listeners, and timers
  const cleanup = useCallback(() => {
    clearWatchdog();
    clearStallWatchdog();

    isPlayingRef.current = false;
    hasStartedPlaybackRef.current = false;
    isAutoplayBlockedRef.current = false;

    if (nativeAbortControllerRef.current) {
      nativeAbortControllerRef.current.abort();
      nativeAbortControllerRef.current = null;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    currentLoadedUrlRef.current = null;
  }, [clearWatchdog, clearStallWatchdog]);

  // Main player setup with resilient Hls.js configuration, mixed-content auto-upgrade, and proxy fallback
  const initPlayer = useCallback(
    (rawTargetUrl: string, isRetry = false) => {
      const video = videoRef.current;
      if (!video || !rawTargetUrl) return;

      cleanup();

      // Check Mixed Content: If current page is HTTPS and target is HTTP, route through proxy automatically
      const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      let effectiveUrl = rawTargetUrl;
      if (isPageHttps && effectiveUrl.startsWith('http://') && !effectiveUrl.startsWith('/api/proxy')) {
        console.log('[EasyTV Video] Auto-upgrading insecure HTTP stream to secure proxy route on HTTPS');
        effectiveUrl = `/api/proxy?url=${encodeURIComponent(rawTargetUrl)}`;
        isProxiedAttemptRef.current = true;
      } else {
        isProxiedAttemptRef.current = effectiveUrl.startsWith('/api/proxy');
      }

      currentLoadedUrlRef.current = effectiveUrl;

      if (!isRetry) {
        networkRetriesRef.current = 0;
        mediaRetriesRef.current = 0;
      }

      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isBuffering: true,
        isAutoplayBlocked: false,
        error: null,
        statusMessage: isProxiedAttemptRef.current
          ? 'Connecting via secure stream proxy...'
          : 'Connecting to live broadcast...',
        diagnostics: {
          streamUrl: rawTargetUrl,
          isProxied: isProxiedAttemptRef.current,
        },
        retryCount: isRetry ? prev.retryCount + 1 : 0,
      }));

      // Live connection watchdog: 14s timer using live refs
      clearWatchdog();
      watchdogTimerRef.current = setTimeout(() => {
        // If stream has started playing or user paused after playing, do not trigger error
        if (hasStartedPlaybackRef.current || isPlayingRef.current) {
          return;
        }

        // If browser blocked autoplay, waiting for user click - do not trigger error
        if (isAutoplayBlockedRef.current) {
          return;
        }

        const v = videoRef.current;
        if (v && !v.paused && v.currentTime > 0) {
          hasStartedPlaybackRef.current = true;
          return;
        }

        console.warn('[EasyTV Video] Connection watchdog timeout (14s without stream playback)');

        // If direct stream timed out and hasn't tried proxy yet, try proxy once before declaring offline!
        if (!effectiveUrl.startsWith('/api/proxy') && rawTargetUrl.startsWith('http') && networkRetriesRef.current === 0) {
          networkRetriesRef.current += 1;
          console.log('[EasyTV Video] Direct stream timed out, attempting proxy fallback...');
          cleanup();
          initPlayer(`/api/proxy?url=${encodeURIComponent(rawTargetUrl)}`, true);
          return;
        }

        cleanup();
        const timeoutMsg = 'Broadcast connection timed out. The live stream may be offline or geo-restricted.';
        setState((prev) => ({
          ...prev,
          isBuffering: false,
          isPlaying: false,
          error: timeoutMsg,
          statusMessage: undefined,
          diagnostics: {
            ...prev.diagnostics,
            lastErrorType: 'WATCHDOG_TIMEOUT',
            lastErrorDetails: 'Stream failed to start playing within 14 seconds',
          },
        }));
        onPlaybackErrorRef.current?.(timeoutMsg);
      }, 14000);

      // Start active playback stall watchdog
      lastCurrentTimeRef.current = 0;
      clearStallWatchdog();
      let stallCount = 0;
      stallTimerRef.current = setInterval(() => {
        const v = videoRef.current;
        if (!v || v.paused || !hasStartedPlaybackRef.current) {
          stallCount = 0;
          return;
        }
        if (v.currentTime === lastCurrentTimeRef.current) {
          stallCount += 1;
          // Stalled for 6+ seconds while unpaused
          if (stallCount >= 6) {
            console.log('[EasyTV Video] Stream stalled during playback, nudging buffer...');
            if (hlsRef.current) {
              hlsRef.current.startLoad();
              try {
                hlsRef.current.recoverMediaError();
              } catch {}
            }
            stallCount = 0;
          }
        } else {
          lastCurrentTimeRef.current = v.currentTime;
          stallCount = 0;
        }
      }, 1000);

      const isM3U8 =
        effectiveUrl.includes('.m3u8') ||
        effectiveUrl.includes('.m3u') ||
        effectiveUrl.includes('/api/proxy');

      // Use Hls.js if supported
      if (Hls.isSupported() && (isM3U8 || !effectiveUrl.endsWith('.mp4'))) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false, // Standard IPTV streams are not low-latency CMAF; false avoids aggressive buffer underrun
          backBufferLength: 30,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          liveSyncDurationCount: 3, // Keep comfortable 3-segment buffer behind live edge (like VLC)
          liveMaxLatencyDurationCount: 8,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 15000,
          levelLoadingMaxRetry: 3,
          levelLoadingRetryDelay: 1000,
          fragLoadingTimeOut: 15000,
          fragLoadingMaxRetry: 3,
          fragLoadingRetryDelay: 1000,
          startFragPrefetch: true,
          testBandwidth: true,
          progressive: true,
        });

        hlsRef.current = hls;
        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          setState((prev) => ({ ...prev, statusMessage: 'Loading manifest...' }));
          hls.loadSource(effectiveUrl);
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
            statusMessage: 'Starting stream...',
          }));

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                clearWatchdog();
                isPlayingRef.current = true;
                hasStartedPlaybackRef.current = true;
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
                // If autoplay failed due to sound policy, try muted playback first
                console.warn('[EasyTV Video] Autoplay with sound prevented, attempting muted play:', playErr);
                video.muted = true;
                video
                  .play()
                  .then(() => {
                    clearWatchdog();
                    isPlayingRef.current = true;
                    hasStartedPlaybackRef.current = true;
                    setState((prev) => ({
                      ...prev,
                      isPlaying: true,
                      isBuffering: false,
                      isMuted: true,
                      isAutoplayBlocked: false,
                      statusMessage: undefined,
                    }));
                    onPlaybackSuccessRef.current?.();
                  })
                  .catch(() => {
                    clearWatchdog();
                    isAutoplayBlockedRef.current = true;
                    setState((prev) => ({
                      ...prev,
                      isBuffering: false,
                      isAutoplayBlocked: true,
                      statusMessage: 'Click to start playback',
                    }));
                  });
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
          console.warn('[EasyTV Video] HLS Error event:', data.type, data.details, 'fatal:', data.fatal);

          // Check for unsupported codecs (AC-3, EAC-3, MPEG-2 video, etc.)
          const detailsStr = String(data.details || '');
          if (
            detailsStr.includes('bufferAddCodecError') ||
            detailsStr.includes('bufferIncompatibleCodecsError') ||
            detailsStr.includes('Codec')
          ) {
            cleanup();
            const codecMsg = 'This stream uses a video or audio codec (such as AC3 or MPEG-2) not supported by your web browser.';
            setState((prev) => ({
              ...prev,
              isBuffering: false,
              isPlaying: false,
              error: codecMsg,
              statusMessage: undefined,
              diagnostics: {
                ...prev.diagnostics,
                lastErrorType: 'UNSUPPORTED_CODEC',
                lastErrorDetails: `${data.details} - Browser cannot decode this codec`,
              },
            }));
            onPlaybackErrorRef.current?.(codecMsg);
            return;
          }

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // If direct stream fails with network/CORS error and we haven't tried proxy yet, try proxy once!
                if (!effectiveUrl.startsWith('/api/proxy') && rawTargetUrl.startsWith('http') && networkRetriesRef.current === 0) {
                  networkRetriesRef.current += 1;
                  console.log('[EasyTV Video] Direct stream network/CORS error, trying secure proxy route...');
                  cleanup();
                  initPlayer(`/api/proxy?url=${encodeURIComponent(rawTargetUrl)}`, true);
                  return;
                }

                cleanup();
                const netMsg = 'Live stream is offline or restricted by broadcaster CORS policy.';
                setState((prev) => ({
                  ...prev,
                  isBuffering: false,
                  error: netMsg,
                  statusMessage: undefined,
                  diagnostics: {
                    ...prev.diagnostics,
                    lastErrorType: data.type,
                    lastErrorDetails: data.details,
                  },
                }));
                onPlaybackErrorRef.current?.(netMsg);
                break;

              case Hls.ErrorTypes.MEDIA_ERROR:
                if (mediaRetriesRef.current < 2) {
                  mediaRetriesRef.current += 1;
                  console.log('[EasyTV Video] Media error encountered, calling recoverMediaError()...');
                  hls.recoverMediaError();
                } else {
                  cleanup();
                  const mediaMsg = 'Broadcaster video codec or media format is not supported by your browser.';
                  setState((prev) => ({
                    ...prev,
                    isBuffering: false,
                    error: mediaMsg,
                    statusMessage: undefined,
                    diagnostics: {
                      ...prev.diagnostics,
                      lastErrorType: data.type,
                      lastErrorDetails: data.details,
                    },
                  }));
                  onPlaybackErrorRef.current?.(mediaMsg);
                }
                break;

              default:
                cleanup();
                const genericMsg = 'Stream is currently offline or unreachable. Please try another channel.';
                setState((prev) => ({
                  ...prev,
                  isBuffering: false,
                  error: genericMsg,
                  statusMessage: undefined,
                  diagnostics: {
                    ...prev.diagnostics,
                    lastErrorType: data.type,
                    lastErrorDetails: data.details,
                  },
                }));
                onPlaybackErrorRef.current?.(genericMsg);
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl') || effectiveUrl.endsWith('.mp4')) {
        // Native Safari HLS or direct MP4
        const controller = new AbortController();
        nativeAbortControllerRef.current = controller;

        video.src = effectiveUrl;

        video.addEventListener(
          'loadedmetadata',
          () => {
            clearWatchdog();
            setState((prev) => ({ ...prev, isBuffering: false }));
            video
              .play()
              .then(() => {
                isPlayingRef.current = true;
                hasStartedPlaybackRef.current = true;
                setState((prev) => ({ ...prev, isPlaying: true, isAutoplayBlocked: false }));
                onPlaybackSuccessRef.current?.();
              })
              .catch(() => {
                // Try muted on native Safari as well
                video.muted = true;
                video
                  .play()
                  .then(() => {
                    isPlayingRef.current = true;
                    hasStartedPlaybackRef.current = true;
                    setState((prev) => ({ ...prev, isPlaying: true, isMuted: true, isAutoplayBlocked: false }));
                    onPlaybackSuccessRef.current?.();
                  })
                  .catch(() => {
                    isAutoplayBlockedRef.current = true;
                    setState((prev) => ({ ...prev, isAutoplayBlocked: true }));
                  });
              });
          },
          { signal: controller.signal }
        );

        video.addEventListener(
          'error',
          () => {
            clearWatchdog();
            // If direct stream fails, try proxy once
            if (!effectiveUrl.startsWith('/api/proxy') && rawTargetUrl.startsWith('http') && networkRetriesRef.current === 0) {
              networkRetriesRef.current += 1;
              cleanup();
              initPlayer(`/api/proxy?url=${encodeURIComponent(rawTargetUrl)}`, true);
              return;
            }
            const errMsg = 'Playback failed. The broadcaster stream may be temporarily offline.';
            setState((prev) => ({
              ...prev,
              isBuffering: false,
              error: errMsg,
              diagnostics: {
                ...prev.diagnostics,
                lastErrorType: 'NATIVE_VIDEO_ERROR',
                lastErrorDetails: 'Video element fired error event',
              },
            }));
            onPlaybackErrorRef.current?.(errMsg);
          },
          { signal: controller.signal }
        );
      } else {
        clearWatchdog();
        const unsuppMsg = 'HLS live streaming is not supported in this browser.';
        setState((prev) => ({
          ...prev,
          isBuffering: false,
          error: unsuppMsg,
          diagnostics: {
            ...prev.diagnostics,
            lastErrorType: 'UNSUPPORTED_ENVIRONMENT',
          },
        }));
        onPlaybackErrorRef.current?.(unsuppMsg);
      }
    },
    [cleanup, clearWatchdog, clearStallWatchdog]
  );

  // Watch for streamUrl prop changes
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
        diagnostics: undefined,
      }));
      return;
    }

    if (streamUrl !== currentLoadedUrlRef.current) {
      initPlayer(streamUrl);
    }

    return () => {
      cleanup();
    };
  }, [streamUrl, initPlayer, cleanup]);

  // Video element event listeners (manage live refs and clear watchdog)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      isPlayingRef.current = true;
      setState((prev) => ({ ...prev, isPlaying: true, isBuffering: false, isAutoplayBlocked: false }));
    };

    const onPause = () => {
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    const onWaiting = () => {
      // Only buffer if playback already started
      if (hasStartedPlaybackRef.current) {
        setState((prev) => ({ ...prev, isBuffering: true }));
      }
    };

    const onPlaying = () => {
      clearWatchdog();
      isPlayingRef.current = true;
      hasStartedPlaybackRef.current = true;
      setState((prev) => ({
        ...prev,
        isBuffering: false,
        isPlaying: true,
        isAutoplayBlocked: false,
        statusMessage: undefined,
      }));
    };

    const onTimeUpdate = () => {
      if (video.currentTime > 0.1 && !hasStartedPlaybackRef.current) {
        clearWatchdog();
        hasStartedPlaybackRef.current = true;
        isPlayingRef.current = true;
        setState((prev) => ({ ...prev, isBuffering: false, isPlaying: true, isAutoplayBlocked: false }));
      }
    };

    const onVolumeChange = () => {
      setState((prev) => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted,
      }));
    };

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
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('resize', onResize);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('resize', onResize);
    };
  }, [clearWatchdog]);

  // User playback controls
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          clearWatchdog();
          isPlayingRef.current = true;
          hasStartedPlaybackRef.current = true;
          setState((prev) => ({ ...prev, isPlaying: true, isAutoplayBlocked: false, isBuffering: false }));
        })
        .catch((err) => {
          console.warn('[EasyTV Video] Play toggle rejected:', err);
        });
    } else {
      video.pause();
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [clearWatchdog]);

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
      mediaRetriesRef.current = 0;
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
