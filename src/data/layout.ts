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
const HANG = EYE;       // hang EVERY work's centre at eye level so the camera's gaze is
                        // perfectly horizontal — the frame stays square to the screen
                        // (no top/bottom keystone from looking up/down at it)
const WALL_X = 3.2;     // side paintings at x = ∓WALL_X
const START_Z = 9;      // camera z at offset 0 (gate / entrance)
const END_Z = -20;      // camera z at offset 1 — stops ~6 units short of the far wall
const FAR_Z = -26;      // far wall z
const HERO_Z = FAR_Z + 0.4; // hero hangs just IN FRONT of the far wall (no z-fight)
const HERO_Y = EYE;         // hero centred at eye level too — head-on, no vertical keystone
const HERO_W = 3.0;         // widest work — a real destination at the vanishing point (feedback #3)

// Forward museum lean — disabled per feedback; paintings hang flush/square to the wall.
export const LEAN = 0;

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
// Default forward look: the hero's CENTRE, straight down the corridor — so the No.9
// work sits dead-centre of frame (both axes) whenever the camera looks forward.
const forwardTarget = new THREE.Vector3(0, HERO_Y, HERO_Z);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------------------
// v2 camera model — WALK, with a brief admire-DWELL at each work (feedback #5).
//
//  • Rail: a straight centre-aisle line at eye height. offset 0→1 maps to z via a
//    keyframe curve: the camera glides forward (TRAVEL), then LINGERS a beat at each
//    painting (DWELL, z held) so you can take it in, then glides on. TRAVEL segments
//    are smoothstep-eased so the pause reads as "stop to admire", not a hard cut.
//  • Default look = forward, down the corridor at the hero (always faces the 9th).
//  • Yaw glances: the look target is derived from the camera's z — as it draws level
//    with a side work the gaze turns toward it (peaking, fully centred, during the
//    dwell) and returns to forward between works. Pure yaw — horizon stays level.
// ---------------------------------------------------------------------------
const GLANCE_W = 2.6;   // along-rail falloff half-width (≈ painting spacing; nearest 1–2 contribute)

// Keyframe weights (arbitrary units, normalised to [0,1] below).
const OVERVIEW = 6.0;       // hold the entrance overview — show the WHOLE gallery a beat after the gate fades, before the first work
const LEAD = 1.8;          // enter from the overview to the first work
const DWELL = 2.6;         // LINGER head-on at each side work — the "few seconds" (feedback #5)
const TRAVEL = 3.6;        // glide forward between works — a longer stroll down the aisle
const HERO_APPROACH = 2.6; // walk in toward the hero
const HERO_DWELL = 5.0;    // much longer hold to admire the No.9 hero (the destination)
const FIN = 1.6;           // tail: hold on the hero while the outro fades in

interface KF { o: number; z: number }
const kf: KF[] = [];
const dwellCenter: number[] = []; // offset that frames each station (0..8)
export let OUTRO_FADE_START = 0.94; // set by the IIFE: outro fades strictly AFTER the hero hold
let heroFocusFrom = 0.86;           // offset where the hero starts becoming the framed work
let heroFocusWidth = 0.1;           // offset span over which the hero takes over (the approach)

(() => {
  let o = 0;
  kf.push({ o, z: START_Z });
  o += OVERVIEW; kf.push({ o, z: START_Z });
  o += LEAD; let a = o; kf.push({ o, z: sideZ[0] });   // arrive P0
  o += DWELL; kf.push({ o, z: sideZ[0] }); dwellCenter[0] = (a + o) / 2; // dwell P0

  for (let k = 1; k < N_SIDE; k++) {
    o += TRAVEL; a = o; kf.push({ o, z: sideZ[k] });   // glide + arrive
    o += DWELL; kf.push({ o, z: sideZ[k] }); dwellCenter[k] = (a + o) / 2; // dwell
  }

  const approachStart = o;                              // camera begins walking toward the hero
  o += HERO_APPROACH; a = o; kf.push({ o, z: END_Z });  // arrives at the hero viewing spot
  o += HERO_DWELL; kf.push({ o, z: END_Z }); dwellCenter[HERO_INDEX] = (a + o) / 2; // admire
  const heroEnd = o;
  o += FIN; kf.push({ o, z: END_Z });
  const total = o;

  for (const k of kf) k.o /= total;
  for (let i = 0; i < dwellCenter.length; i++) dwellCenter[i] /= total;
  OUTRO_FADE_START = heroEnd / total;
  // Hero takes over the look across the whole APPROACH, so by the time the camera
  // reaches the viewing spot the side-glance is fully released (×0) and the hero sits
  // dead-centre for the entire dwell (feedback: final work off-centre on scroll).
  heroFocusFrom = approachStart / total;
  heroFocusWidth = (a - approachStart) / total;
})();

/** Camera z at offset c — keyframe curve with smoothstep-eased travel + flat dwells. */
function railZ(c: number): number {
  let i = 0;
  while (i < kf.length - 2 && c > kf[i + 1].o) i++;
  const a = kf[i], b = kf[i + 1];
  const span = b.o - a.o;
  const frac = span > 1e-9 ? smoothstep((c - a.o) / span) : 0;
  return a.z + (b.z - a.z) * frac;
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

/** Walk sample at scroll offset t∈[0,1]. */
export function sampleRail(t: number): CameraSample {
  const c = clamp01(t);
  const z = railZ(c);
  _pos.set(0, EYE, z);

  // The hero sits beyond the rail's end, so it never wins on z-distance; ramp its
  // focus over the approach so its label appears, then the outro fades in.
  const heroW = smoothstep((c - heroFocusFrom) / heroFocusWidth);

  // Side-glance fades to zero as the hero takes over (× (1 - heroW)), so a trailing
  // side work can't tug the look off the hero's centre during the final dwell.
  _look.copy(forwardTarget);
  let bestW = 0, bestIdx = HERO_INDEX;
  for (let i = 0; i < N_SIDE; i++) {
    const w = glanceWeight(z, sideZ[i]) * (1 - heroW);
    if (w > 1e-4) _look.addScaledVector(_tmp.subVectors(sidePos[i], forwardTarget), w);
    if (w > bestW) { bestW = w; bestIdx = i; }
  }

  if (heroW > bestW) { bestW = heroW; bestIdx = HERO_INDEX; }

  return { pos: _pos, look: _look, focus: bestW, index: bestIdx };
}

// Back-compat alias (CameraRig + tests).
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
// Reduced-motion stations + click fallback.
// ---------------------------------------------------------------------------
/** Offset that best frames a given mount (reduced-motion stop / fallback scroll target). */
export function focusOffsetForMount(mountIndex: number): number {
  return dwellCenter[Math.min(Math.max(mountIndex, 0), HERO_INDEX)];
}

/** Reduced-motion stops: gate, each of the 9 works' dwell centres, and the end. */
export const stops = [0, ...dwellCenter, 1];
