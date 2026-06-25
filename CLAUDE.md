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
- **Procedural room:** the gallery is generated in code (`ProceduralRoom` — charcoal box-rooms), so it always runs with no external model asset. (An earlier Sketchfab-GLB swap path was removed as unused.)
- **Canvas→DOM bridge:** a zustand store (`src/store/galleryStore.ts`). `CameraRig` writes `offset` each frame; the DOM `SidePanel`/`Overlay` read `activeIndex`. Keep overlays as fixed DOM siblings of `<Canvas>` (`pointerEvents:none`), NOT inside the scene.
- **Data-driven:** `artworks.ts` (9 self-hosted Met CC0 works under `public/art/`), `layout.ts` (mounts + rail). Postprocessing = one `Bloom` (gold glow) + `Vignette` in `EffectComposer`, last canvas child, outside `<Suspense>`.

## Components
`ProceduralRoom` · `Painting` (drei `<Image>` + dark frame + `spotLight` + `TextureErrorBoundary`→`FramePlaceholder`) · `WallLabel` (`<Html>`) · `CameraRig` · `Overlay` · `SidePanel` · `Loader` · `Fallback`.

## Gotchas (learned — don't repeat)
- drei `<Image>` uses a shader-uniform `map`, **not** `material.map` — read aspect via `useTexture(src).image.naturalWidth/Height` so art isn't stretched.
- A raw `<spotLight>` only aims at its `.target` if the target is in the scene graph — add it via `<primitive object={target} />`.
- `@react-three/postprocessing` v2.19: use `enableNormalPass={false}` (the old `disableNormalPass` was removed).
- Met images are **self-hosted** under `public/art/` (no external hotlinks); the per-painting `TextureErrorBoundary` still degrades a load failure to an empty matte — don't remove it.
- `sampleRail` look-ahead must not collapse onto `pos` at the rail end (would NaN `lookAt`) — it's guarded.
- **Cloudflare deploy / `npm ci`:** vite@8 (rolldown) lists esbuild as a `peerOptional` (`^0.27||^0.28`) it never uses. `npm install` omits it from the lockfile but `npm ci` requires it, so Cloudflare's `npm clean-install` breaks (EBADPLATFORM, then EUSAGE). Fixed by pinning `"overrides": { "esbuild": "0.21.5" }` in `package.json` (the version vitest's vite@5 actually needs). Don't remove it. Regenerate/verify lockfiles with the Cloudflare toolchain (Node 22 / npm 10.9.2), not local Node 24 / npm 11 — they resolve this peer differently.

## Accessibility guardrails (every change)
`prefers-reduced-motion` (camera snaps) · no-WebGL/load-error → link to the 2D AURUM gallery (`Fallback.tsx` href is a **TODO placeholder** — set the real URL before any deploy) · keyboard-scrollable · `aria-live` side panel · visible `:focus-visible`.

## Ring-fence
Fictional gallery. Art = The Met Open Access (CC0), self-hosted. Room is procedural (no third-party model asset). No production data. **Nothing ships without senior review.**

## Git
Personal account `zzwzzwzz` / `ziwenzhou.zz@gmail.com` (local repo identity already set — **never** the company/interns account). Remote: `origin` → https://github.com/zzwzzwzz/AURUM-Gallery-3D.

## Pointers
- Spec + plan: `docs/superpowers/`. SDD build ledger: `.superpowers/sdd/progress.md` (gitignored).
- 2D sibling site + its locked design system: `~/aurum-gallery`.
