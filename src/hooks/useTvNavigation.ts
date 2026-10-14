import { useEffect, useRef } from 'react';

interface TvNavigationCallbacks {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onSelect?: () => void;
  onBack?: () => void;
  onPlayPause?: () => void;
  onChannelNext?: () => void;
  onChannelPrev?: () => void;
  onMuteToggle?: () => void;
  onFullscreenToggle?: () => void;
  onNumberPress?: (num: number) => void;
}

export function useTvNavigation(callbacks: TvNavigationCallbacks, isEnabled = true) {
  const callbacksRef = useRef<TvNavigationCallbacks>(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.getAttribute('contenteditable') === 'true')
      ) {
        if (e.key === 'Escape') {
          target.blur();
          e.preventDefault();
        }
        return;
      }

      const cb = callbacksRef.current;

      switch (e.key) {
        case 'ArrowUp':
          cb.onUp?.();
          e.preventDefault();
          break;
        case 'ArrowDown':
          cb.onDown?.();
          e.preventDefault();
          break;
        case 'ArrowLeft':
          cb.onLeft?.();
          e.preventDefault();
          break;
        case 'ArrowRight':
          cb.onRight?.();
          e.preventDefault();
          break;
        case 'Enter':
        case 'NumpadEnter':
          cb.onSelect?.();
          e.preventDefault();
          break;
        case 'Escape':
        case 'Backspace':
        case 'BrowserBack':
          cb.onBack?.();
          e.preventDefault();
          break;
        case 'MediaPlayPause':
        case ' ':
          cb.onPlayPause?.();
          e.preventDefault();
          break;
        case 'PageDown':
        case 'ChannelDown':
          cb.onChannelNext?.();
          e.preventDefault();
          break;
        case 'PageUp':
        case 'ChannelUp':
          cb.onChannelPrev?.();
          e.preventDefault();
          break;
        case 'm':
        case 'M':
          cb.onMuteToggle?.();
          e.preventDefault();
          break;
        case 'f':
        case 'F':
          cb.onFullscreenToggle?.();
          e.preventDefault();
          break;
        default:
          if (e.key >= '0' && e.key <= '9') {
            cb.onNumberPress?.(parseInt(e.key, 10));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled]);
}
