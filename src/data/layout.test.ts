import { describe, it, expect } from 'vitest';
import { mounts, sampleCamera, focusOffsetForMount, HERO_INDEX, stops, OUTRO_FADE_START } from './layout';
import { artworks } from './artworks';

describe('gallery layout — keyframe choreography with dwells', () => {
  it('has one mount per artwork (8 side + 1 hero = 9)', () => {
    expect(artworks).toHaveLength(9);
    expect(mounts).toHaveLength(9);
    expect(new Set(mounts.map(m => m.artworkId))).toEqual(new Set(artworks.map(a => a.id)));
  });

  it('side paintings alternate L/R and march down -Z; hero centered on the far wall', () => {
    for (let i = 0; i < HERO_INDEX; i++) {
      expect(Math.abs(mounts[i].position[0])).toBeCloseTo(3.2, 5);
      expect(Math.sign(mounts[i].position[0])).toBe(i % 2 === 0 ? -1 : 1);
      if (i > 0) expect(mounts[i].position[2]).toBeLessThan(mounts[i - 1].position[2]);
    }
    expect(mounts[HERO_INDEX].position[0]).toBeCloseTo(0, 5);
    expect(mounts[HERO_INDEX].rotationY).toBeCloseTo(0, 5);
  });

  it('offset 0 (gate): camera at the entrance looking forward at the hero', () => {
    const s = sampleCamera(0);
    expect(s.pos.z).toBeCloseTo(9, 1);
    expect(s.focus).toBeLessThan(0.2);
    expect(Math.abs(s.look.x)).toBeLessThan(0.5);
    expect(s.look.z).toBeLessThan(-20); // looking at the far hero wall
  });

  it('each station holds head-on at its focus offset (camera at the painting z)', () => {
    for (let k = 0; k < HERO_INDEX; k++) {
      const s = sampleCamera(focusOffsetForMount(k));
      expect(s.index).toBe(k);
      expect(s.focus).toBeGreaterThan(0.95);
      expect(s.pos.z).toBeCloseTo(mounts[k].position[2], 0);
      expect(Math.sign(s.look.x)).toBe(Math.sign(mounts[k].position[0]));
    }
  });

  it('the hero is admired head-on at its focus offset, viewed from a distance', () => {
    const s = sampleCamera(focusOffsetForMount(HERO_INDEX));
    expect(s.index).toBe(HERO_INDEX);
    expect(s.focus).toBeGreaterThan(0.95);
    expect(s.pos.z).toBeCloseTo(-21, 1);
  });

  it('between two paintings the camera faces forward (low focus)', () => {
    const mid = (focusOffsetForMount(0) + focusOffsetForMount(1)) / 2;
    expect(sampleCamera(mid).focus).toBeLessThan(0.5);
  });

  it('the FIN begins strictly after the hero admire-hold, with scroll left for it', () => {
    expect(OUTRO_FADE_START).toBeGreaterThan(focusOffsetForMount(HERO_INDEX));
    expect(OUTRO_FADE_START).toBeGreaterThan(0.85);
    expect(OUTRO_FADE_START).toBeLessThan(1);
  });

  it('look-target never collapses onto the camera position (no NaN lookAt)', () => {
    for (let i = 0; i <= 40; i++) {
      const s = sampleCamera(i / 40);
      expect(s.look.distanceTo(s.pos)).toBeGreaterThan(0.5);
    }
  });

  it('reduced-motion stops cover the gate, 9 stations and the end', () => {
    expect(stops).toHaveLength(11);
    expect(stops[0]).toBe(0);
    expect(stops[stops.length - 1]).toBe(1);
  });
});
