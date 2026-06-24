export const tokens = {
  color: {
    bg: '#0B0B0C',
    raise: '#121113',
    wall: '#18171a',
    floor: '#101012',
    ceil: '#0d0d0f',
    warmWhite: '#EDEAE3',
    muted: '#A39E92',
    gold: '#C9A24B',
    goldBright: '#E0B85A',
    spot: '#ffe6b0',
    hairline: 'rgba(201,162,75,0.18)',
  },
  font: {
    serif: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    mono: "'Space Mono', ui-monospace, 'SFMono-Regular', monospace",
  },
  // dimmed-art look from the 2D site
  artFilter: 'saturate(0.92) brightness(0.92)',
} as const;

export type Tokens = typeof tokens;
