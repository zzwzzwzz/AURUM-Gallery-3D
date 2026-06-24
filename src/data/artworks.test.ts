import { describe, it, expect } from 'vitest';
import { artworks } from './artworks';

describe('artworks dataset', () => {
  it('has exactly 8 works with unique sequential ids 1..8', () => {
    expect(artworks).toHaveLength(8);
    expect(artworks.map(a => a.id).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('every work has all fields and a Met CC0 image url', () => {
    for (const a of artworks) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.artist.length).toBeGreaterThan(0);
      expect(a.meta).toMatch(/·/);
      expect(a.blurb.split(' ').length).toBeGreaterThanOrEqual(8);
      expect(a.src).toMatch(/^https:\/\/images\.metmuseum\.org\/CRDImages\//);
    }
  });
});
