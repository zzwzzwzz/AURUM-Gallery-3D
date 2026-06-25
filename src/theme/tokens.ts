export const tokens = {
  color: {
    bg: '#0B0B0C',
    raise: '#121113',
    wall: '#E6E1D6',      // warm-white paneled wall (kept dim by lighting)
    wallTrim: '#CFC6B4',  // panel molding / trim
    floor: '#6B4A2E',     // warm parquet wood
    ceil: '#7A5836',      // warm coffer wood
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
