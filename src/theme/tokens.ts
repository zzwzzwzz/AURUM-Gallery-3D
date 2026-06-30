export const tokens = {
  color: {
    bg: '#0B0B0C',
    raise: '#121113',
    wall: '#8E8B85',      // neutral grey-taupe wall (v2): warm spots + gold read warm by contrast, depth returns
    wallTrim: '#A39E92',  // panel molding / trim
    floor: '#7E5C3A',     // warm parquet wood
    ceil: '#CBB991',      // light warm coffer wood (bright, not depressing)
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
