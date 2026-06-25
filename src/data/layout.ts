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
// ---------------------------------------------------------------------------
const EYE = 1.6;        // camera eye height
const HANG = 1.7;       // side-painting center height
const WALL_X = 3.2;     // side paintings at x = ∓WALL_X
const START_Z = 9;      // camera z at offset 0 (gate)
const END_Z = -21;      // camera z while viewing the hero (≈5 units from the hero wall)
const FAR_Z = -26;      // far wall z
const HERO_Z = FAR_Z + 0.4; // hero hangs just IN FRONT of the far wall (no z-fight with it)
const HERO_Y = 1.75;
const HERO_W = 1.5;

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

// Look targets per station (8 side painting centers + the hero center).
const stationLook: THREE.Vector3[] = [
  ...sideZ.map((z, i) => new THREE.Vector3(i % 2 === 0 ? -WALL_X : WALL_X, HANG, z)),
  new THREE.Vector3(0, HERO_Y, HERO_Z),
];
const forwardTarget = stationLook[HERO_INDEX]; // looking forward = looking at the hero wall

// ---------------------------------------------------------------------------
// Keyframe choreography. The camera DWELLS (holds head-on) at each painting for
// a real beat, faces FORWARD (toward the hero) while travelling between, gives
// the hero a longer admire-hold, then a FIN tail where it stays on the hero and
// the outro fades in. Offsets are normalised to [0,1] from arbitrary weights.
// ---------------------------------------------------------------------------
const OVERVIEW = 6.0;    // hold the full-hall overview after the gate fades, before P1
const LEAD = 1.4;        // entering from the overview to painting 1
const DWELL = 2.4;       // hold head-on at each side painting
const TRAVEL = 2.4;      // walk forward (facing front) between paintings — a longer gap
const HERO_DWELL = 3.2;  // longer hold to admire the hero
const FIN = 1.8;         // tail: hold on the hero while the outro fades in

interface KF { o: number; z: number; f: number; st: number }
/** Offset at which the outro 'FIN' begins — strictly AFTER the hero admire-hold. Set by the builder. */
export let OUTRO_FADE_START = 0.95;
const kf: KF[] = [];
const dwellCenter: number[] = []; // offset that frames each station head-on

(() => {
  let o = 0;
  kf.push({ o, z: START_Z, f: 0, st: 0 });        // gate / overview (forward, no focus)
  o += OVERVIEW;
  kf.push({ o, z: START_Z, f: 0, st: 0 });        // hold the overview (the gate has faded by now)
  o += LEAD;
  const a0 = o; kf.push({ o, z: sideZ[0], f: 1, st: 0 });   // arrive P1
  o += DWELL; kf.push({ o, z: sideZ[0], f: 1, st: 0 });     // hold P1
  dwellCenter[0] = (a0 + o) / 2;

  for (let k = 1; k < N_SIDE; k++) {
    o += TRAVEL / 2; kf.push({ o, z: (sideZ[k - 1] + sideZ[k]) / 2, f: 0, st: k }); // travel mid (forward)
    o += TRAVEL / 2; const ak = o; kf.push({ o, z: sideZ[k], f: 1, st: k }); // arrive Pk (smooth turn-in)
    o += DWELL; kf.push({ o, z: sideZ[k], f: 1, st: k });     // hold Pk
    dwellCenter[k] = (ak + o) / 2;
  }

  // travel to the hero, then a longer admire-hold
  o += TRAVEL / 2; kf.push({ o, z: (sideZ[N_SIDE - 1] + END_Z) / 2, f: 0, st: HERO_INDEX });
  o += TRAVEL / 2; const ah = o; kf.push({ o, z: END_Z, f: 1, st: HERO_INDEX }); // arrive hero (smooth)
  o += HERO_DWELL; kf.push({ o, z: END_Z, f: 1, st: HERO_INDEX }); // admire
  dwellCenter[HERO_INDEX] = (ah + o) / 2;
  const heroDwellEnd = o;

  o += FIN; kf.push({ o, z: END_Z, f: 1, st: HERO_INDEX }); // FIN tail (outro fades in)
  const total = o;

  for (const k of kf) k.o /= total;
  for (let i = 0; i < dwellCenter.length; i++) dwellCenter[i] /= total;
  OUTRO_FADE_START = heroDwellEnd / total;
})();

/** Reduced-motion stops: gate, each station head-on, and the very end. */
export const stops = [0, ...dwellCenter, 1];

export interface CameraSample {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  focus: number;  // 0..1 head-on to `index`
  index: number;  // mount index framed (0..8)
}

// Scratch vectors reused each frame (sampleCamera runs in useFrame). Consume the
// returned pos/look immediately; never retain across frames.
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function sampleCamera(t: number): CameraSample {
  const c = clamp01(t);
  // locate the keyframe interval
  let i = 0;
  while (i < kf.length - 2 && c > kf[i + 1].o) i++;
  const a = kf[i], b = kf[i + 1];
  const span = b.o - a.o;
  const frac = span > 1e-9 ? (c - a.o) / span : 0;

  const z = a.z + (b.z - a.z) * frac;
  const f = a.f + (b.f - a.f) * frac;
  const st = a.st;

  _pos.set(0, EYE, z);
  _look.copy(forwardTarget).lerp(stationLook[st], f); // forward by default; yaw to the station as f→1
  return { pos: _pos, look: _look, focus: f, index: st };
}

/** Offset that frames a given mount head-on (click-to-focus). */
export function focusOffsetForMount(mountIndex: number): number {
  return dwellCenter[Math.min(Math.max(mountIndex, 0), HERO_INDEX)];
}
