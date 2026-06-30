import { describe, it, expect } from 'vitest';
import {
  mounts, sampleRail, sampleCamera, focusPose, focusOffsetForMount,
  HERO_INDEX, stops, OUTRO_FADE_START,
} from './layout';
import { artworks } from './artworks';

describe('gallery layout — v2 walk choreography', () => {
  it('has one mount per artwork (8 side + 1 hero = 9)', () => {
    expect(artworks).toHaveLength(9);
    expect(mounts).toHaveLength(9);
    expect(new Set(mounts.map((m) => m.artworkId))).toEqual(new Set(artworks.map((a) => a.id)));
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

  it('the 8 side works share one hanging line (single eye-level Y)', () => {
    const ys = mounts.slice(0, HERO_INDEX).map((m) => m.position[1]);
    for (const y of ys) expect(y).toBeCloseTo(ys[0], 5);
  });

  it('the hero is the widest work (a destination)', () => {
    for (let i = 0; i < HERO_INDEX; i++) {
      expect(mounts[HERO_INDEX].width).toBeGreaterThanOrEqual(mounts[i].width);
    }
  });

  it('offset 0 (gate): camera at the entrance looking forward down the corridor at the hero', () => {
    const s = sampleRail(0);
    expect(s.pos.z).toBeCloseTo(9, 1);
    expect(s.focus).toBeLessThan(0.2);
    expect(Math.abs(s.look.x)).toBeLessThan(0.5); // looking straight ahead, not sideways
    expect(s.look.z).toBeLessThan(-20);           // toward the far hero wall
  });

  it('WALK: the camera advances forward (dwells hold z; it never moves backward)', () => {
    let prev = sampleRail(0).pos.z;
    for (let i = 1; i <= 60; i++) {
      const z = sampleRail(i / 60).pos.z;
      expect(z).toBeLessThanOrEqual(prev + 1e-6); // monotonic forward (flat during a dwell)
      prev = z;
    }
    expect(sampleRail(0).pos.z).toBeGreaterThan(sampleRail(1).pos.z); // overall progress
    expect(sampleRail(1).pos.z).toBeCloseTo(-20, 1);                  // stops short of the far wall (-26)
  });

  it('DWELL: the camera lingers (z holds) while a side work is framed', () => {
    // Around a dwell centre the camera z barely changes — the "stay a few seconds" beat.
    const c = focusOffsetForMount(2);
    const spread = Math.abs(sampleRail(c + 0.02).pos.z - sampleRail(c - 0.02).pos.z);
    expect(spread).toBeLessThan(0.4);
  });

  it('the camera height stays level (pure yaw, no roll/pitch drift in pos.y)', () => {
    for (let i = 0; i <= 20; i++) expect(sampleRail(i / 20).pos.y).toBeCloseTo(1.6, 5);
  });

  it('GLANCE: drawing level with a side work frames it, gaze turning toward its wall', () => {
    for (let k = 0; k < HERO_INDEX; k++) {
      const s = sampleRail(focusOffsetForMount(k));
      expect(s.index).toBe(k);
      expect(s.focus).toBeGreaterThan(0.85);
      expect(s.pos.z).toBeCloseTo(mounts[k].position[2], 0);          // level with the work
      expect(Math.sign(s.look.x)).toBe(Math.sign(mounts[k].position[0])); // glance toward its side
    }
  });

  it('between two side works the gaze returns to centre (low focus)', () => {
    const mid = (focusOffsetForMount(0) + focusOffsetForMount(1)) / 2;
    expect(sampleRail(mid).focus).toBeLessThan(0.5);
  });

  it('the hero becomes the framed work as the walk ends', () => {
    const s = sampleRail(0.97);
    expect(s.index).toBe(HERO_INDEX);
    expect(s.focus).toBeGreaterThan(0.5);
  });

  it('look-target never collapses onto the camera position (no NaN lookAt)', () => {
    for (let i = 0; i <= 40; i++) {
      const s = sampleRail(i / 40);
      expect(s.look.distanceTo(s.pos)).toBeGreaterThan(0.5);
    }
  });

  it('CLICK-TO-FOCUS: focusPose frames a side work head-on, camera off the wall toward centre', () => {
    const k = 0; // left wall
    const fp = focusPose(k);
    expect(fp.look.x).toBeCloseTo(mounts[k].position[0], 5);   // looking at the work's centre
    expect(fp.look.y).toBeCloseTo(mounts[k].position[1], 5);
    expect(fp.pos.y).toBeCloseTo(mounts[k].position[1], 5);    // flat / head-on (eye = centre height)
    expect(fp.pos.x).toBeGreaterThan(mounts[k].position[0]);   // pulled off the wall toward the aisle
    expect(fp.pos.x).toBeLessThan(0);
    expect(fp.pos.z).toBeCloseTo(mounts[k].position[2], 1);
  });

  it('CLICK-TO-FOCUS: the hero is framed from in front of the far wall', () => {
    const fp = focusPose(HERO_INDEX);
    expect(fp.pos.z).toBeGreaterThan(mounts[HERO_INDEX].position[2]); // in front of the hero
    expect(fp.pos.x).toBeCloseTo(0, 1);
    expect(fp.look.z).toBeCloseTo(mounts[HERO_INDEX].position[2], 5);
  });

  it('the FIN begins strictly after the hero is framed, with scroll left for it', () => {
    expect(OUTRO_FADE_START).toBeGreaterThan(focusOffsetForMount(HERO_INDEX));
    expect(OUTRO_FADE_START).toBeGreaterThan(0.85);
    expect(OUTRO_FADE_START).toBeLessThan(1);
  });

  it('reduced-motion stops cover the gate, 9 stations and the end', () => {
    expect(stops).toHaveLength(11);
    expect(stops[0]).toBe(0);
    expect(stops[stops.length - 1]).toBe(1);
  });

  it('sampleCamera is the v2 walk sampler (back-compat alias)', () => {
    expect(sampleCamera).toBe(sampleRail);
  });
});
