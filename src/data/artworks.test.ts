import { describe, it, expect } from 'vitest';
import { artworks } from './artworks';

describe('artworks dataset', () => {
  it('has exactly 8 works with unique sequential ids 1..8', () => {
    expect(artworks).toHaveLength(8);
    expect(artworks.map(a => a.id).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('every work has all fields and a self-hosted local image path', () => {
    for (const a of artworks) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.artist.length).toBeGreaterThan(0);
      expect(a.meta).toMatch(/·/);
      expect(a.blurb.split(' ').length).toBeGreaterThanOrEqual(8);
      // Met CC0 images are now self-hosted under public/art/ (no hotlinking).
      expect(a.src).toMatch(/^\/art\/.+\.jpg$/);
    }
  });
});
