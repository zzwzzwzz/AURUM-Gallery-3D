import * as THREE from 'three';

export interface MountPoint {
  artworkId: number;
  position: [number, number, number];
  rotationY: number; // radians; face into the hall
  width: number;     // world units (height derived from image aspect at render time)
}

// ---------------------------------------------------------------------------
// Hall geometry. A single straight hall down -Z. 8 side paintings alternate
// L/R on the long walls; a 9th HERO painting hangs head-on on the far wall.
// ---------------------------------------------------------------------------
const EYE = 1.6;        // camera eye height
const HANG = 1.7;       // side-painting center height
const WALL_X = 3.2;     // half-width; side paintings at x = ∓WALL_X
const START_Z = 9;      // camera z at offset 0
const END_Z = -21;      // camera z at offset 1 (≈5 units from the hero wall → roomy framing)
const FAR_Z = -26;      // far wall (hero painting) z
const HERO_Y = 1.75;    // hero center height (tall portrait)
const HERO_W = 1.5;     // hero width (height derived from aspect → ~2.6 m tall)

// Shared with ProceduralRoom so the shell always matches the mounts/rail.
export const HALL = { W: 8.8, H: 4, Z0: 10, Z1: FAR_Z } as const;

const N_SIDE = 8;
const FIRST_Z = 6, LAST_Z = -18;
const sideZ = Array.from({ length: N_SIDE }, (_, i) =>
  FIRST_Z + (LAST_Z - FIRST_Z) * (i / (N_SIDE - 1)));      // 6 … -20
const sideW = [2.4, 2.8, 2.4, 2.8, 2.4, 2.6, 2.4, 2.8];

export const mounts: MountPoint[] = [
  ...sideZ.map((z, i) => ({
    artworkId: i + 1,
    position: [i % 2 === 0 ? -WALL_X : WALL_X, HANG, z] as [number, number, number],
    rotationY: i % 2 === 0 ? Math.PI / 2 : -Math.PI / 2,    // face toward x=0
    width: sideW[i],
  })),
  // Hero (№9) on the far wall, facing +Z back toward the incoming camera.
  { artworkId: 9, position: [0, HERO_Y, FAR_Z], rotationY: 0, width: HERO_W },
];

export const HERO_INDEX = N_SIDE; // index of the hero mount (8)

// The camera's default "forward" look — straight down the hall at the hero.
const forwardTarget = new THREE.Vector3(0, HERO_Y, FAR_Z);

// Offset at which the camera is head-on to each side painting (linear in z so
// the camera z equals the painting z at the focus peak → a true square-on view).
const span = START_Z - END_Z; // 30
export const sideFocus = sideZ.map((z) => (START_Z - z) / span); // 0.10 … 0.90
const HALF = (sideFocus[1] - sideFocus[0]) * 0.5;                // focus window half-width

// Reduced-motion stops: start (forward), each side painting, end (hero).
export const stops = [0, ...sideFocus, 1];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (x: number) => { const c = clamp01(x); return c * c * (3 - 2 * c); };
// Raised-cosine bump: 1 at d=0, 0 at d>=HALF.
const bump = (d: number) => (d >= HALF ? 0 : 0.5 * (1 + Math.cos(Math.PI * d / HALF)));
// Hero focus ramps in over the final stretch.
const heroFocus = (t: number) => smoothstep((t - 0.9) / 0.1);

export interface CameraSample {
  pos: THREE.Vector3;   // camera position
  look: THREE.Vector3;  // look-at target
  focus: number;        // 0..1 how head-on we are to `index`
  index: number;        // mount index currently framed (0..8)
}

// Scratch vectors reused across calls — sampleCamera runs every frame (useFrame),
// so we mutate-and-return instead of allocating. Consume the returned pos/look
// immediately (CameraRig lerps from them the same frame); never retain across frames.
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _mountTarget = new THREE.Vector3();

/**
 * Forward-default camera: the look is the hero wall straight ahead, EXCEPT near
 * each side painting where it yaws to face that painting head-on, then returns
 * to forward. The hero ramps in over the final stretch.
 */
export function sampleCamera(t: number): CameraSample {
  const c = clamp01(t);
  _pos.set(0, EYE, START_Z + (END_Z - START_Z) * c);

  let bestW = 0, idx = -1;
  for (let k = 0; k < N_SIDE; k++) {
    const w = bump(Math.abs(c - sideFocus[k]));
    if (w > bestW) { bestW = w; idx = k; }
  }
  const hw = heroFocus(c);
  if (hw > bestW) { bestW = hw; idx = HERO_INDEX; }

  _look.copy(forwardTarget);
  if (idx >= 0 && idx < N_SIDE) {
    const m = mounts[idx];
    _look.lerp(_mountTarget.set(m.position[0], m.position[1], m.position[2]), bestW);
  }
  // For the side panel: when nothing is in focus, report the nearest side painting
  // (the panel stays hidden because focus is low).
  let index = idx;
  if (index < 0) {
    let nd = Infinity;
    for (let k = 0; k < N_SIDE; k++) {
      const d = Math.abs(c - sideFocus[k]);
      if (d < nd) { nd = d; index = k; }
    }
  }
  return { pos: _pos, look: _look, focus: bestW, index };
}

/** Offset that frames a given mount head-on (used by click-to-focus). */
export function focusOffsetForMount(mountIndex: number): number {
  return mountIndex >= N_SIDE ? 1 : sideFocus[mountIndex];
}
