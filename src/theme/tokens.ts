export const tokens = {
  color: {
    bg: '#0B0B0C',
    raise: '#121113',
    wall: '#4D504A',      // dark, matte greige-green museum wall (moody, spotlit-gallery vibe)
    wallTrim: '#5A5D56',  // panel molding / trim — just a touch lighter than the wall, subtle
    floor: '#6E4F32',     // warm parquet wood
    ceil: '#DAC9A4',      // warm cream ceiling base (darkened to a dim warm-neutral in-scene)
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
