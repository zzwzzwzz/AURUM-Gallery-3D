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
});
