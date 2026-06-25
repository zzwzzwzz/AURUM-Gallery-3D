import { describe, it, expect } from 'vitest';
import { mounts, railPoints, lookAnchors, buildRail, sampleRail, sampleLook, STATIONS } from './layout';
import { artworks } from './artworks';

describe('gallery layout — straight warm-classical hall', () => {
  it('has one mount per artwork', () => {
    expect(mounts).toHaveLength(artworks.length);
    expect(new Set(mounts.map(m => m.artworkId))).toEqual(new Set(artworks.map(a => a.id)));
  });
  it('paintings alternate left/right walls', () => {
    for (let i = 0; i < mounts.length; i++) {
      const sign = Math.sign(mounts[i].position[0]);
      expect(Math.abs(mounts[i].position[0])).toBeCloseTo(3.2, 5);
      expect(sign).toBe(i % 2 === 0 ? -1 : 1); // P1 left, P2 right, ...
    }
  });
  it('paintings march monotonically down -Z', () => {
    for (let i = 1; i < mounts.length; i++) {
      expect(mounts[i].position[2]).toBeLessThan(mounts[i - 1].position[2]);
    }
  });
  it('rail is a straight line down the hall centerline', () => {
    expect(railPoints.length).toBe(STATIONS);
    for (const [x] of railPoints) expect(Math.abs(x)).toBeLessThan(0.001);
    const curve = buildRail(railPoints);
    const t0 = curve.getTangentAt(0.05), t1 = curve.getTangentAt(0.95);
    expect(Math.abs(t0.x - t1.x)).toBeLessThan(0.05); // no turn — straight
  });
  it('has 9 stations: title wall + 8 paintings', () => {
    expect(STATIONS).toBe(artworks.length + 1);
    expect(lookAnchors).toHaveLength(STATIONS);
  });
  it('sampleLook(0) returns the title-wall anchor', () => {
    expect(sampleLook(0).distanceTo(lookAnchors[0])).toBeLessThan(1e-6);
  });
  it('sampleLook(1) returns the last painting anchor', () => {
    expect(sampleLook(1).distanceTo(lookAnchors[STATIONS - 1])).toBeLessThan(1e-6);
  });
  it('look-target is never equal to the camera rail position (no NaN lookAt)', () => {
    const curve = buildRail(railPoints);
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const pos = sampleRail(curve, t).pos;
      const look = sampleLook(t);
      expect(look.distanceTo(pos)).toBeGreaterThan(0.5);
    }
  });
  it('sampleRail still travels the hall', () => {
    const curve = buildRail(railPoints);
    expect(sampleRail(curve, 0).pos.distanceTo(sampleRail(curve, 1).pos)).toBeGreaterThan(1);
  });
});
