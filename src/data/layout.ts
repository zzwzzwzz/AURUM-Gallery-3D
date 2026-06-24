import * as THREE from 'three';

export interface MountPoint {
  artworkId: number;
  position: [number, number, number];
  rotationY: number; // radians; face into the room
  width: number;     // world units (height derived from image aspect at render time)
}

const EYE = 1.6;      // eye height
const HANG = 1.7;     // painting center height
const WALL_X = 3.2;   // corridor half-width

// Room A: a corridor down -Z, paintings alternating L/R walls (works 1..6).
// Room B: turn right, far wall holds works 7..8.
export const mounts: MountPoint[] = [
  { artworkId: 1, position: [-WALL_X, HANG, 6],  rotationY: Math.PI / 2,  width: 2.4 }, // L
  { artworkId: 2, position: [ WALL_X, HANG, 3],  rotationY: -Math.PI / 2, width: 2.8 }, // R
  { artworkId: 3, position: [-WALL_X, HANG, 0],  rotationY: Math.PI / 2,  width: 2.4 }, // L
  { artworkId: 4, position: [ WALL_X, HANG, -3], rotationY: -Math.PI / 2, width: 2.8 }, // R
  { artworkId: 5, position: [-WALL_X, HANG, -6], rotationY: Math.PI / 2,  width: 2.4 }, // L
  { artworkId: 6, position: [ WALL_X, HANG, -9], rotationY: -Math.PI / 2, width: 2.6 }, // R
  // Room B (after the right turn): camera travels +X; these face -X back toward the visitor path.
  { artworkId: 7, position: [ 13.8, HANG, -16], rotationY: -Math.PI / 2, width: 2.6 },
  { artworkId: 8, position: [ 13.8, HANG, -20], rotationY: -Math.PI / 2, width: 2.8 },
];

// Camera rail: down the corridor, curve right at the doorway, into Room B, stop facing the far wall.
export const railPoints: [number, number, number][] = [
  [0, EYE, 10],
  [0, EYE, 2],
  [0, EYE, -8],
  [0, EYE, -13],   // approach the doorway
  [3.5, EYE, -16], // curve right through the doorway
  [9, EYE, -18],   // into Room B, facing the far wall (works 7/8 on the right)
];

export function buildRail(points: [number, number, number][]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.5,
  );
}

/** Position at t plus a short look-ahead target along the curve (clamped). */
export function sampleRail(curve: THREE.CatmullRomCurve3, t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  const pos = curve.getPointAt(clamped);
  const ahead = Math.min(1, clamped + 0.04);
  const look = ahead > clamped
    ? curve.getPointAt(ahead)
    : pos.clone().add(curve.getTangentAt(clamped)); // at t=1: look one unit along the tangent so it never collapses onto pos
  return { pos, look };
}
