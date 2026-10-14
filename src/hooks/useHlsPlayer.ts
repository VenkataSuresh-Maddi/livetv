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

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isBuffering: false,
    isMuted: false,
    volume: 0.9,
    aspectRatio: preferredAspectRatio,
    qualityLevels: [],
    currentQualityIndex: -1,
    activeQualityLabel: 'Auto',
    measuredResolution: undefined,
    error: null,
    retryCount: 0,
  });

  const retryTimeoutRef = useRef<any>(null);

  // Clean up existing HLS instance
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
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
  }, []);

  // Main playback setup
  const initPlayer = useCallback(
    (targetUrl: string, isRetry = false) => {
      const video = videoRef.current;
      if (!video || !targetUrl) return;

      cleanup();

      setState((prev) => ({
        ...prev,
        isBuffering: true,
        error: null,
        retryCount: isRetry ? prev.retryCount + 1 : 0,
      }));

      // Determine if Hls.js is supported
      if (Hls.isSupported() && (targetUrl.includes('.m3u8') || !targetUrl.endsWith('.mp4'))) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          manifestLoadingTimeOut: 12000,
          manifestLoadingMaxRetry: 3,
          levelLoadingTimeOut: 12000,
          fragLoadingTimeOut: 12000,
        });

        hlsRef.current = hls;

        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
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

          // Sort descending by height
          levels.sort((a, b) => b.height - a.height);

          setState((prev) => ({
            ...prev,
            qualityLevels: levels,
            isBuffering: false,
          }));

          video.play().catch((playErr) => {
            console.warn('[EasyTV Video] Autoplay prevented, waiting for user gesture:', playErr);
          });

          onPlaybackSuccess?.();
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
          console.warn('[EasyTV Video] Hls error:', data.type, data.details, data.fatal);

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // If stream failed directly and we haven't tried proxying yet, try proxy
                if (!targetUrl.startsWith('/api/proxy') && targetUrl.startsWith('http')) {
                  console.log('[EasyTV Video] Network error on direct stream, trying proxy fallback...');
                  cleanup();
                  initPlayer(`/api/proxy?url=${encodeURIComponent(targetUrl)}`, true);
                  return;
                }
                console.log('[EasyTV Video] Fatal network error encountered, recovering...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('[EasyTV Video] Fatal media error encountered, recovering...');
                hls.recoverMediaError();
                break;
              default:
                cleanup();
                const errMsg = 'Stream is currently offline or unreachable. Please try another channel.';
                setState((prev) => ({ ...prev, error: errMsg, isBuffering: false }));
                onPlaybackError?.(errMsg);
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
            setState((prev) => ({ ...prev, isBuffering: false }));
            video.play().catch(() => {});
            onPlaybackSuccess?.();
          },
          { once: true }
        );

        video.addEventListener(
          'error',
          () => {
            const errMsg = 'Playback failed. The broadcaster stream may be temporarily unavailable.';
            setState((prev) => ({ ...prev, error: errMsg, isBuffering: false }));
            onPlaybackError?.(errMsg);
          },
          { once: true }
        );
      } else {
        const errMsg = 'HLS streaming is not supported in this browser environment.';
        setState((prev) => ({ ...prev, error: errMsg, isBuffering: false }));
        onPlaybackError?.(errMsg);
      }
    },
    [cleanup, onPlaybackError, onPlaybackSuccess]
  );

  // Watch for streamUrl changes
  useEffect(() => {
    if (!streamUrl) {
      cleanup();
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isBuffering: false,
        error: null,
      }));
      return;
    }

    initPlayer(streamUrl);

    return () => {
      cleanup();
    };
  }, [streamUrl, initPlayer, cleanup]);

  // Handle native video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setState((prev) => ({ ...prev, isPlaying: true, isBuffering: false }));
    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false }));
    const onWaiting = () => setState((prev) => ({ ...prev, isBuffering: true }));
    const onPlaying = () => setState((prev) => ({ ...prev, isBuffering: false, isPlaying: true }));
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
      video.play().catch(() => {});
    } else {
      video.pause();
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
