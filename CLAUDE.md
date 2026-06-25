# AURUM — Immersive Gallery (v2) — project instructions

A scroll-driven **3D** gallery for the (fictional) AURUM gallery. The immersive evolution of the `gallery3d.html` spike in the 2D sibling site (`~/aurum-gallery`). Sandbox only — fictional gallery, public-domain (CC0) art, CC-BY room model.

## What this is
- Vite + React + TypeScript + **react-three-fiber**. Scroll → the camera glides along a fixed rail through a gallery **with a turn**, past framed paintings; a side panel narrates the active work.
- Read it at session start; the full spec + plan live in `docs/superpowers/`.

## Stack & commands
- **React MUST stay 18** (`react@^18.3`) — `@react-three/fiber@^8` requires it; React 19 needs r3f v9 and will break. Build toolchain tracks the current Vite react-ts template (Vite 8 / TS 6) — fine, build-time only.
- Deps: `@react-three/fiber@8`, `@react-three/drei@9`, `@react-three/postprocessing@2`, `three@0.169`, `zustand`. Tests: Vitest + @testing-library/react.
- `npm run dev` (runs on the **procedural room** — no external assets needed) · `npm test` · **`npx tsc --noEmit`** is the real typecheck (`vite build` uses esbuild and does NOT typecheck).

## Locked design system (reuse — do not relitigate)
- Reuses AURUM tokens in `src/theme/tokens.ts`: bg `#0B0B0C`, warm white `#EDEAE3`, gold `#C9A24B`, bright gold `#E0B85A` (one accent only), spot `#ffe6b0`, walls/floor charcoal.
- **Gold = light, never paint** — glow/hairline/one accent only; never gold fills or panels.
- Cormorant Garamond (serif) + Space Mono (labels/numerals). Curatorial wall-label voice. `№` catalog numerals; dimmed-art tint on works.

## Architecture (settled)
- **Scroll-on-rails:** `useScroll().offset` → a `CatmullRomCurve3` in `src/data/layout.ts`; the camera follows the point and looks down the tangent, so rounding the corner *is* scrolling. NOT free-roam (deliberate — mobile/a11y). `prefers-reduced-motion` snaps between stops.
- **Hybrid room:** procedural charcoal box-rooms (`ProceduralRoom`) is the **default** so it always runs; Elin's Sketchfab GLB swaps in via `config.useGltfRoom` in `src/config.ts` — drop `gallery.glb` in `public/models/`, flip the flag, re-author `mounts`/`railPoints` to the model. Do NOT `useGLTF.preload` the GLB at module scope (fetches a missing file).
- **Canvas→DOM bridge:** a zustand store (`src/store/galleryStore.ts`). `CameraRig` writes `offset` each frame; the DOM `SidePanel`/`Overlay` read `activeIndex`. Keep overlays as fixed DOM siblings of `<Canvas>` (`pointerEvents:none`), NOT inside the scene.
- **Data-driven:** `artworks.ts` (8 Met CC0 works), `layout.ts` (mounts + rail). Postprocessing = one `Bloom` (gold glow) + `Vignette` in `EffectComposer`, last canvas child, outside `<Suspense>`.

## Components
`ProceduralRoom` / `GltfRoom` · `Painting` (drei `<Image>` + dark frame + `spotLight` + `TextureErrorBoundary`→`FramePlaceholder`) · `WallLabel` (`<Html>`) · `CameraRig` · `Overlay` · `SidePanel` · `Loader` · `Fallback`.

## Gotchas (learned — don't repeat)
- drei `<Image>` uses a shader-uniform `map`, **not** `material.map` — read aspect via `useTexture(src).image.naturalWidth/Height` so art isn't stretched.
- A raw `<spotLight>` only aims at its `.target` if the target is in the scene graph — add it via `<primitive object={target} />`.
- `@react-three/postprocessing` v2.19: use `enableNormalPass={false}` (the old `disableNormalPass` was removed).
- Met images are **hotlinked**; the per-painting `TextureErrorBoundary` degrades a 404 to an empty matte — don't remove it. Self-hosting the 8 images in `public/` would remove the hotlink fragility entirely.
- `sampleRail` look-ahead must not collapse onto `pos` at the rail end (would NaN `lookAt`) — it's guarded.

## Accessibility guardrails (every change)
`prefers-reduced-motion` (camera snaps) · no-WebGL/load-error → link to the 2D AURUM gallery (`Fallback.tsx` href is a **TODO placeholder** — set the real URL before any deploy) · keyboard-scrollable · `aria-live` side panel · visible `:focus-visible`.

## Ring-fence
Fictional gallery. Art = The Met Open Access (CC0). Room model = *VR Gallery House (baked)* by **Elin (@ElinHohler)**, **CC BY 4.0** — credit shown in the overlay + README. No production data. **Nothing ships without senior review.**

## Git
Personal account `zzwzzwzz` / `ziwenzhou.zz@gmail.com` (local repo identity already set — **never** the company/interns account). No remote yet.

## Pointers
- Spec + plan: `docs/superpowers/`. SDD build ledger: `.superpowers/sdd/progress.md` (gitignored).
- 2D sibling site + its locked design system: `~/aurum-gallery`.
