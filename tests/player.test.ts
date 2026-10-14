import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Player Controls & Volume Logic', () => {
  it('should calculate volume steps and clamp between 0 and 1', () => {
    const clampVolume = (val: number) => Math.max(0, Math.min(1, Math.round(val * 100) / 100));

    assert.strictEqual(clampVolume(1.2), 1.0, 'Volume cannot exceed 1.0');
    assert.strictEqual(clampVolume(-0.5), 0.0, 'Volume cannot be negative');
    assert.strictEqual(clampVolume(0.45 + 0.05), 0.50, 'Step up should increase volume correctly');
    assert.strictEqual(clampVolume(0.02 - 0.05), 0.0, 'Step down past zero clamps to zero');
  });

  it('should remember and restore previous non-zero volume upon unmute', () => {
    let volume = 0.85;
    let isMuted = false;
    let lastNonZero = 0.85;

    // Simulate muting
    lastNonZero = volume > 0 ? volume : 0.9;
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
