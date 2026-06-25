import { describe, it, expect } from 'vitest';
import { mounts, sampleCamera, sideFocus, HERO_INDEX, focusOffsetForMount } from './layout';
import { artworks } from './artworks';

describe('gallery layout — forward-default hall with hero wall', () => {
  it('has one mount per artwork (8 side + 1 hero = 9)', () => {
    expect(artworks).toHaveLength(9);
    expect(mounts).toHaveLength(9);
    expect(new Set(mounts.map(m => m.artworkId))).toEqual(new Set(artworks.map(a => a.id)));
  });

  it('side paintings alternate L/R and march down -Z; hero is centered on the far wall', () => {
    for (let i = 0; i < HERO_INDEX; i++) {
      expect(Math.abs(mounts[i].position[0])).toBeCloseTo(3.2, 5);
      expect(Math.sign(mounts[i].position[0])).toBe(i % 2 === 0 ? -1 : 1);
      if (i > 0) expect(mounts[i].position[2]).toBeLessThan(mounts[i - 1].position[2]);
    }
    const hero = mounts[HERO_INDEX];
    expect(hero.position[0]).toBeCloseTo(0, 5); // centered
    expect(hero.rotationY).toBeCloseTo(0, 5);   // faces +Z toward the camera
  });

  it('offset 0: camera at the entrance looking forward at the hero (no side focus)', () => {
    const s = sampleCamera(0);
    expect(s.pos.z).toBeCloseTo(9, 1);
    expect(s.focus).toBeLessThan(0.2);
    // look target is the far hero wall, not a side wall
    expect(Math.abs(s.look.x)).toBeLessThan(0.5);
    expect(s.look.z).toBeLessThan(-20);
  });

  it('at each side-painting focus offset the camera is head-on to that painting', () => {
    for (let k = 0; k < HERO_INDEX; k++) {
      const s = sampleCamera(sideFocus[k]);
      expect(s.index).toBe(k);
      expect(s.focus).toBeGreaterThan(0.95);
      // head-on: camera z ≈ painting z, look toward the painting's wall side
      expect(s.pos.z).toBeCloseTo(mounts[k].position[2], 0);
      expect(Math.sign(s.look.x)).toBe(Math.sign(mounts[k].position[0]));
    }
  });

  it('offset 1: the hero is framed head-on at the far wall', () => {
    const s = sampleCamera(1);
    expect(s.index).toBe(HERO_INDEX);
    expect(s.focus).toBeGreaterThan(0.9);
    expect(s.pos.z).toBeCloseTo(-21, 1);
  });

  it('look-target never collapses onto the camera position (no NaN lookAt)', () => {
    for (let i = 0; i <= 40; i++) {
      const s = sampleCamera(i / 40);
      expect(s.look.distanceTo(s.pos)).toBeGreaterThan(0.5);
    }
  });

  it('focusOffsetForMount maps mounts to their head-on offsets', () => {
    expect(focusOffsetForMount(0)).toBeCloseTo(sideFocus[0], 5);
    expect(focusOffsetForMount(HERO_INDEX)).toBe(1);
  });
});
