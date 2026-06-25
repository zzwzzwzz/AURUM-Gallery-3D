# Warm-Classical Hall Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the dark corridor-with-a-turn into a single warm-classical hall where the visitor walks straight forward and the camera turns to face one painting head-on at a time, opening on an in-scene AURUM title wall.

**Architecture:** Keep scroll-on-rails + zustand canvas→DOM bridge. Decouple camera *look* from the rail tangent: position follows a straight forward rail; a new `sampleLook(offset)` eases the look-target between station anchors (title wall → P1 … → P8). The procedural room becomes one warm-classical box (parquet floor, coffered ceiling, paneled warm-white walls, warm raking light) built with runtime `CanvasTexture` generators — no external texture assets, so it always runs.

**Tech Stack:** Vite + React 18 + TypeScript, @react-three/fiber@8, @react-three/drei@9, @react-three/postprocessing@2, three@0.169, zustand, Vitest.

## Global Constraints

- React MUST stay 18 (`react@^18.3`) — r3f@8 requires it. Do not bump.
- Real typecheck is `npx tsc --noEmit` (vite build uses esbuild, does NOT typecheck).
- Gold = light only (glow/hairline/one accent) — never gold fills/panels.
- Procedural room is the single room that ALWAYS runs — no external asset may be required for `npm run dev`. Do NOT fetch any model at module scope.
- drei `<Image>` uses a shader-uniform `map`, not `material.map` (don't touch Painting's aspect logic).
- A raw `<spotLight>` only aims if its `.target` is in the scene graph (Painting already handles this — leave it).
- `@react-three/postprocessing` v2.19: `enableNormalPass={false}` (already correct).
- Fonts: Cormorant Garamond (serif) + Space Mono (mono), from `tokens.font`.
- Ring-fence: art = Met CC0 (now self-hosted under `public/art/`); no production data.

## Coordinate model (single straight hall)

Camera walks the centerline `x = 0` from the entrance (`+Z`) toward the far wall (`−Z`).
Paintings alternate L/R on the long walls; the **far end-wall bears AURUM** (first thing seen, straight down the hall).

```
EYE   = 1.6    // camera/eye height
HANG  = 1.7    // painting + title center height
WALL_X = 3.2   // half-width: paintings at x = ∓WALL_X
SPACING = 4    // z between consecutive paintings
FIRST_Z = 6    // P1 z; Pk z = FIRST_Z - (k-1)*SPACING  → 6,2,-2,-6,-10,-14,-18,-22
FAR_Z  = -26   // far end-wall (title) ; ENTRANCE_Z = 10 (wall behind camera start)
```

Station model: **9 stops** = `[titleWall, P1…P8]`. At offset 0 the camera (z≈9) looks down the hall at the AURUM far wall; as offset rises the look eases to each painting in turn, and the position rail puts the camera at that painting's z so the view is square-on.

## File Structure

| File | Responsibility |
|------|----------------|
| `src/data/layout.ts` | Hall mounts (8, alternating), straight rail, `lookAnchors`, `sampleLook`. Keep `buildRail`/`sampleRail` for position. |
| `src/data/layout.test.ts` | Rewrite for straight-hall + `sampleLook`. |
| `src/scene/CameraRig.tsx` | Position from `sampleRail`, look from `sampleLook`, station snap for reduced motion. |
| `src/theme/tokens.ts` + test | Warm-classical palette (warm-white wall, parquet floor, coffer ceiling). |
| `src/scene/textures.ts` (new) | `CanvasTexture` generators: parquet, coffer, wall paneling. |
| `src/scene/ProceduralRoom.tsx` | One warm-classical hall box using the textures + warm directional light. |
| `src/scene/TitleWall.tsx` (new) | In-scene `AURUM` 3D text on the far wall. |
| `src/scene/GalleryCanvas.tsx` | Mount `<TitleWall/>`; lower ambient for the dim mood. |
| `public/art/*` | ✅ DONE — 8 self-hosted Met CC0 JPEGs. |

---

## Task 0: Self-host the paintings — ✅ ALREADY DONE

The 8 Met CC0 images are downloaded to `public/art/NN-slug.jpg`, `artworks[].src` point to `/art/...`, and `artworks.test.ts` asserts the local path. Verified: `npx vitest run src/data/artworks.test.ts` → 2/2 pass; `tsc --noEmit` clean. No further action.

---

## Task 1: Layout — straight hall, anchors, `sampleLook`

**Files:**
- Modify: `src/data/layout.ts`
- Test: `src/data/layout.test.ts` (rewrite)

**Interfaces:**
- Consumes: `artworks` (for length), `THREE`.
- Produces:
  - `mounts: MountPoint[]` — 8 entries, alternating `x = ∓WALL_X`, z per the coordinate model.
  - `railPoints: [number,number,number][]` — straight rail, 9 points at the station z's.
  - `lookAnchors: THREE.Vector3[]` — length 9: `[titleWallCenter, P1center … P8center]`.
  - `buildRail(points)` — unchanged.
  - `sampleRail(curve, t)` — unchanged (used for position).
  - `sampleLook(t: number): THREE.Vector3` — eased look-target across `lookAnchors`.
  - `STATIONS: number` — `lookAnchors.length` (= 9).

- [ ] **Step 1: Write the failing tests** — replace the whole body of `src/data/layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mounts, railPoints, lookAnchors, buildRail, sampleRail, sampleLook, STATIONS } from './layout';
import { artworks } from './artworks';

describe('gallery layout — straight warm-classical hall', () => {
  it('has one mount per artwork', () => {
    expect(mounts).toHaveLength(artworks.length);
    expect(new Set(mounts.map(m => m.artworkId))).toEqual(new Set(artworks.map(a => a.id)));
  });
  it('paintings alternate left/right walls', () => {
    for (let i = 0; i < mounts.length; i++) {
      const sign = Math.sign(mounts[i].position[0]);
      expect(Math.abs(mounts[i].position[0])).toBeCloseTo(3.2, 5);
      expect(sign).toBe(i % 2 === 0 ? -1 : 1); // P1 left, P2 right, ...
    }
  });
  it('paintings march monotonically down -Z', () => {
    for (let i = 1; i < mounts.length; i++) {
      expect(mounts[i].position[2]).toBeLessThan(mounts[i - 1].position[2]);
    }
  });
  it('rail is a straight line down the hall centerline', () => {
    expect(railPoints.length).toBe(STATIONS);
    for (const [x] of railPoints) expect(Math.abs(x)).toBeLessThan(0.001);
    const curve = buildRail(railPoints);
    const t0 = curve.getTangentAt(0.05), t1 = curve.getTangentAt(0.95);
    expect(Math.abs(t0.x - t1.x)).toBeLessThan(0.05); // no turn — straight
  });
  it('has 9 stations: title wall + 8 paintings', () => {
    expect(STATIONS).toBe(artworks.length + 1);
    expect(lookAnchors).toHaveLength(STATIONS);
  });
  it('sampleLook(0) returns the title-wall anchor', () => {
    expect(sampleLook(0).distanceTo(lookAnchors[0])).toBeLessThan(1e-6);
  });
  it('sampleLook(1) returns the last painting anchor', () => {
    expect(sampleLook(1).distanceTo(lookAnchors[STATIONS - 1])).toBeLessThan(1e-6);
  });
  it('look-target is never equal to the camera rail position (no NaN lookAt)', () => {
    const curve = buildRail(railPoints);
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const pos = sampleRail(curve, t).pos;
      const look = sampleLook(t);
      expect(look.distanceTo(pos)).toBeGreaterThan(0.5);
    }
  });
  it('sampleRail still travels the hall', () => {
    const curve = buildRail(railPoints);
    expect(sampleRail(curve, 0).pos.distanceTo(sampleRail(curve, 1).pos)).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/data/layout.test.ts`
Expected: FAIL — `lookAnchors`, `sampleLook`, `STATIONS` not exported / assertions fail.

- [ ] **Step 3: Rewrite `src/data/layout.ts`** (replace mounts, railPoints, and add anchors/sampleLook; keep the `MountPoint` interface, `buildRail`, `sampleRail` exactly):

```ts
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
const FAR_Z = -26;     // far end-wall (AURUM title) z
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
    : pos.clone().add(curve.getTangentAt(clamped));
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/data/layout.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

---

## Task 2: CameraRig — look from `sampleLook`, station snap

**Files:**
- Modify: `src/scene/CameraRig.tsx`

**Interfaces:**
- Consumes: `buildRail`, `railPoints`, `sampleRail` (position), `sampleLook`, `STATIONS` (from layout).
- Produces: no new exports (component behavior change only).

- [ ] **Step 1: Replace `src/scene/CameraRig.tsx`** with:

```tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { buildRail, railPoints, sampleRail, sampleLook, STATIONS } from '../data/layout';
import { useGalleryStore } from '../store/galleryStore';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function CameraRig() {
  const scroll = useScroll();
  const setOffset = useGalleryStore((s) => s.setOffset);
  const reduced = useReducedMotion();
  const curve = useMemo(() => buildRail(railPoints), []);

  // Start looking at the title wall (offset 0) to avoid a first-frame swing.
  const lookTarget = useRef<THREE.Vector3>(sampleLook(0));

  useFrame((state, delta) => {
    const raw = scroll.offset; // 0..1
    // Reduced motion: snap to the nearest of the N discrete stations (title + 8 works).
    const t = reduced ? Math.round(raw * (STATIONS - 1)) / (STATIONS - 1) : raw;
    setOffset(raw);

    const { pos } = sampleRail(curve, t);   // position: forward dolly
    const look = sampleLook(t);             // look: eased across station anchors

    const damp = reduced ? 1 : 1 - Math.pow(0.001, delta);
    state.camera.position.lerp(pos, damp);
    lookTarget.current.lerp(look, damp);
    state.camera.lookAt(lookTarget.current);
  });

  return null;
}
```

Note: `artworks` import is removed (station count now comes from `STATIONS`).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0 (no unused-import or missing-export errors).

- [ ] **Step 3: Run the full suite** (CameraRig has no direct test; confirm nothing else broke)

Run: `npx vitest run`
Expected: PASS.

---

## Task 3: Tokens — warm-classical palette

**Files:**
- Modify: `src/theme/tokens.ts`
- Test: `src/theme/tokens.test.ts`

**Interfaces:**
- Produces: `tokens.color.wall/floor/ceil` repurposed to warm values; new `tokens.color.wallTrim`. Locked keys (`bg/gold/goldBright/spot/warmWhite/muted/hairline`) unchanged.

- [ ] **Step 1: Add assertions to `src/theme/tokens.test.ts`** (append inside the describe block, after the existing `it` blocks):

```ts
  it('exposes a warm-classical interior palette', () => {
    // bg stays the locked near-black for page/fallback behind the canvas
    expect(tokens.color.bg).toBe('#0B0B0C');
    // interior is now warm, not charcoal
    expect(tokens.color.wall).toMatch(/^#/);
    expect(tokens.color.wall.toLowerCase()).not.toBe('#18171a');
    expect(tokens.color.floor.toLowerCase()).not.toBe('#101012');
    expect(tokens.color.wallTrim).toMatch(/^#/);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/theme/tokens.test.ts`
Expected: FAIL — `wallTrim` undefined / wall still charcoal.

- [ ] **Step 3: Update the color block in `src/theme/tokens.ts`** (replace `wall`, `floor`, `ceil` and add `wallTrim`; keep everything else):

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/theme/tokens.test.ts`
Expected: PASS.

---

## Task 4: Procedural textures (`CanvasTexture` generators)

**Files:**
- Create: `src/scene/textures.ts`

**Interfaces:**
- Consumes: `THREE`.
- Produces:
  - `makeParquetTexture(): THREE.Texture` — herringbone warm wood, tiling.
  - `makeCofferTexture(): THREE.Texture` — recessed-panel grid, warm wood.
  - `makePanelTexture(): THREE.Texture` — warm-white wall with molding rectangles.
  - Each returns a ready `CanvasTexture` with `wrapS=wrapT=RepeatWrapping` and `colorSpace=SRGBColorSpace`. Returns a 1×1 flat-color fallback texture if `document`/canvas is unavailable (SSR/test safety).

- [ ] **Step 1: Create `src/scene/textures.ts`:**

```ts
import * as THREE from 'three';
import { tokens } from '../theme/tokens';

function canvas(size = 512): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  return ctx ? { c, ctx } : null;
}

function flat(color: string): THREE.Texture {
  const t = typeof document !== 'undefined' ? canvas(2) : null;
  if (!t) return new THREE.Texture(); // SSR/test: harmless empty texture
  t.ctx.fillStyle = color;
  t.ctx.fillRect(0, 0, 2, 2);
  const tex = new THREE.CanvasTexture(t.c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function finish(c: HTMLCanvasElement, repeat: [number, number]): THREE.Texture {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Herringbone parquet — warm wood planks at alternating 90°. */
export function makeParquetTexture(): THREE.Texture {
  const t = canvas(512);
  if (!t) return flat(tokens.color.floor);
  const { c, ctx } = t;
  ctx.fillStyle = tokens.color.floor;
  ctx.fillRect(0, 0, 512, 512);
  const plankL = 128, plankW = 32, shades = ['#6B4A2E', '#7A5435', '#5E4026', '#724D30'];
  let n = 0;
  for (let y = -plankL; y < 512 + plankL; y += plankW) {
    for (let x = -plankL; x < 512 + plankL; x += plankL) {
      const horiz = ((Math.floor(y / plankW) + Math.floor(x / plankL)) % 2) === 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = shades[n++ % shades.length];
      if (horiz) ctx.fillRect(0, 0, plankL - 2, plankW - 2);
      else ctx.fillRect(0, 0, plankW - 2, plankL - 2);
      ctx.restore();
    }
  }
  return finish(c, [6, 6]);
}

/** Coffered ceiling — grid of recessed warm-wood panels with shaded bevels. */
export function makeCofferTexture(): THREE.Texture {
  const t = canvas(512);
  if (!t) return flat(tokens.color.ceil);
  const { c, ctx } = t;
  ctx.fillStyle = '#3C2A18'; // recess shadow
  ctx.fillRect(0, 0, 512, 512);
  const cell = 128, bevel = 16;
  for (let gy = 0; gy < 512; gy += cell) {
    for (let gx = 0; gx < 512; gx += cell) {
      // panel face
      ctx.fillStyle = tokens.color.ceil;
      ctx.fillRect(gx + bevel, gy + bevel, cell - 2 * bevel, cell - 2 * bevel);
      // highlight top/left, shadow bottom/right
      ctx.fillStyle = 'rgba(255,230,180,0.18)';
      ctx.fillRect(gx + bevel, gy + bevel, cell - 2 * bevel, 4);
      ctx.fillRect(gx + bevel, gy + bevel, 4, cell - 2 * bevel);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(gx + bevel, gy + cell - bevel - 4, cell - 2 * bevel, 4);
      ctx.fillRect(gx + cell - bevel - 4, gy + bevel, 4, cell - 2 * bevel);
    }
  }
  return finish(c, [5, 4]);
}

/** Paneled warm-white wall — large rectangular molding frames. */
export function makePanelTexture(): THREE.Texture {
  const t = canvas(512);
  if (!t) return flat(tokens.color.wall);
  const { c, ctx } = t;
  ctx.fillStyle = tokens.color.wall;
  ctx.fillRect(0, 0, 512, 512);
  const m = 48;
  ctx.strokeStyle = tokens.color.wallTrim;
  ctx.lineWidth = 6;
  ctx.strokeRect(m, m, 512 - 2 * m, 512 - 2 * m);
  ctx.lineWidth = 3;
  ctx.strokeRect(m + 22, m + 22, 512 - 2 * m - 44, 512 - 2 * m - 44);
  return finish(c, [3, 1]);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0. (No unit test — these are visual; the SSR fallback keeps imports safe.)

---

## Task 5: ProceduralRoom — warm-classical hall

**Files:**
- Modify: `src/scene/ProceduralRoom.tsx` (full rewrite)

**Interfaces:**
- Consumes: `makeParquetTexture`, `makeCofferTexture`, `makePanelTexture` (Task 4), `MeshReflectorMaterial`, `tokens`, `THREE`.
- Produces: default `ProceduralRoom` — one hall box spanning the new coordinates.

Room box: length covers `z ∈ [10, -26]` (≈36, center z=-8), width `x ∈ [-4.4, 4.4]` (8.8, paintings at ±3.2 sit clear of walls), height 4 (floor y=0, ceiling y=4; EYE=1.6 sits inside).

- [ ] **Step 1: Replace `src/scene/ProceduralRoom.tsx`:**

```tsx
import { useMemo } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { tokens } from '../theme/tokens';
import { makeParquetTexture, makeCofferTexture, makePanelTexture } from './textures';

const W = 8.8;   // hall width  (x: -4.4..4.4)
const H = 4;     // hall height (y: 0..4)
const Z0 = 10;   // entrance wall z
const Z1 = -26;  // far (title) wall z
const D = Z0 - Z1;          // depth 36
const CZ = (Z0 + Z1) / 2;   // center z = -8

export default function ProceduralRoom() {
  const parquet = useMemo(makeParquetTexture, []);
  const coffer = useMemo(makeCofferTexture, []);
  const panel = useMemo(makePanelTexture, []);

  return (
    <group position={[0, H / 2, CZ]}>
      {/* Parquet floor with a subtle waxed reflection (lower mirror than a true mirror). */}
      <mesh position={[0, -H / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <MeshReflectorMaterial
          map={parquet}
          roughness={0.7}
          metalness={0.05}
          blur={[200, 60]}
          mixBlur={1}
          mixStrength={1.2}
          resolution={512}
          mirror={0.12}
        />
      </mesh>

      {/* Coffered ceiling */}
      <mesh position={[0, H / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={coffer} roughness={0.95} />
      </mesh>

      {/* Long paneled walls (warm-white) */}
      <mesh position={[-W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={panel} color={tokens.color.wall} roughness={0.95} />
      </mesh>
      <mesh position={[W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={panel} color={tokens.color.wall} roughness={0.95} />
      </mesh>

      {/* Entrance wall (behind camera start) and far/title wall (plain — TitleWall draws text in front) */}
      <mesh position={[0, 0, D / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={panel} color={tokens.color.wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={tokens.color.wall} roughness={0.95} />
      </mesh>

      {/* Warm directional "window" light raking across the floor + the per-painting spots. */}
      <directionalLight position={[6, 7, 4]} intensity={0.9} color={'#ffdfae'} />
    </group>
  );
}
```

Note: `map` is valid on `MeshReflectorMaterial` (its Props extend `meshStandardMaterial`). The texture `colorSpace` is set in Task 4.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Run the suite**

Run: `npx vitest run`
Expected: PASS (no test imports ProceduralRoom; this confirms no collateral breakage).

---

## Task 6: TitleWall + canvas wiring

**Files:**
- Create: `src/scene/TitleWall.tsx`
- Modify: `src/scene/GalleryCanvas.tsx`

**Interfaces:**
- Consumes: drei `Text`, `tokens`, layout far-wall z (`FAR_Z = -26`, HANG=1.7).
- Produces: default `TitleWall` component rendered as a sibling of `ProceduralRoom`.

- [ ] **Step 1: Create `src/scene/TitleWall.tsx`:**

```tsx
import { Text } from '@react-three/drei';
import { tokens } from '../theme/tokens';

// Far end-wall at z = -26 (see layout FAR_Z). Text faces +Z toward the incoming camera,
// sitting just in front of the wall plane so it never z-fights.
const WALL_Z = -26;

export default function TitleWall() {
  return (
    <group position={[0, 2.0, WALL_Z + 0.05]}>
      <Text
        font={undefined}
        fontSize={0.9}
        letterSpacing={0.18}
        color={tokens.color.warmWhite}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.004}
        outlineColor={tokens.color.gold}
      >
        AURUM
      </Text>
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.16}
        letterSpacing={0.36}
        color={tokens.color.gold}
        anchorX="center"
        anchorY="middle"
      >
        IMMERSIVE GALLERY
      </Text>
    </group>
  );
}
```

Note: drei `<Text>` falls back to its built-in font when `font` is undefined (Cormorant isn't a loaded `.ttf` in-scene; the DOM overlay carries the serif brand). The gold outline gives the "gold = light" glow, amplified by Bloom.

- [ ] **Step 2: Mount it + dim the ambient in `src/scene/GalleryCanvas.tsx`.**

Add the import near the other scene imports:

```tsx
import TitleWall from './TitleWall';
```

Lower the fill lights for the dim mood — replace the two light lines (`<hemisphereLight .../>` and `<ambientLight intensity={0.5} />`) with:

```tsx
      <hemisphereLight args={[0xfff0d8, 0x201810, 0.3]} />
      <ambientLight intensity={0.28} />
```

Render `<TitleWall />` right after the room, inside `<ScrollControls>`:

```tsx
          <ProceduralRoom />
          <TitleWall />
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

---

## Task 7: Full verification + docs

**Files:**
- Modify: `CLAUDE.md` (Architecture/Gotchas note), `README` if present.

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: ALL pass (layout, tokens, artworks, activeArtwork, SidePanel).

- [ ] **Step 2: Real typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Dev-server smoke check**

Run: `npm run dev` and load the page. Confirm: opening view faces the AURUM far wall; scrolling walks forward and the camera turns to face each painting head-on, one full at a time; floor/ceiling/walls read warm-classical; reduced-motion (OS setting) snaps cleanly between the 9 stops. (Use render-specialist for a screenshot if desired.)

- [ ] **Step 4: Update `CLAUDE.md`** — change the Architecture "Hybrid room" / "Scroll-on-rails" notes to: single straight hall, dual-rail camera (`sampleLook` decouples look from rail tangent), in-scene title wall, self-hosted art under `public/art/`. Update Gotchas to note the procedural `CanvasTexture` room (no external texture assets) and that `sampleLook` anchors never coincide with the centerline rail.

- [ ] **Step 5: Commit (on Ziwen's sign-off at the senior-review gate)**

Hold the code commit until the gate per the global "commit only when asked" rule; then:

```bash
git add -A
git commit -m "feat: warm-classical hall — forward walk, head-on framing, self-hosted art"
```

---

## Self-Review (author checklist — done)

- **Spec coverage:** §1 hall geometry → Task 1; §2 room shell → Tasks 4–5; §3 title wall → Task 6; §4 dual-rail camera → Tasks 1–2; §5 textures → Task 4; §6 artwork → Task 0 (done); §7 tokens → Task 3; a11y (reduced-motion snap) → Task 2; tests → each task. No gaps.
- **Placeholder scan:** no TBD/TODO; every code step shows full code.
- **Type consistency:** `sampleLook`/`lookAnchors`/`STATIONS` defined in Task 1 and consumed with the same names/types in Task 2; texture generator names match between Task 4 and Task 5; `tokens.color.wallTrim` defined in Task 3 and used in Task 4.
- **Note:** `activeArtwork`/`offsetToIndex` left unchanged — at offset 0 the side panel shows work 1 while the camera frames the title wall; acceptable (the panel is a reading aid, not the primary focus). Revisit only if Ziwen wants a "title" state in the panel.
