import * as THREE from 'three';

export interface MountPoint {
  artworkId: number;
  position: [number, number, number];
  rotationY: number; // radians; face into the hall
  width: number;     // world units (height derived from image aspect at render time)
}

const EYE = 1.6;       // eye height
const HANG = 1.7;      // painting / title center height
const WALL_X = 3.2;    // half-width; paintings at x = ∓WALL_X
const SPACING = 4;     // z between paintings
const FIRST_Z = 6;     // P1 z
export const FAR_Z = -26; // far end-wall (AURUM title) z — shared with TitleWall
const START_Z = 9;     // camera start z (offset 0)

// Pk z = FIRST_Z - (k-1)*SPACING → 6, 2, -2, -6, -10, -14, -18, -22
const widths = [2.4, 2.8, 2.4, 2.8, 2.4, 2.6, 2.4, 2.8];
export const mounts: MountPoint[] = widths.map((width, i) => {
  const left = i % 2 === 0;                 // P1 left, P2 right, ...
  return {
    artworkId: i + 1,
    position: [left ? -WALL_X : WALL_X, HANG, FIRST_Z - i * SPACING] as [number, number, number],
    rotationY: left ? Math.PI / 2 : -Math.PI / 2, // face into the hall (toward x=0)
    width,
  };
});

// Camera rail: straight down the centerline. Control points at the station z's so
// getPointAt(k/8) ≈ the painting-k viewing position (square-on to its wall).
const railZ = [START_Z, ...mounts.map(m => m.position[2])]; // 9 z's: 9,6,2,-2,-6,-10,-14,-18,-22
export const railPoints: [number, number, number][] = railZ.map(z => [0, EYE, z]);

// Look anchors: title wall first, then each painting center. Length = mounts.length + 1.
const titleAnchor = new THREE.Vector3(0, HANG, FAR_Z);
export const lookAnchors: THREE.Vector3[] = [
  titleAnchor,
  ...mounts.map(m => new THREE.Vector3(m.position[0], HANG, m.position[2])),
];
export const STATIONS = lookAnchors.length;

export function buildRail(points: [number, number, number][]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.5,
  );
}

/** Position at t plus a short look-ahead target along the curve (clamped). Kept for position use. */
export function sampleRail(curve: THREE.CatmullRomCurve3, t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  const pos = curve.getPointAt(clamped);
  const ahead = Math.min(1, clamped + 0.04);
  const look = ahead > clamped
    ? curve.getPointAt(ahead)
    : pos.clone().add(curve.getTangentAt(clamped)); // at t=1: look one unit along the tangent so it never collapses onto pos
  return { pos, look };
}

function smoothstep(x: number): number {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

/** Eased look-target across the station anchors: title → P1 → … → P8. */
export function sampleLook(t: number): THREE.Vector3 {
  const clamped = Math.min(1, Math.max(0, t));
  const u = clamped * (STATIONS - 1);
  const i = Math.min(STATIONS - 2, Math.floor(u));
  const frac = smoothstep(u - i);
  return lookAnchors[i].clone().lerp(lookAnchors[i + 1], frac);
}
