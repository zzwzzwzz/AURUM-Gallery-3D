import { describe, it, expect } from 'vitest';
import { mounts, railPoints, buildRail, sampleRail } from './layout';
import { artworks } from './artworks';

describe('gallery layout', () => {
  it('has one mount per artwork', () => {
    expect(mounts).toHaveLength(artworks.length);
    expect(new Set(mounts.map(m => m.artworkId))).toEqual(new Set(artworks.map(a => a.id)));
  });
  it('rail has enough control points to turn a corner', () => {
    expect(railPoints.length).toBeGreaterThanOrEqual(4);
  });
  it('sampleRail returns distinct position and look-ahead within bounds', () => {
    const curve = buildRail(railPoints);
    const a = sampleRail(curve, 0);
    const b = sampleRail(curve, 1);
    expect(a.pos.distanceTo(b.pos)).toBeGreaterThan(1); // camera actually travels
    const mid = sampleRail(curve, 0.5);
    expect(mid.look.distanceTo(mid.pos)).toBeGreaterThan(0); // looks ahead, not at itself
  });
  it('sampleRail look never collapses onto pos at the end of the rail', () => {
    const curve = buildRail(railPoints);
    const end = sampleRail(curve, 1);
    expect(end.look.distanceTo(end.pos)).toBeGreaterThan(0);
  });
  it('the rail changes horizontal direction (a real turn exists)', () => {
    const curve = buildRail(railPoints);
    const t0 = curve.getTangentAt(0.05);
    const t1 = curve.getTangentAt(0.95);
    // x/z heading differs => the path turned
    expect(Math.abs(t0.x - t1.x) + Math.abs(t0.z - t1.z)).toBeGreaterThan(0.3);
  });
});
