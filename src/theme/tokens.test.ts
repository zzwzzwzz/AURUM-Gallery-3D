import { describe, it, expect } from 'vitest';
import { tokens } from './tokens';

describe('AURUM tokens', () => {
  it('exposes the locked palette', () => {
    expect(tokens.color.bg).toBe('#0B0B0C');
    expect(tokens.color.gold).toBe('#C9A24B');
    expect(tokens.color.goldBright).toBe('#E0B85A');
    expect(tokens.color.spot).toBe('#ffe6b0');
  });
  it('exposes the dimmed-art filter and fonts', () => {
    expect(tokens.artFilter).toContain('saturate');
    expect(tokens.font.serif).toMatch(/Cormorant/);
    expect(tokens.font.mono).toMatch(/Space Mono/);
  });
  it('exposes a warm-classical interior palette', () => {
    // bg stays the locked near-black for page/fallback behind the canvas
    expect(tokens.color.bg).toBe('#0B0B0C');
    // interior is now warm, not charcoal
    expect(tokens.color.wall).toMatch(/^#/);
    expect(tokens.color.wall.toLowerCase()).not.toBe('#18171a');
    expect(tokens.color.floor.toLowerCase()).not.toBe('#101012');
    expect(tokens.color.wallTrim).toMatch(/^#/);
  });
});
