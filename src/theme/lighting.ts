import { tokens } from './tokens';

/**
 * Two complete lighting moods for the gallery, switched at runtime by the sun/moon
 * toggle (see `ThemeToggle.tsx`, state in `galleryStore.mode`).
 *
 * - `light` — the original warm, well-lit "inviting oil-painting" room.
 * - `dark`  — the dark, spotlit museum mood (each painting a warm focal island).
 *
 * Every value the scene reads for lighting lives here so the two looks stay in lockstep
 * and a future change can't half-update one mode. Colors that get baked into a canvas
 * texture (wall/trim) are plain hex strings; light colors for three.js are hex numbers.
 */
export type Mode = 'light' | 'dark';

export interface LightingPreset {
  // Canvas fill
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  ambient: number;
  exposure: number;
  // Postprocessing
  bloomBase: number;   // bloom intensity on desktop
  bloomSmall: number;  // bloom intensity on small screens
  bloomThreshold: number;
  vignetteOffset: number;
  vignetteDarkness: number;
  // Recessed ceiling fixtures
  ceilDiscColor: string;
  ceilDiscEmissiveIntensity: number;
  ceilPointIntensity: number;
  ceilPointDistance: number;
  // Per-painting spotlight
  spotPenumbra: number;
  spotIntensity: number;
  spotIntensityHero: number;
  // Room surfaces
  wall: string;        // baked into the panel texture
  wallTrim: string;    // baked into the panel texture
  ceilTint: string;    // mesh color multiply over the cream ceiling texture ('#ffffff' = none)
  // Overlay legibility — card scrim behind the side panel (needed only on a light room)
  panelScrim: boolean;
}

export const LIGHTING: Record<Mode, LightingPreset> = {
  light: {
    hemiSky: 0xfff0d4,
    hemiGround: 0x4a3c2a,
    hemiIntensity: 0.62,
    ambient: 0.55,
    exposure: 1.22,
    bloomBase: 0.34,
    bloomSmall: 0.26,
    bloomThreshold: 0.9,
    vignetteOffset: 0.35,
    vignetteDarkness: 0.42,
    ceilDiscColor: '#2a2118',
    ceilDiscEmissiveIntensity: 1.5,
    ceilPointIntensity: 8.5,
    ceilPointDistance: 18,
    spotPenumbra: 0.7,
    spotIntensity: 2.6,
    spotIntensityHero: 3.6,
    wall: '#ECE7DC',
    wallTrim: '#D6CDBB',
    ceilTint: '#ffffff',
    panelScrim: true,
  },
  dark: {
    hemiSky: 0x9aa3ad,
    hemiGround: 0x141210,
    hemiIntensity: 0.3,
    ambient: 0.16,
    exposure: 1.0,
    bloomBase: 0.4,
    bloomSmall: 0.3,
    bloomThreshold: 0.85,
    vignetteOffset: 0.42,
    vignetteDarkness: 0.55,
    ceilDiscColor: '#1f1812',
    ceilDiscEmissiveIntensity: 0.5,
    ceilPointIntensity: 3.4,
    ceilPointDistance: 13,
    spotPenumbra: 0.55,
    spotIntensity: 3.6,
    spotIntensityHero: 4.6,
    wall: '#4D504A',
    wallTrim: '#5A5D56',
    ceilTint: '#34322C',
    panelScrim: false,
  },
};

// Shared, mode-independent light tints.
export const SPOT_COLOR = tokens.color.spot;
export const CEIL_POINT_COLOR = '#ffe7c6';
export const CEIL_DISC_EMISSIVE = '#ffd9a0';
