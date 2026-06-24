# AURUM Immersive Gallery (v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A scroll-driven 3D gallery website where the camera glides through a multi-room gallery (with turns), passing the 8 AURUM Met works on the walls while a side panel narrates the active piece — on-brand, accessible, runnable before any external asset is downloaded.

**Architecture:** Vite + React + TypeScript + react-three-fiber. Scroll position (drei `ScrollControls`) maps to arc-length along a `CatmullRomCurve3`; the camera follows the curve and looks down its tangent, so rounding a corner is just continued scrolling. A tiny zustand store bridges canvas→DOM so the fixed AURUM overlay/side-panel can react to the active artwork. The room is a procedural charcoal box-gallery by default; Elin's Sketchfab GLB swaps in via one config flag. Postprocessing (bloom + vignette + warm tone) carries the AURUM "gold = light" look.

**Tech Stack:** Vite, React 18, TypeScript, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, zustand, Vitest + @testing-library/react + jsdom.

## Global Constraints

- **Stack versions (pin in package.json):** `react@^18.3`, `react-dom@^18.3`, `three@^0.169`, `@react-three/fiber@^8.17`, `@react-three/drei@^9.114`, `@react-three/postprocessing@^2.16`, `zustand@^4.5`, `vite@^5.4`, `typescript@^5.5`, `vitest@^2.1`, `@testing-library/react@^16`, `jsdom@^25`.
- **Project location:** `~/aurum-gallery-3d/` (new sibling of `~/aurum-gallery`). All paths below are relative to this root.
- **AURUM palette (verbatim):** bg `#0B0B0C`, wall `#18171a`, floor `#101012`, ceil `#0d0d0f`, warm white `#EDEAE3`, muted `#A39E92`, gold `#C9A24B`, bright gold `#E0B85A` (single accent only), spot `#ffe6b0`, hairline `rgba(201,162,75,0.18)`.
- **Type:** Cormorant Garamond (headings/blurbs) + Space Mono (labels/numerals), Google Fonts `display=swap`, system fallbacks.
- **Gold = light, never paint.** No gold fills/panels. One bright-gold accent max per view.
- **Voice:** curatorial wall-label — short, present-tense, restrained. Never marketing copy.
- **Artwork:** the 8 Met Open Access (CC0) works only; URLs verbatim from this plan.
- **Credits (required):** model = "VR Gallery House (baked) by Elin (@ElinHohler), CC BY 4.0"; art = "The Met Open Access (CC0)". Shown in overlay credits + README.
- **A11y:** honor `prefers-reduced-motion`; no-WebGL/load-error → link to the 2D AURUM gallery; keyboard-scrollable; descriptive `alt`/labels; visible focus.
- **Commit after every task.** Conventional commit messages.

---

### Task 1: Project scaffold, tooling, AURUM tokens

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.gitignore`
- Create: `src/main.tsx`, `src/App.tsx`, `src/theme/tokens.ts`, `src/index.css`
- Create: `src/theme/tokens.test.ts`

**Interfaces:**
- Produces: `tokens` object (`tokens.color.bg`, `tokens.color.gold`, `tokens.color.goldBright`, `tokens.color.spot`, `tokens.font.serif`, `tokens.font.mono`, `tokens.artFilter`), all consumed by later tasks.

- [ ] **Step 1: Scaffold + install**

```bash
cd ~ && npm create vite@latest aurum-gallery-3d -- --template react-ts
cd ~/aurum-gallery-3d
npm install three@^0.169 @react-three/fiber@^8.17 @react-three/drei@^9.114 @react-three/postprocessing@^2.16 zustand@^4.5
npm install -D vitest@^2.1 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25 @types/three@^0.169
git init && printf "node_modules\ndist\npublic/models/*.glb\n.DS_Store\n" > .gitignore
```

- [ ] **Step 2: Configure Vitest** — create `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] },
});
```

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom';
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Write the AURUM tokens + failing test** — create `src/theme/tokens.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { tokens } from './tokens';

describe('AURUM tokens', () => {
  it('exposes the locked palette', () => {
    expect(tokens.color.bg).toBe('#0B0B0C');
    expect(tokens.color.gold).toBe('#C9A24B');
    expect(tokens.color.goldBright).toBe('#E0B85A');
    expect(tokens.color.spot).toBe('#ffe6b0');
  });
  it('exposes the dimmed-art filter and fonts', () => {
    expect(tokens.artFilter).toContain('saturate');
    expect(tokens.font.serif).toMatch(/Cormorant/);
    expect(tokens.font.mono).toMatch(/Space Mono/);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./tokens`.

- [ ] **Step 5: Implement tokens** — create `src/theme/tokens.ts`

```ts
export const tokens = {
  color: {
    bg: '#0B0B0C',
    raise: '#121113',
    wall: '#18171a',
    floor: '#101012',
    ceil: '#0d0d0f',
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
```

- [ ] **Step 6: Base HTML + global CSS + fonts** — replace `index.html` `<head>` additions and create `src/index.css`

In `index.html`, set `<title>AURUM — Immersive Gallery (beta)</title>` and add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
```

Create `src/index.css`:

```css
:root { color-scheme: dark; }
* { box-sizing: border-box; }
html, body, #root { margin: 0; height: 100%; }
body { background: #0B0B0C; color: #EDEAE3; overflow: hidden; font-family: 'Cormorant Garamond', Georgia, serif; }
canvas { display: block; }
.u-mono { font-family: 'Space Mono', ui-monospace, monospace; }
:focus-visible { outline: 2px solid #E0B85A; outline-offset: 2px; }
```

- [ ] **Step 7: Minimal App + main** — replace `src/App.tsx` and `src/main.tsx`

`src/main.tsx`:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
```

`src/App.tsx`:

```tsx
import { tokens } from './theme/tokens';

export default function App() {
  return (
    <main style={{ height: '100%', display: 'grid', placeItems: 'center', background: tokens.color.bg }}>
      <h1 style={{ fontFamily: tokens.font.serif, color: tokens.color.warmWhite, fontWeight: 400 }}>
        <span style={{ color: tokens.color.gold }}>—</span> AURUM <span style={{ color: tokens.color.gold }}>—</span>
      </h1>
    </main>
  );
}
```

- [ ] **Step 8: Run test + dev server**

Run: `npm test` → Expected: PASS (2 tests).
Run: `npm run dev` → open the URL. Expected: charcoal page, centered "— AURUM —" wordmark with gold em-dashes, serif font loaded.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "chore: scaffold AURUM 3D gallery (vite+r3f+ts), AURUM tokens"
```

---

### Task 2: Artwork data + integrity test

**Files:**
- Create: `src/data/artworks.ts`, `src/data/artworks.test.ts`

**Interfaces:**
- Produces: `interface Artwork { id:number; title:string; artist:string; meta:string; src:string; blurb:string }` and `export const artworks: Artwork[]` (length 8). Consumed by Painting, SidePanel, layout, hooks.

- [ ] **Step 1: Write the failing test** — `src/data/artworks.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { artworks } from './artworks';

describe('artworks dataset', () => {
  it('has exactly 8 works with unique sequential ids 1..8', () => {
    expect(artworks).toHaveLength(8);
    expect(artworks.map(a => a.id).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('every work has all fields and a Met CC0 image url', () => {
    for (const a of artworks) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.artist.length).toBeGreaterThan(0);
      expect(a.meta).toMatch(/·/);
      expect(a.blurb.split(' ').length).toBeGreaterThanOrEqual(8);
      expect(a.src).toMatch(/^https:\/\/images\.metmuseum\.org\/CRDImages\//);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/data/artworks.test.ts` → Expected: FAIL — cannot find `./artworks`.

- [ ] **Step 3: Implement the dataset** — `src/data/artworks.ts` (blurbs in AURUM wall-label voice)

```ts
export interface Artwork {
  id: number;
  title: string;
  artist: string;
  meta: string;   // "year · medium"
  src: string;
  blurb: string;  // curatorial, present-tense, restrained
}

export const artworks: Artwork[] = [
  { id: 1, title: 'Wheat Field with Cypresses', artist: 'Vincent van Gogh', meta: '1889 · Oil on canvas',
    src: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-42549-001.jpg',
    blurb: 'The wind is visible. Van Gogh paints the field as one continuous current, the cypress a dark flame holding it still.' },
  { id: 2, title: 'The Great Wave off Kanagawa', artist: 'Katsushika Hokusai', meta: 'c.1831 · Woodblock',
    src: 'https://images.metmuseum.org/CRDImages/as/web-large/DP141042.jpg',
    blurb: 'A wave curls into claws above three slender boats. Beyond it, Fuji sits small and unmoved.' },
  { id: 3, title: 'Still Life with Apples', artist: 'Paul Cézanne', meta: 'c.1890 · Oil on canvas',
    src: 'https://images.metmuseum.org/CRDImages/ep/web-large/DT47.jpg',
    blurb: 'Cézanne tips the table toward us so the fruit cannot settle. Weight and color do the work perspective will not.' },
  { id: 4, title: 'The Monet Family in Their Garden', artist: 'Édouard Manet', meta: '1874 · Oil on canvas',
    src: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-25465-001.jpg',
    blurb: 'A summer afternoon caught loosely: Manet paints his friend’s family in the grass with the speed of being there.' },
  { id: 5, title: "L'Arlésienne: Madame Ginoux", artist: 'Vincent van Gogh', meta: '1888 · Oil on canvas',
    src: 'https://images.metmuseum.org/CRDImages/ep/web-large/DT1396.jpg',
    blurb: 'A woman rests her chin on her hand among yellow. The books beside her insist she is a person who thinks.' },
  { id: 6, title: 'The Card Players', artist: 'Paul Cézanne', meta: '1890 · Oil on canvas',
    src: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP231550.jpg',
    blurb: 'Two men lean into a quiet game. Cézanne builds the scene like architecture — patient, deliberate, unhurried.' },
  { id: 7, title: 'Portrait of a Man', artist: 'Rembrandt van Rijn', meta: 'c.1660 · Oil on canvas',
    src: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP145912.jpg',
    blurb: 'Light finds the face and lets the rest fall into shadow. Rembrandt asks you to meet a single steady gaze.' },
  { id: 8, title: 'Six Jewel Rivers', artist: 'Utagawa Hiroshige', meta: '1857 · Woodblock',
    src: 'https://images.metmuseum.org/CRDImages/as/web-large/DP-13180-023.jpg',
    blurb: 'Hiroshige gathers six famous rivers into one elegant conceit, water carrying name and place across the print.' },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/data/artworks.test.ts` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: AURUM Met CC0 artwork dataset with curatorial blurbs"
```

---

### Task 3: Active-artwork mapping (scroll offset → index)

**Files:**
- Create: `src/store/galleryStore.ts`, `src/hooks/activeArtwork.ts`, `src/hooks/activeArtwork.test.ts`

**Interfaces:**
- Produces: `offsetToIndex(offset:number, count:number): number` (pure). `useGalleryStore` zustand store: `{ offset:number; activeIndex:number; set(o:number):void }`.

- [ ] **Step 1: Write the failing test** — `src/hooks/activeArtwork.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { offsetToIndex } from './activeArtwork';

describe('offsetToIndex', () => {
  it('maps 0 to the first work and 1 to the last', () => {
    expect(offsetToIndex(0, 8)).toBe(0);
    expect(offsetToIndex(1, 8)).toBe(7);
  });
  it('splits the 0..1 range into equal bands', () => {
    expect(offsetToIndex(0.1, 8)).toBe(0);
    expect(offsetToIndex(0.5, 8)).toBe(4);
    expect(offsetToIndex(0.95, 8)).toBe(7);
  });
  it('clamps out-of-range input', () => {
    expect(offsetToIndex(-0.5, 8)).toBe(0);
    expect(offsetToIndex(2, 8)).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/hooks/activeArtwork.test.ts` → Expected: FAIL — no `./activeArtwork`.

- [ ] **Step 3: Implement the pure mapping** — `src/hooks/activeArtwork.ts`

```ts
/** Map a 0..1 scroll offset to a 0-based artwork index across `count` equal bands. */
export function offsetToIndex(offset: number, count: number): number {
  const clamped = Math.min(1, Math.max(0, offset));
  return Math.min(count - 1, Math.floor(clamped * count));
}
```

- [ ] **Step 4: Implement the store** — `src/store/galleryStore.ts`

```ts
import { create } from 'zustand';
import { artworks } from '../data/artworks';
import { offsetToIndex } from '../hooks/activeArtwork';

interface GalleryState {
  offset: number;
  activeIndex: number;
  setOffset: (offset: number) => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  offset: 0,
  activeIndex: 0,
  setOffset: (offset) => set({ offset, activeIndex: offsetToIndex(offset, artworks.length) }),
}));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/hooks/activeArtwork.test.ts` → Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scroll-offset to active-artwork mapping + zustand bridge store"
```

---

### Task 4: Gallery layout — rail curve + painting mounts (procedural)

**Files:**
- Create: `src/data/layout.ts`, `src/data/layout.test.ts`

**Interfaces:**
- Produces:
  - `interface MountPoint { artworkId:number; position:[number,number,number]; rotationY:number; width:number }`
  - `export const mounts: MountPoint[]` (length 8)
  - `export const railPoints: [number,number,number][]` (the corridor with one turn)
  - `export function buildRail(points): THREE.CatmullRomCurve3`
  - `export function sampleRail(curve, t): { pos: THREE.Vector3; look: THREE.Vector3 }` — position at `t` and a slightly-ahead look target (tangent), both clamped to [0,1].

- [ ] **Step 1: Write the failing test** — `src/data/layout.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { mounts, railPoints, buildRail, sampleRail } from './layout';
import { artworks } from './artworks';

describe('gallery layout', () => {
  it('has one mount per artwork', () => {
    expect(mounts).toHaveLength(artworks.length);
    expect(new Set(mounts.map(m => m.artworkId))).toEqual(new Set(artworks.map(a => a.id)));
  });
  it('rail has enough control points to turn a corner', () => {
    expect(railPoints.length).toBeGreaterThanOrEqual(4);
  });
  it('sampleRail returns distinct position and look-ahead within bounds', () => {
    const curve = buildRail(railPoints);
    const a = sampleRail(curve, 0);
    const b = sampleRail(curve, 1);
    expect(a.pos.distanceTo(b.pos)).toBeGreaterThan(1); // camera actually travels
    const mid = sampleRail(curve, 0.5);
    expect(mid.look.distanceTo(mid.pos)).toBeGreaterThan(0); // looks ahead, not at itself
  });
  it('the rail changes horizontal direction (a real turn exists)', () => {
    const curve = buildRail(railPoints);
    const t0 = curve.getTangentAt(0.05);
    const t1 = curve.getTangentAt(0.95);
    // x/z heading differs => the path turned
    expect(Math.abs(t0.x - t1.x) + Math.abs(t0.z - t1.z)).toBeGreaterThan(0.3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/data/layout.test.ts` → Expected: FAIL — no `./layout`.

- [ ] **Step 3: Implement the layout** — `src/data/layout.ts`

Geometry: Room A is a corridor along **−Z** (camera starts at `z=10`, walks toward `z=−14`). At the far end the rail **turns right (+X)** through a doorway into Room B, a wider room; camera ends facing the far wall. Walls sit at `x=±3.2` in the corridor; Room B far wall at `z=−20`.

```ts
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
  { artworkId: 7, position: [ 8.5, HANG, -16], rotationY: -Math.PI / 2, width: 2.6 },
  { artworkId: 8, position: [ 8.5, HANG, -20], rotationY: -Math.PI / 2, width: 2.8 },
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
  const look = curve.getPointAt(Math.min(1, clamped + 0.04));
  return { pos, look };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/data/layout.test.ts` → Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: procedural gallery layout — rail curve with a turn + painting mounts"
```

---

### Task 5: Procedural room + canvas shell (first runnable 3D)

**Files:**
- Create: `src/scene/ProceduralRoom.tsx`, `src/scene/GalleryCanvas.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `<ProceduralRoom />` (charcoal walls/floor/ceiling for both rooms), `<GalleryCanvas />` (the `<Canvas>` + base lights; paintings/rig added in later tasks).
- Consumes: `tokens`.

- [ ] **Step 1: Implement the procedural room** — `src/scene/ProceduralRoom.tsx`

```tsx
import { tokens } from '../theme/tokens';

// Two boxes meeting at a doorway: a -Z corridor and a +X room B.
export default function ProceduralRoom() {
  return (
    <group>
      {/* Corridor (Room A): centered near z=-2, spans z[10..-14], x[-3.4..3.4] */}
      <Box size={[6.8, 4, 24]} center={[0, 2, -2]} />
      {/* Room B: centered near (9,-18), wider box */}
      <Box size={[10, 4, 12]} center={[9, 2, -18]} />
    </group>
  );
}

/** Inward-facing room shell (floor, ceiling, 4 walls) built from planes. */
function Box({ size, center }: { size: [number, number, number]; center: [number, number, number] }) {
  const [w, h, d] = size;
  const [cx, cy, cz] = center;
  const wall = tokens.color.wall, floor = tokens.color.floor, ceil = tokens.color.ceil;
  return (
    <group position={[cx, cy, cz]}>
      <mesh position={[0, -h / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} /><meshStandardMaterial color={floor} roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} /><meshStandardMaterial color={ceil} roughness={1} />
      </mesh>
      <mesh position={[0, 0, -d / 2]}>
        <planeGeometry args={[w, h]} /><meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      <mesh position={[0, 0, d / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} /><meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      <mesh position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} /><meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      <mesh position={[w / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} /><meshStandardMaterial color={wall} roughness={1} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Implement the canvas shell** — `src/scene/GalleryCanvas.tsx`

```tsx
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { tokens } from '../theme/tokens';
import ProceduralRoom from './ProceduralRoom';

export default function GalleryCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.6, 10], fov: 55, near: 0.1, far: 100 }}
      gl={{ antialias: true }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <color attach="background" args={[tokens.color.bg]} />
      <hemisphereLight args={[0xffffff, 0x222222, 0.45]} />
      <ambientLight intensity={0.5} />
      <Suspense fallback={null}>
        <ProceduralRoom />
      </Suspense>
    </Canvas>
  );
}
```

- [ ] **Step 3: Mount the canvas** — replace `src/App.tsx`

```tsx
import GalleryCanvas from './scene/GalleryCanvas';

export default function App() {
  return <GalleryCanvas />;
}
```

- [ ] **Step 4: Run + observe**

Run: `npm run dev`. Expected: a dark charcoal room — you are inside a corridor looking down −Z, faint walls/floor/ceiling visible under ambient light. No errors in console.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: procedural charcoal room + r3f canvas shell"
```

---

### Task 6: Paintings — Image planes, frames, per-painting spotlights

**Files:**
- Create: `src/scene/Painting.tsx`
- Modify: `src/scene/GalleryCanvas.tsx`

**Interfaces:**
- Produces: `<Painting mount={MountPoint} artwork={Artwork} />`.
- Consumes: `mounts`, `artworks`, `tokens`, drei `Image`.

- [ ] **Step 1: Implement Painting** — `src/scene/Painting.tsx`

```tsx
import { Image } from '@react-three/drei';
import { useState } from 'react';
import type { MountPoint } from '../data/layout';
import type { Artwork } from '../data/artworks';
import { tokens } from '../theme/tokens';

export default function Painting({ mount, artwork }: { mount: MountPoint; artwork: Artwork }) {
  const [aspect, setAspect] = useState(1); // width/height; corrected on texture load
  const w = mount.width;
  const h = w / aspect;
  return (
    <group position={mount.position} rotation={[0, mount.rotationY, 0]}>
      {/* dark frame slab slightly behind the art */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.18, h + 0.18, 0.06]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.8} />
      </mesh>
      <Image
        url={artwork.src}
        scale={[w, h]}
        transparent
        toneMapped={false}
        // AURUM dimmed-art look: tint slightly down
        color="#eae7df"
        onUpdate={(self: any) => {
          const tex = self?.material?.map;
          if (tex?.image?.width && tex.image.height) {
            const a = tex.image.width / tex.image.height;
            if (Math.abs(a - aspect) > 0.001) setAspect(a);
          }
        }}
      />
      {/* warm pool of light washing this work */}
      <spotLight
        position={[0, 2.2, 1.6]}
        target-position={[0, 0, 0]}
        angle={0.5}
        penumbra={0.7}
        intensity={2.6}
        distance={7}
        color={tokens.color.spot}
      />
    </group>
  );
}
```

> Note: drei `<Image>` renders unlit (its own shader), so the dimmed-art look comes from the `color` tint, not scene lighting; the spotlight lights the surrounding wall (the "gallery pool"), which is the intended effect.

- [ ] **Step 2: Render all paintings** — modify `src/scene/GalleryCanvas.tsx` to add inside `<Suspense>` after `<ProceduralRoom />`:

```tsx
import Painting from './Painting';
import { mounts } from '../data/layout';
import { artworks } from '../data/artworks';
// ...inside <Suspense>:
{mounts.map((m) => {
  const art = artworks.find((a) => a.id === m.artworkId)!;
  return <Painting key={m.artworkId} mount={m} artwork={art} />;
})}
```

- [ ] **Step 3: Run + observe**

Run: `npm run dev`. Expected: framed paintings appear on the corridor walls (and two in Room B), each lit by a warm pool on the wall. Images load (Met hotlink) after a moment; aspect ratios look correct (not stretched).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: framed paintings with per-work spotlights and correct aspect"
```

---

### Task 7: Camera rig — scroll drives the rail (with the turn) + reduced-motion

**Files:**
- Create: `src/hooks/useReducedMotion.ts`, `src/scene/CameraRig.tsx`
- Modify: `src/scene/GalleryCanvas.tsx`

**Interfaces:**
- Produces: `useReducedMotion(): boolean`; `<CameraRig />` (must render inside `<ScrollControls>`). Updates the store's offset each frame and moves the default camera along the rail.
- Consumes: `buildRail`, `sampleRail`, `railPoints`, `useGalleryStore`, drei `useScroll`, fiber `useFrame`.

- [ ] **Step 1: Reduced-motion hook** — `src/hooks/useReducedMotion.ts`

```ts
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: Camera rig** — `src/scene/CameraRig.tsx`

```tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { buildRail, railPoints, sampleRail } from '../data/layout';
import { useGalleryStore } from '../store/galleryStore';
import { artworks } from '../data/artworks';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function CameraRig() {
  const scroll = useScroll();
  const setOffset = useGalleryStore((s) => s.setOffset);
  const reduced = useReducedMotion();
  const curve = useMemo(() => buildRail(railPoints), []);
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const raw = scroll.offset; // 0..1
    // reduced motion: snap to the nearest of N discrete stops
    const t = reduced ? Math.round(raw * (artworks.length - 1)) / (artworks.length - 1) : raw;
    setOffset(raw);
    const { pos, look } = sampleRail(curve, t);
    const damp = reduced ? 1 : 1 - Math.pow(0.001, delta); // frame-rate independent easing
    state.camera.position.lerp(pos, damp);
    lookTarget.current.lerp(look, damp);
    state.camera.lookAt(lookTarget.current);
  });

  return null;
}
```

- [ ] **Step 3: Wrap scene in ScrollControls + add rig** — modify `src/scene/GalleryCanvas.tsx`

Wrap the room+paintings group in `<ScrollControls pages={4} damping={0.25}>` and render `<CameraRig />` inside it:

```tsx
import { ScrollControls } from '@react-three/drei';
import CameraRig from './CameraRig';
// ...replace the <Suspense> body:
<Suspense fallback={null}>
  <ScrollControls pages={4} damping={0.25}>
    <CameraRig />
    <ProceduralRoom />
    {mounts.map((m) => {
      const art = artworks.find((a) => a.id === m.artworkId)!;
      return <Painting key={m.artworkId} mount={m} artwork={art} />;
    })}
  </ScrollControls>
</Suspense>
```

- [ ] **Step 4: Run + observe**

Run: `npm run dev`. Expected: scrolling (wheel / two-finger / drag) glides the camera down the corridor; near the end it **curves right through the doorway** into Room B and faces works 7–8. Motion eases smoothly. With OS "reduce motion" on, the camera snaps between works instead of gliding.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: scroll-driven camera rig along the rail with reduced-motion snap"
```

---

### Task 8: In-world wall labels

**Files:**
- Create: `src/scene/WallLabel.tsx`
- Modify: `src/scene/Painting.tsx`

**Interfaces:**
- Produces: `<WallLabel artwork={Artwork} width={number} />` (drei `Html`, placed beside the art).
- Consumes: drei `Html`, `tokens`.

- [ ] **Step 1: Implement WallLabel** — `src/scene/WallLabel.tsx`

```tsx
import { Html } from '@react-three/drei';
import type { Artwork } from '../data/artworks';
import { tokens } from '../theme/tokens';

export default function WallLabel({ artwork, width }: { artwork: Artwork; width: number }) {
  return (
    <Html
      position={[width / 2 + 0.35, -0.1, 0]}
      transform
      occlude={false}
      distanceFactor={4}
      style={{ width: 150, pointerEvents: 'none', userSelect: 'none' }}
    >
      <div style={{ fontFamily: tokens.font.mono, color: tokens.color.warmWhite, lineHeight: 1.35 }}>
        <div style={{ color: tokens.color.gold, fontSize: 11, letterSpacing: '0.12em' }}>
          № {String(artwork.id).padStart(2, '0')}
        </div>
        <div style={{ fontFamily: tokens.font.serif, fontSize: 15, marginTop: 4 }}>{artwork.title}</div>
        <div style={{ fontSize: 10, color: tokens.color.muted, marginTop: 2 }}>{artwork.artist}</div>
        <div style={{ fontSize: 9, color: tokens.color.muted }}>{artwork.meta}</div>
      </div>
    </Html>
  );
}
```

- [ ] **Step 2: Add the label to each Painting** — modify `src/scene/Painting.tsx`, add inside the `<group>` after `<Image>`:

```tsx
import WallLabel from './WallLabel';
// ...inside the group:
<WallLabel artwork={artwork} width={w} />
```

- [ ] **Step 3: Run + observe**

Run: `npm run dev`. Expected: a small Space-Mono wall plate (`№ 01`, title, artist, medium) sits to the side of each painting, oriented with the wall, readable as you pass.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: in-world wall labels (catalog numeral + title) beside each work"
```

---

### Task 9: AURUM overlay chrome + side intro panel

**Files:**
- Create: `src/ui/Overlay.tsx`, `src/ui/SidePanel.tsx`, `src/ui/SidePanel.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `<Overlay />` (fixed header wordmark + beta tag + scroll hint + credits), `<SidePanel />` (reads `useGalleryStore().activeIndex`, cross-fades the active work's blurb).
- Consumes: `useGalleryStore`, `artworks`, `tokens`.

- [ ] **Step 1: Write a failing component test** — `src/ui/SidePanel.test.tsx`

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SidePanel from './SidePanel';
import { useGalleryStore } from '../store/galleryStore';
import { artworks } from '../data/artworks';

describe('SidePanel', () => {
  beforeEach(() => useGalleryStore.setState({ offset: 0, activeIndex: 0 }));
  it('shows the active work title and blurb', () => {
    useGalleryStore.setState({ activeIndex: 2 });
    render(<SidePanel />);
    expect(screen.getByText(artworks[2].title)).toBeInTheDocument();
    expect(screen.getByText(artworks[2].blurb)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/ui/SidePanel.test.tsx` → Expected: FAIL — no `./SidePanel`.

- [ ] **Step 3: Implement SidePanel** — `src/ui/SidePanel.tsx`

```tsx
import { useGalleryStore } from '../store/galleryStore';
import { artworks } from '../data/artworks';
import { tokens } from '../theme/tokens';

export default function SidePanel() {
  const activeIndex = useGalleryStore((s) => s.activeIndex);
  const art = artworks[activeIndex];
  return (
    <aside
      aria-live="polite"
      style={{
        position: 'fixed', left: 'clamp(16px, 4vw, 56px)', bottom: 'clamp(24px, 8vh, 80px)',
        maxWidth: 320, pointerEvents: 'none',
      }}
    >
      <div key={art.id} style={{ animation: 'aurumFade 600ms ease both' }}>
        <div className="u-mono" style={{ color: tokens.color.gold, fontSize: 12, letterSpacing: '0.14em' }}>
          № {String(art.id).padStart(2, '0')}
        </div>
        <h2 style={{ fontFamily: tokens.font.serif, fontWeight: 500, fontSize: 30, margin: '6px 0 2px', color: tokens.color.warmWhite }}>
          {art.title}
        </h2>
        <div className="u-mono" style={{ fontSize: 12, color: tokens.color.muted }}>{art.artist} · {art.meta}</div>
        <p style={{ fontFamily: tokens.font.serif, fontSize: 18, lineHeight: 1.5, color: tokens.color.warmWhite, marginTop: 12 }}>
          {art.blurb}
        </p>
      </div>
    </aside>
  );
}
```

Add the keyframe to `src/index.css`:

```css
@keyframes aurumFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { @keyframes aurumFade { from { opacity: 1; } to { opacity: 1; } } }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/ui/SidePanel.test.tsx` → Expected: PASS.

- [ ] **Step 5: Implement Overlay** — `src/ui/Overlay.tsx`

```tsx
import { tokens } from '../theme/tokens';

export default function Overlay() {
  return (
    <>
      <header style={{ position: 'fixed', top: 22, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 clamp(16px,4vw,56px)', pointerEvents: 'none' }}>
        <h1 style={{ margin: 0, fontFamily: tokens.font.serif, fontWeight: 400, fontSize: 22, letterSpacing: '0.18em', color: tokens.color.warmWhite }}>
          <span style={{ color: tokens.color.gold }}>—</span> AURUM <span style={{ color: tokens.color.gold }}>—</span>
        </h1>
        <span className="u-mono" style={{ fontSize: 11, color: tokens.color.muted, letterSpacing: '0.14em', alignSelf: 'center' }}>
          immersive · beta
        </span>
      </header>
      <div className="u-mono" style={{ position: 'fixed', bottom: 18, right: 'clamp(16px,4vw,56px)', fontSize: 10, color: tokens.color.muted, pointerEvents: 'none', textAlign: 'right', lineHeight: 1.6 }}>
        scroll to walk the gallery<br />
        <span style={{ opacity: 0.7 }}>model: VR Gallery House by Elin (CC BY 4.0) · art: The Met (CC0)</span>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Compose overlay + panel over the canvas** — replace `src/App.tsx`

```tsx
import GalleryCanvas from './scene/GalleryCanvas';
import Overlay from './ui/Overlay';
import SidePanel from './ui/SidePanel';

export default function App() {
  return (
    <>
      <GalleryCanvas />
      <Overlay />
      <SidePanel />
    </>
  );
}
```

- [ ] **Step 7: Run + observe**

Run: `npm run dev`. Expected: fixed "— AURUM —" header + "immersive · beta", a bottom-left intro panel that **cross-fades to the active work** as you scroll, and a bottom-right scroll hint + credits line.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: AURUM overlay chrome + scroll-synced side intro panel"
```

---

### Task 10: Postprocessing — bloom, vignette, warm tone

**Files:**
- Modify: `src/scene/GalleryCanvas.tsx`

**Interfaces:**
- Consumes: `@react-three/postprocessing` (`EffectComposer`, `Bloom`, `Vignette`), three `ToneMapping`/exposure.

- [ ] **Step 1: Add the composer** — modify `src/scene/GalleryCanvas.tsx`

Add `import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';` and set `gl={{ antialias: true }}` already present; add tone exposure on the Canvas: `gl={{ antialias: true, toneMappingExposure: 1.1 }}`. Then add as the **last** child inside `<Canvas>` (outside `<Suspense>`):

```tsx
<EffectComposer disableNormalPass>
  <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.55} luminanceSmoothing={0.2} />
  <Vignette eskil={false} offset={0.25} darkness={0.85} />
</EffectComposer>
```

- [ ] **Step 2: Run + observe**

Run: `npm run dev`. Expected: the warm spotlight pools and gold accents now **glow** (bloom); edges of the frame darken (vignette); overall image reads warmer and more "premium". No major frame-rate drop on desktop.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: bloom + vignette postprocessing for the AURUM gold-glow look"
```

---

### Task 11: Accessibility — loading bar, no-WebGL fallback, keyboard, click-to-focus

**Files:**
- Create: `src/ui/Loader.tsx`, `src/ui/Fallback.tsx`, `src/lib/webgl.ts`
- Modify: `src/App.tsx`, `src/scene/Painting.tsx`

**Interfaces:**
- Produces: `isWebGLAvailable(): boolean`; `<Loader />` (drei `useProgress` bar); `<Fallback />` (accessible screen linking to the 2D AURUM gallery).
- Consumes: drei `useProgress`, `useCursor`.

- [ ] **Step 1: WebGL probe** — `src/lib/webgl.ts`

```ts
export function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Fallback screen** — `src/ui/Fallback.tsx`

```tsx
import { tokens } from '../theme/tokens';

export default function Fallback() {
  return (
    <main style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24, background: tokens.color.bg }}>
      <div style={{ maxWidth: 460 }}>
        <h1 style={{ fontFamily: tokens.font.serif, fontWeight: 400, color: tokens.color.warmWhite }}>
          <span style={{ color: tokens.color.gold }}>—</span> AURUM <span style={{ color: tokens.color.gold }}>—</span>
        </h1>
        <p style={{ fontFamily: tokens.font.serif, fontSize: 18, color: tokens.color.warmWhite }}>
          The immersive gallery needs WebGL, which isn’t available here.
        </p>
        <a href="https://example.com/aurum/" style={{ fontFamily: tokens.font.mono, fontSize: 13, color: tokens.color.goldBright }}>
          Enter the gallery in 2D →
        </a>
      </div>
    </main>
  );
}
```

> Replace the `href` with the deployed 2D AURUM URL (or a relative path) at integration time.

- [ ] **Step 3: Loading bar** — `src/ui/Loader.tsx`

```tsx
import { useProgress } from '@react-three/drei';
import { tokens } from '../theme/tokens';

export default function Loader() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: tokens.color.bg, zIndex: 10 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="u-mono" style={{ color: tokens.color.muted, fontSize: 11, letterSpacing: '0.2em', marginBottom: 10 }}>
          HANGING THE WORKS… {Math.round(progress)}%
        </div>
        <div style={{ width: 200, height: 1, background: tokens.color.hairline }}>
          <div style={{ width: `${progress}%`, height: '100%', background: tokens.color.goldBright, transition: 'width 200ms' }} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Gate the app on WebGL + show loader** — replace `src/App.tsx`

```tsx
import GalleryCanvas from './scene/GalleryCanvas';
import Overlay from './ui/Overlay';
import SidePanel from './ui/SidePanel';
import Loader from './ui/Loader';
import Fallback from './ui/Fallback';
import { isWebGLAvailable } from './lib/webgl';

export default function App() {
  if (!isWebGLAvailable()) return <Fallback />;
  return (
    <>
      <Loader />
      <GalleryCanvas />
      <Overlay />
      <SidePanel />
    </>
  );
}
```

- [ ] **Step 5: Click-to-focus a painting + keyboard scroll** — modify `src/scene/Painting.tsx`

Add `useCursor` + a pointer affordance and click handler that scrolls to the work. Import and add hover state:

```tsx
import { useCursor } from '@react-three/drei';
import { useScroll } from '@react-three/drei';
// inside component:
const [hovered, setHovered] = useState(false);
useCursor(hovered);
const scroll = useScroll();
const focusThis = () => {
  const target = (artwork.id - 1) / (8 - 1); // 0..1 band center for this work
  scroll.el.scrollTo({ top: target * (scroll.el.scrollHeight - scroll.el.clientHeight), behavior: 'smooth' });
};
```

Attach to the `<Image>`: `onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={focusThis}`.

ScrollControls already makes its `<div>` keyboard-scrollable (arrows/space/PageUp-Down) because it is a native scroll container; verify by tabbing to it.

- [ ] **Step 6: Run + observe + test**

Run: `npm test` → Expected: all prior tests still PASS.
Run: `npm run dev`. Expected: a gold loading bar ("HANGING THE WORKS… n%") shows until images decode, then fades; hovering a painting shows a pointer; clicking smooth-scrolls toward it; arrow/space keys scroll the gallery. Temporarily forcing `isWebGLAvailable` to return false shows the accessible 2D-link fallback.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: loading bar, no-WebGL fallback, keyboard scroll, click-to-focus"
```

---

### Task 12: Swap-in path for the Sketchfab GLB room

**Files:**
- Create: `src/scene/GltfRoom.tsx`, `src/config.ts`
- Modify: `src/scene/GalleryCanvas.tsx`

**Interfaces:**
- Produces: `<GltfRoom url={string} />` (loads + renders the baked GLB near-unlit); `config.useGltfRoom: boolean`, `config.gltfUrl: string`.
- Consumes: drei `useGLTF`.

- [ ] **Step 1: Config flag** — `src/config.ts`

```ts
// Flip to true after dropping Elin's model at public/models/gallery.glb.
export const config = {
  useGltfRoom: false,
  gltfUrl: '/models/gallery.glb',
} as const;
```

- [ ] **Step 2: GLB room** — `src/scene/GltfRoom.tsx`

```tsx
import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';

export default function GltfRoom({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Baked model: show textures near-unlit so our color grade/post owns the mood.
  useLayoutEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const m = mesh.material as THREE.MeshStandardMaterial;
        if (m && 'roughness' in m) { m.roughness = 1; m.metalness = 0; }
        mesh.castShadow = false; mesh.receiveShadow = true;
      }
    });
  }, [scene]);
  return <primitive object={scene} />;
}
```

- [ ] **Step 3: Choose room by config** — modify `src/scene/GalleryCanvas.tsx`

```tsx
import { config } from '../config';
import GltfRoom from './GltfRoom';
// replace <ProceduralRoom /> with:
{config.useGltfRoom ? <GltfRoom url={config.gltfUrl} /> : <ProceduralRoom />}
```

(When `useGltfRoom` is true, the `mounts`/`railPoints` in `src/data/layout.ts` are re-authored to the model’s rooms — see Step 5.)

- [ ] **Step 4: Run + observe (procedural still default)**

Run: `npm run dev`. Expected: unchanged (procedural room) because `useGltfRoom:false`. App still builds and runs with the GLB code path present.

- [ ] **Step 5: Document the asset-fit procedure** — append to `README.md` (created in Task 13) a "Swapping in the Sketchfab room" section:
  1. Download *VR Gallery House (baked)* (Elin) as glTF/GLB from Sketchfab; place at `public/models/gallery.glb`.
  2. Set `config.useGltfRoom = true`.
  3. Temporarily add drei `<TransformControls>` or log `camera.position` while flying to read wall coordinates; update `mounts[].position/rotationY/width` and `railPoints` in `src/data/layout.ts` to the model’s rooms (keep the layout tests passing — the turn assertion still holds).
  4. Tune `Bloom`/`Vignette`/exposure so the baked textures read in the AURUM palette.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: config-gated Sketchfab GLB room path (procedural remains default)"
```

---

### Task 13: Polish — glossy floor, README + attribution, mobile pass

**Files:**
- Modify: `src/scene/ProceduralRoom.tsx`, `src/scene/GalleryCanvas.tsx`
- Create: `README.md`

**Interfaces:**
- Consumes: drei `MeshReflectorMaterial`.

- [ ] **Step 1: Glossy floor (procedural room)** — in `src/scene/ProceduralRoom.tsx`, replace the floor `<meshStandardMaterial>` of the **corridor Box** with a subtle reflector:

```tsx
import { MeshReflectorMaterial } from '@react-three/drei';
// floor mesh material:
<MeshReflectorMaterial color={tokens.color.floor} roughness={0.85} metalness={0.2}
  blur={[300, 80]} mixBlur={1} mixStrength={6} resolution={512} mirror={0.35} />
```

Keep Room B floor as plain `meshStandardMaterial` (perf).

- [ ] **Step 2: Mobile/perf guard** — in `src/scene/GalleryCanvas.tsx`, lower bloom cost on small screens:

```tsx
const isSmall = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches;
// Bloom intensity={isSmall ? 0.5 : 0.7}; and dpr={[1, isSmall ? 1.5 : 2]}
```

- [ ] **Step 3: README with credits** — create `README.md`

```markdown
# AURUM — Immersive Gallery (v2)

Scroll-driven 3D gallery for the (fictional) AURUM gallery. Built with Vite + React + TypeScript + react-three-fiber. Scroll to walk a multi-room gallery; a side panel narrates the active work.

## Run
- `npm install`
- `npm run dev` (procedural room — runs with no external assets)
- `npm test`

## Swapping in the Sketchfab room
See `docs/superpowers/plans/2026-06-24-aurum-immersive-gallery.md`, Task 12 Step 5.

## Credits (required)
- Gallery model: **VR Gallery House (baked)** by **Elin (@ElinHohler)** on Sketchfab — CC BY 4.0.
- Artworks: **The Met Open Access** (CC0).
- A fictional gallery / design study. Sandbox only.
```

- [ ] **Step 4: Full test + observe**

Run: `npm test` → Expected: all tests PASS.
Run: `npm run dev`. Expected: corridor floor faintly reflects the lit paintings; gallery is usable on a narrow window (drag to scroll, readable panel); credits present in overlay + README.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: glossy floor, mobile/perf guard, README with required credits"
```

---

## Self-Review

**Spec coverage** (spec §→task):
- §3 stack/deps → T1. §4 structure → T1–T13 (files match). §5 data models → T2 (Artwork), T4 (MountPoint/RailPoint). §6 environment/turn/rail/reduced-motion → T4, T5, T7, T12. §7 paintings/labels/side panel → T6, T8, T9. §8 AURUM skin → T1 (tokens), T6 (dimmed art), T9 (overlay), T10 (bloom/grade). §9 a11y/fallback → T7 (reduced motion), T11 (no-WebGL, loader, keyboard, alt/labels). §10 attribution → T9 (overlay credits), T13 (README). §11 scope → respected (no WebXR/audio/free-roam). §13 milestones → T1–T13 map onto the 5 milestones (procedural-first; GLB at T12).
- Gap check: "descriptive alt" — drei `<Image>` lacks an `alt`; the in-world `WallLabel` + `aria-live` SidePanel supply the equivalent accessible text. Acceptable (canvas content is announced via the DOM panel); noted for reviewer.

**Placeholder scan:** No "TBD/TODO/handle edge cases" left. The two integration-time values (Fallback `href` to the 2D site; GLB coordinates) are explicitly flagged with how to fill them, not silent gaps.

**Type consistency:** `Artwork`/`MountPoint` field names (`id`, `title`, `artist`, `meta`, `src`, `blurb`; `artworkId`, `position`, `rotationY`, `width`) are used identically across T2, T4, T6, T8, T9. `offsetToIndex`, `buildRail`, `sampleRail`, `setOffset`, `useGalleryStore`, `config.useGltfRoom`/`gltfUrl` match across all consumers.
