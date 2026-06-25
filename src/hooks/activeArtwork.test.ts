import { describe, it, expect } from 'vitest';
import { offsetToActiveIndex } from './activeArtwork';

// 8 paintings → 9 stations (title + 8). Painting k sits at offset k/8.
describe('offsetToActiveIndex (title-prefixed station model)', () => {
  it('offset 0 (title view) leads in with the first work', () => {
    expect(offsetToActiveIndex(0, 8)).toBe(0);
  });
  it('the camera facing painting k shows artwork index k-1', () => {
    expect(offsetToActiveIndex(1 / 8, 8)).toBe(0); // P1
    expect(offsetToActiveIndex(2 / 8, 8)).toBe(1); // P2
    expect(offsetToActiveIndex(4 / 8, 8)).toBe(3); // P4
    expect(offsetToActiveIndex(1, 8)).toBe(7);     // P8
  });
  it('clamps out-of-range input', () => {
    expect(offsetToActiveIndex(-0.5, 8)).toBe(0);
    expect(offsetToActiveIndex(2, 8)).toBe(7);
  });
});
