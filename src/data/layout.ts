import * as THREE from 'three';

export interface MountPoint {
  artworkId: number;
  position: [number, number, number];
  rotationY: number; // radians; face into the hall
  width: number;     // world units (height derived from image aspect at render time)
}

// ---------------------------------------------------------------------------
// Hall geometry: a straight hall down -Z. 8 side paintings alternate L/R; a 9th
// HERO painting hangs head-on on the far wall.
//
// v2 hanging line: all painting CENTERS share one eye-level Y (HANG) so the works
// read as a single hung line as you walk (feedback #3). The hero is wider so it
// reads as the destination at the end of the corridor.
// ---------------------------------------------------------------------------
const EYE = 1.6;        // camera eye height (rail)
const HANG = 1.5;       // single hanging center-line for EVERY painting (~150cm)
const WALL_X = 3.2;     // side paintings at x = ∓WALL_X
const START_Z = 9;      // camera z at offset 0 (gate / entrance)
const END_Z = -20;      // camera z at offset 1 — stops ~6 units short of the far wall
const FAR_Z = -26;      // far wall z
const HERO_Z = FAR_Z + 0.4; // hero hangs just IN FRONT of the far wall (no z-fight)
const HERO_Y = HANG;        // hero shares the hanging line
const HERO_W = 3.0;         // widest work — a real destination at the vanishing point (feedback #3)

export const HALL = { W: 8.8, H: 4, Z0: 10, Z1: FAR_Z } as const;

const N_SIDE = 8;
const FIRST_Z = 6, LAST_Z = -18;
const sideZ = Array.from({ length: N_SIDE }, (_, i) =>
  FIRST_Z + (LAST_Z - FIRST_Z) * (i / (N_SIDE - 1)));      // 6 … -18
const sideW = [2.4, 2.8, 2.4, 2.8, 2.4, 2.6, 2.4, 2.8];

export const mounts: MountPoint[] = [
  ...sideZ.map((z, i) => ({
    artworkId: i + 1,
    position: [i % 2 === 0 ? -WALL_X : WALL_X, HANG, z] as [number, number, number],
    rotationY: i % 2 === 0 ? Math.PI / 2 : -Math.PI / 2,
    width: sideW[i],
  })),
  { artworkId: 9, position: [0, HERO_Y, HERO_Z], rotationY: 0, width: HERO_W },
];

export const HERO_INDEX = N_SIDE; // 8
export const HERO_WIDTH = HERO_W;

// World-space painting centres (8 sides + hero), reused for the yaw-glance blend.
const sidePos: THREE.Vector3[] = sideZ.map((z, i) =>
  new THREE.Vector3(i % 2 === 0 ? -WALL_X : WALL_X, HANG, z));
// Default forward look: a point on the far hero wall, straight down the corridor.
const forwardTarget = new THREE.Vector3(0, HANG, HERO_Z);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------------------
// v2 camera model — WALK, don't slideshow (feedback #1).
//
//  • Rail: a straight centre-aisle line at eye height; offset 0→1 maps to z
//    START_Z→END_Z continuously (smoothstep eases only the very start/end, so
//    velocity never hits zero mid-corridor — that zero was the "slideshow" feel).
//  • Default look = forward, down the corridor at the hero (always faces the 9th).
//  • Yaw glances: as the camera draws level with a side painting, the look target
//    blends from forward toward that painting's world position, peaking when level,
//    easing back to forward. Opposite-wall contributions cancel at mid-points, so
//    between two works the gaze returns to centre. Pure yaw — horizon stays level.
// ---------------------------------------------------------------------------
const GLANCE_W = 2.6;   // along-rail falloff half-width (≈ painting spacing; nearest 1–2 contribute)

function railZ(t: number): number {
  return START_Z + (END_Z - START_Z) * smoothstep(t);
}

/** 1 when the camera is level with a painting (along-rail), easing to 0 by GLANCE_W. */
function glanceWeight(camZ: number, pz: number): number {
  return 1 - smoothstep(Math.abs(camZ - pz) / GLANCE_W);
}

export interface CameraSample {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  focus: number;  // 0..1 how strongly a work is currently framed (drives the label)
  index: number;  // mount index of the most-framed work (0..8)
}

// Scratch vectors reused each frame (sampleRail runs in useFrame). Consume the
// returned pos/look immediately; never retain across frames.
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _tmp = new THREE.Vector3();

/** Continuous walk sample at scroll offset t∈[0,1]. */
export function sampleRail(t: number): CameraSample {
  const c = clamp01(t);
  const z = railZ(c);
  _pos.set(0, EYE, z);

  _look.copy(forwardTarget);
  let bestW = 0, bestIdx = HERO_INDEX;
  for (let i = 0; i < N_SIDE; i++) {
    const w = glanceWeight(z, sideZ[i]);
    if (w > 1e-4) _look.addScaledVector(_tmp.subVectors(sidePos[i], forwardTarget), w);
    if (w > bestW) { bestW = w; bestIdx = i; }
  }

  // Near the end of the walk the hero becomes the framed work (its label appears),
  // then the outro fades in. The look is already forward = the hero, so no swing.
  const heroW = smoothstep((c - 0.78) / (0.95 - 0.78));
  if (heroW > bestW) { bestW = heroW; bestIdx = HERO_INDEX; }

  return { pos: _pos, look: _look, focus: bestW, index: bestIdx };
}

// Back-compat alias (CameraRig + tests). v2 = walk, not keyframe dwell.
export const sampleCamera = sampleRail;

// ---------------------------------------------------------------------------
// Click-to-focus (feedback #1, item 9) — a SEPARATE camera state. Clicking a
// painting tweens the camera off the rail to a head-on, frame-filling pose; the
// next scroll returns to the walk. focusPose() gives the target pose.
// ---------------------------------------------------------------------------
const FOV = 55;
const _halfV = (FOV * Math.PI / 180) / 2;

export interface FocusPose { pos: THREE.Vector3; look: THREE.Vector3; }
const _fpos = new THREE.Vector3();
const _flook = new THREE.Vector3();

/** Head-on, frame-filling camera pose for mount index i (0..8). */
export function focusPose(i: number): FocusPose {
  const m = mounts[Math.min(Math.max(i, 0), HERO_INDEX)];
  const nx = Math.sin(m.rotationY), nz = Math.cos(m.rotationY); // outward face normal
  // distance so the work fills the frame with a little breathing room
  const dist = (m.width * 0.62) / Math.tan(_halfV);
  _flook.set(m.position[0], m.position[1], m.position[2]);
  _fpos.set(m.position[0] + nx * dist, m.position[1], m.position[2] + nz * dist);
  return { pos: _fpos, look: _flook };
}

// ---------------------------------------------------------------------------
// Reduced-motion stations + outro timing.
// ---------------------------------------------------------------------------
/** Invert railZ: the offset t at which the camera is level with z (bisection on smoothstep). */
function offsetAtZ(targetZ: number): number {
  const frac = clamp01((targetZ - START_Z) / (END_Z - START_Z));
  let lo = 0, hi = 1;
  for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (smoothstep(mid) < frac) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

const sideStation = sideZ.map(offsetAtZ);
const HERO_STATION = 0.90;            // hero is admired near the very end of the walk
export const OUTRO_FADE_START = 0.94; // outro fades in strictly AFTER the hero hold

/** Offset that best frames a given mount (reduced-motion stop / fallback scroll target). */
export function focusOffsetForMount(mountIndex: number): number {
  const i = Math.min(Math.max(mountIndex, 0), HERO_INDEX);
  return i === HERO_INDEX ? HERO_STATION : sideStation[i];
}

/** Reduced-motion stops: gate, each of the 9 works, and the end. */
export const stops = [0, ...sideStation, HERO_STATION, 1];
