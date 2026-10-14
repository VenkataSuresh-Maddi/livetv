import { useEffect } from 'react';

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

      switch (e.key) {
        case 'ArrowUp':
          callbacks.onUp?.();
          e.preventDefault();
          break;
        case 'ArrowDown':
          callbacks.onDown?.();
          e.preventDefault();
          break;
        case 'ArrowLeft':
          callbacks.onLeft?.();
          e.preventDefault();
          break;
        case 'ArrowRight':
          callbacks.onRight?.();
          e.preventDefault();
          break;
        case 'Enter':
        case 'NumpadEnter':
          callbacks.onSelect?.();
          e.preventDefault();
          break;
        case 'Escape':
        case 'Backspace':
        case 'BrowserBack':
          callbacks.onBack?.();
          e.preventDefault();
          break;
        case 'MediaPlayPause':
        case ' ':
          callbacks.onPlayPause?.();
          e.preventDefault();
          break;
        case 'PageDown':
        case 'ChannelDown':
          callbacks.onChannelNext?.();
          e.preventDefault();
          break;
        case 'PageUp':
        case 'ChannelUp':
          callbacks.onChannelPrev?.();
          e.preventDefault();
          break;
        case 'm':
        case 'M':
          callbacks.onMuteToggle?.();
          e.preventDefault();
          break;
        case 'f':
        case 'F':
          callbacks.onFullscreenToggle?.();
          e.preventDefault();
          break;
        default:
          if (e.key >= '0' && e.key <= '9') {
            callbacks.onNumberPress?.(parseInt(e.key, 10));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [callbacks, isEnabled]);
}
