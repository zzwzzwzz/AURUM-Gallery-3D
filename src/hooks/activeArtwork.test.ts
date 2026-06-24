import { describe, it, expect } from 'vitest';
import { offsetToIndex } from './activeArtwork';

describe('offsetToIndex', () => {
  it('maps 0 to the first work and 1 to the last', () => {
    expect(offsetToIndex(0, 8)).toBe(0);
    expect(offsetToIndex(1, 8)).toBe(7);
  });
  it('splits the 0..1 range into equal bands', () => {
    expect(offsetToIndex(0.1, 8)).toBe(0);
    expect(offsetToIndex(0.5, 8)).toBe(4);
    expect(offsetToIndex(0.95, 8)).toBe(7);
  });
  it('clamps out-of-range input', () => {
    expect(offsetToIndex(-0.5, 8)).toBe(0);
    expect(offsetToIndex(2, 8)).toBe(7);
  });
});
