import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Player Controls & Volume Logic', () => {
  const clampVolume = (val: number): number => {
    if (isNaN(val)) return 0;
    const pct = Math.max(0, Math.min(100, Math.round(val * 100)));
    return pct / 100;
  };

  it('should calculate volume steps and clamp strictly between 0.00 and 1.00', () => {
    assert.strictEqual(clampVolume(1.2), 1.0, 'Volume cannot exceed 1.0');
    assert.strictEqual(clampVolume(-0.5), 0.0, 'Volume cannot be negative');
    assert.strictEqual(clampVolume(0.45 + 0.05), 0.50, 'Step up should increase volume correctly');
    assert.strictEqual(clampVolume(0.02 - 0.05), 0.0, 'Step down past zero clamps to zero');
    assert.strictEqual(clampVolume(0.95 + 0.05), 1.0, 'Volume at 95% steps to exactly 100%');
    assert.strictEqual(clampVolume(1.0 + 0.05), 1.0, 'Volume at 100% clamps to 100%');
  });

  it('should increase and decrease volume in exact 5 percentage point steps', () => {
    let currentVolume = 0.50; // 50%
    const step = 0.05;

    // Up 5%
    currentVolume = clampVolume(currentVolume + step);
    assert.strictEqual(currentVolume, 0.55);

    // Up another 5%
    currentVolume = clampVolume(currentVolume + step);
    assert.strictEqual(currentVolume, 0.60);

    // Down 5%
    currentVolume = clampVolume(currentVolume - step);
    assert.strictEqual(currentVolume, 0.55);

    // Down to 0% in steps
    currentVolume = 0.05;
    currentVolume = clampVolume(currentVolume - step);
    assert.strictEqual(currentVolume, 0.0);

    // Down past 0% clamps to 0%
    currentVolume = clampVolume(currentVolume - step);
    assert.strictEqual(currentVolume, 0.0);
  });

  it('should remember and restore previous non-zero volume upon unmute', () => {
    let volume = 0.85;
    let isMuted = false;
    let lastNonZero = 0.85;

    // Simulate muting
    lastNonZero = volume > 0 ? clampVolume(volume) : 0.9;
    isMuted = true;
    assert.strictEqual(lastNonZero, 0.85, 'Last non-zero volume is preserved when muting');

    // Simulate unmuting when volume was 0.85
    isMuted = false;
    if (volume === 0) {
      volume = lastNonZero > 0 ? lastNonZero : 0.9;
    }
    assert.strictEqual(volume, 0.85, 'Volume is retained after unmute');

    // Simulate volume slider dragged to 0 (muting via slider)
    volume = 0;
    isMuted = true;

    // Simulate unmuting from 0 volume
    isMuted = false;
    if (volume === 0) {
      volume = lastNonZero > 0 ? lastNonZero : 0.9;
    }
    assert.strictEqual(volume, 0.85, 'Unmuting from zero restores the remembered volume');
  });

  it('should un-mute and step up by 5% when volume up is pressed while muted', () => {
    let volume = 0.70;
    let isMuted = true;
    let lastNonZero = 0.70;

    const handleVolumeUp = (step = 0.05) => {
      let baseVolume = volume;
      if (isMuted) {
        if (baseVolume === 0 && lastNonZero > 0) {
          baseVolume = 0;
        }
        isMuted = false;
      }
      const currentPct = Math.round(baseVolume * 100);
      const stepPct = Math.round(step * 100);
      const nextPct = Math.min(100, Math.max(0, currentPct + stepPct));
      volume = nextPct / 100;
      if (volume > 0) {
        lastNonZero = volume;
        isMuted = false;
      }
    };

    handleVolumeUp();
    assert.strictEqual(isMuted, false, 'Should be unmuted');
    assert.strictEqual(volume, 0.75, 'Should increase from 70% to 75%');
  });

  it('should calculate 10-second seek backward and forward with boundary checks', () => {
    const calculateSeek = (currentTime: number, delta: number, duration = 3600) => {
      return Math.max(0, Math.min(duration, currentTime + delta));
    };

    assert.strictEqual(calculateSeek(50, -10), 40, 'Seek backward 10s from 50s is 40s');
    assert.strictEqual(calculateSeek(50, 10), 60, 'Seek forward 10s from 50s is 60s');
    assert.strictEqual(calculateSeek(4, -10), 0, 'Seek backward past zero clamps to zero');
    assert.strictEqual(calculateSeek(3595, 10, 3600), 3600, 'Seek forward past duration clamps to duration');
  });

  it('should ignore shortcuts when typing in form inputs, textareas, or selects', () => {
    const shouldIgnoreKeyboardShortcut = (tagName: string, isContentEditable = false) => {
      const tag = tagName.toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isContentEditable;
    };

    assert.strictEqual(shouldIgnoreKeyboardShortcut('INPUT'), true);
    assert.strictEqual(shouldIgnoreKeyboardShortcut('TEXTAREA'), true);
    assert.strictEqual(shouldIgnoreKeyboardShortcut('SELECT'), true);
    assert.strictEqual(shouldIgnoreKeyboardShortcut('DIV', true), true);
    assert.strictEqual(shouldIgnoreKeyboardShortcut('BODY'), false);
    assert.strictEqual(shouldIgnoreKeyboardShortcut('DIV'), false);
  });

  it('should safely navigate back to home without leaving the application', () => {
    let activeTab = 'player';
    let currentHash = '#player';

    const handleBack = () => {
      activeTab = 'home';
      if (currentHash === '#player') {
        currentHash = '';
      }
    };

    handleBack();
    assert.strictEqual(activeTab, 'home', 'Back action switches activeTab to home');
    assert.strictEqual(currentHash, '', 'Hash is cleared without browser exit');
  });

  it('should correctly determine aspect-ratio object-fit class', () => {
    const getObjectFitClass = (mode: string) => {
      switch (mode) {
        case 'fill':
          return 'object-cover';
        case 'fit':
        case 'original':
        default:
          return 'object-contain';
      }
    };

    assert.strictEqual(getObjectFitClass('original'), 'object-contain');
    assert.strictEqual(getObjectFitClass('fit'), 'object-contain');
    assert.strictEqual(getObjectFitClass('fill'), 'object-cover');
  });
});
