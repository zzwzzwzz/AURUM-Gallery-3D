# AURUM — Warm-Classical Hall Redesign (v3)

**Date:** 2026-06-25
**Status:** Approved (design), pending implementation plan
**Supersedes spatial/room portions of:** `2026-06-24-aurum-immersive-gallery-design.md`

## Summary

Reshape the immersive gallery from a **dark charcoal corridor with a right-turn**, where
paintings hang on side walls and are seen at an angle, into a **single warm-classical hall**
where the visitor walks straight forward and the camera turns to face **one painting head-on,
full, at a time**. The experience opens on a **title end-wall** bearing the gallery name.
Artwork images are **self-hosted** under `public/art/`.

This is driven by four pieces of user feedback, refined through brainstorming:

1. Self-host specific paintings on the walls (download into `public/art/`).
2. Open on a white/title wall with the gallery name; first scroll = natural walk forward; the
   first painting "slides in" as a **front (head-on) view, not a side angle**.
3. Add a **natural floor and ceiling**; walls read **white** (warm-white).
4. **One painting in full view at a time.**

## Decisions (locked via brainstorming)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Interior mood | **Warm-white walls, kept dim/moody** — preserves the AURUM gold-glow atmosphere (spotlights + bloom), not a bright daylight white-cube. |
| 2 | Spatial / navigation | **Forward, alternating** — walk straight down one hall; camera yaws to face each painting (alternating L/R walls) head-on, then straightens to the next. |
| 3 | Artwork set | **Keep the current 8 Met CC0 works**, self-hosted into `public/art/`. |
| 4 | Title wall | **In-scene 3D text** — `AURUM` rendered on the entrance end-wall (Cormorant serif + subtle gold glow). |
| 5 | Room style | **Warm classical, procedural** — Image-1 reference: coffered ceiling, herringbone parquet floor, paneled warm-white walls, warm "window" light. Built procedurally (geometry + textures). |

Reference: the warm classical hall (coffered wood ceiling, parquet floor, paneled walls, raking
sunlight) — explicitly chosen over the modern white-cube-with-freestanding-partitions look,
because the single-hall layout fits the "walk forward, face each painting" mechanic and the
warmth fits the AURUM brand.

## Non-goals / out of scope

- **Room B and the right-turn are removed.** The layout becomes a single straight hall.
- **No new artworks or copy.** Titles, metadata, and curatorial blurbs are unchanged.
- **No free-roam.** Still scroll-on-rails (mobile/a11y), per the existing architecture.
- No daylight/bright white-cube; the room stays dim and spotlit.

## Architecture

The existing architecture is preserved: scroll-on-rails, a `CatmullRomCurve3` driving the
camera, a zustand store bridging canvas → DOM, data-driven mounts/artworks, and a single
`EffectComposer` (Bloom + Vignette) as the last canvas child. The changes are localized:

### 1. Layout & stations — `src/data/layout.ts`

- **Single straight hall.** Replace the corridor + Room-B mounts and the turning `railPoints`
  with one straight hall down −Z. Paintings alternate L/R at `x = ±WALL_X`, evenly spaced in z,
  all facing into the hall (`rotationY = ±π/2`), works 1–8 in order.
- **Title anchor.** Add a constant for the entrance **title end-wall** (its world position and
  the camera's opening look-target).
- **Position rail.** `railPoints` becomes a straight (slightly smoothed) line down the hall
  center (`x ≈ 0`), from just inside the entrance to just past the last painting.
- **Station anchors.** Add an exported ordered list of **look anchors**: `[titleWall, P1, P2, …,
  P8]`, where each painting anchor is that painting's wall-center world point. Length =
  `artworks.length + 1`.
- **`sampleLook(offset)`** — new pure function. Maps `offset ∈ [0,1]` across the anchor list and
  returns an interpolated look-target `THREE.Vector3`, using a smoothstep so the camera **settles
  facing each anchor**, then swings to the next ("slides in"). At `offset = 0` it returns the
  title-wall anchor exactly. Must never return a point equal to the camera position (no NaN
  `lookAt`) — anchors are on the walls, the rail is on the centerline, so they never coincide;
  this is asserted by a test.
- `sampleRail` / `buildRail` are retained for **position**; the look is now sourced from
  `sampleLook`, decoupling look-direction from the rail tangent.

### 2. Camera rig — `src/scene/CameraRig.tsx`

- **Position** continues to follow `sampleRail(curve, t)` (forward dolly).
- **Look-target** now comes from `sampleLook(t)` instead of the rail's look-ahead tangent.
- Initialize `lookTarget.current` to `sampleLook(0)` (the title wall) to avoid a first-frame
  swing.
- **Reduced motion:** snap `t` to the nearest station — `Math.round(raw * (N-1)) / (N-1)` where
  `N = anchors.length` (title + 8 = 9 stops). Each stop is a head-on view (the title wall, then
  each painting). `damp = 1` for instant snap, as today.
- The store still receives `setOffset(raw)`; `activeArtwork` mapping is reviewed so the side
  panel's active index aligns with the **painting** stations (offset 0 = title, no active
  painting yet / index 0 — see §6).

### 3. Procedural room — `src/scene/ProceduralRoom.tsx`

Rebuild as a single warm-classical hall (one box long enough for 8 spaced paintings):

- **Floor:** herringbone **parquet** — warm wood color, a parquet texture map (see §5), light
  roughness, retain a **subtle** `MeshReflectorMaterial` reflection for richness (lower mirror
  than the current glossy floor so it reads as waxed wood, not a mirror).
- **Ceiling:** **coffered** — a repeating recessed-panel look via a coffer texture map on the
  ceiling plane (optionally with shallow molding geometry / a normal map). Warm wood tone.
- **Walls:** warm-white **paneled** — a paneling (rectangular molding) texture, warm-white tint,
  kept **dim** (lit by spotlights + raking light, not flooded).
- **Lighting:** a warm **directional light** raking across the floor (the sunlight-pool look) +
  a **low ambient** so walls stay moody + the existing **per-painting warm spotlights**
  (`Painting.tsx`, unchanged). Bloom + Vignette unchanged.
- Room dimensions and wall extents are derived to comfortably contain the new mounts with
  margin; the hall is a single box (no Room B).

### 4. Title wall — `src/scene/` (new small component) + `ProceduralRoom`

- Render `AURUM` as drei **`<Text>`** on the entrance end-wall, in Cormorant serif, warm-white
  with a subtle **gold emissive glow** (consistent with "gold = light, never paint"), plus a
  small "immersive" / catalog-style subline. Positioned and rotated to sit flat on the end wall,
  facing the camera's opening position.
- This is the first thing the visitor sees; scrolling walks them forward past it into the hall.
- The DOM `Overlay` header (`AURUM` top bar) remains as well; the two are consistent.

### 5. Textures — `public/textures/`

- Source a small set of **CC0 seamless texture maps** (parquet/wood floor, coffer wood, wall
  plaster/paneling) into `public/textures/`, loaded via drei `useTexture` with appropriate
  `repeat`/`wrap` tiling.
- **Fallback:** if a clean CC0 source isn't available for a given map, generate a runtime
  `CanvasTexture` (drawn pattern) so the room **always runs** with no external dependency — in
  keeping with the "procedural room is the default that always runs" architecture rule.
- Texture loading must not break the canvas `<Suspense>`/loader; a missing texture degrades to a
  flat warm color (same resilience principle as the painting `TextureErrorBoundary`).

### 6. Artwork — `public/art/` + `src/data/artworks.ts`

- **Download** the existing 8 Met CC0 images into `public/art/NN-slug.jpg` (e.g.
  `01-wheat-field-with-cypresses.jpg`).
- Change each `artworks[].src` from the `images.metmuseum.org` URL to its local
  `/art/NN-slug.jpg` path.
- Titles, artists, metadata, and blurbs are **unchanged**.
- `Painting.tsx`'s `TextureErrorBoundary → FramePlaceholder` stays as a safety net (no longer
  fires now that art is self-hosted, but remains correct if a file is missing).
- README/Overlay credit (Met CC0 for art) stays accurate.

### 7. Tokens — `src/theme/tokens.ts`

- Add warm-classical palette tokens: warm-white wall, warm parquet/wood floor, warm coffer
  ceiling. Keep `bg: #0B0B0C` (page/fallback behind canvas), `warmWhite`, `gold`, `goldBright`,
  `spot`, `hairline` as-is.
- The old dark `wall`/`floor`/`ceil` charcoals are repurposed to the new warm values (or new
  keys added and the room updated to use them) — chosen so no other consumer is silently broken.
  Token tests updated to match.

## Data flow

```
scroll.offset (0..1)
  │
  ├─ CameraRig (useFrame)
  │    ├─ position ← sampleRail(curve, t)        // forward dolly down hall center
  │    └─ lookTarget ← sampleLook(t)             // eases title → P1 → … → P8 (head-on)
  │    └─ setOffset(raw) → zustand store
  │
  └─ store.offset → activeArtwork → SidePanel / Overlay (DOM, aria-live)
```

`t = reduced ? snapToStation(raw) : raw`, with `N = anchors.length` (9 stops: title + 8 works).

## Error handling & resilience

- **`sampleLook` never NaNs `lookAt`:** anchors lie on the walls, the rail on the centerline;
  they cannot coincide. Asserted by a unit test (look-target ≠ camera position across the full
  offset range).
- **Missing texture map:** degrades to a flat warm color (no crash, no hung Suspense).
- **Missing/broken art image:** existing `TextureErrorBoundary → FramePlaceholder` (matte) per
  painting.
- **No WebGL / load error:** existing `Fallback.tsx` (link to the 2D AURUM gallery — href is
  still a TODO placeholder; unchanged by this work).

## Accessibility guardrails (unchanged, must keep passing)

- `prefers-reduced-motion` → camera **snaps** between stations (now title + 8 painting stops).
- Keyboard-scrollable; visible `:focus-visible`.
- `aria-live` side panel announces the active work.
- No-WebGL/load-error → `Fallback` link to the 2D gallery.

## Testing

- **`layout.test.ts`:**
  - Mounts: 8 entries, alternating L/R `x` signs, monotonic z spacing, all facing into the hall.
  - `railPoints`: straight-ish, monotonic down −Z, length sane.
  - Anchors: length = `artworks.length + 1`; first = title wall.
  - `sampleLook(0)` = title anchor; `sampleLook(1)` ≈ last painting anchor; intermediate values
    interpolate monotonically through anchors; **look-target is never equal to the camera rail
    position** at the same `offset` (no-NaN guard).
- **`tokens.test.ts`:** updated to the warm palette values.
- **`artworks.test.ts`:** `src` values are now local `/art/...` paths (not `http`).
- **`activeArtwork.test.ts`:** offset → active index mapping aligns with the new station model
  (offset 0 = title / index 0; later bands map to works).
- **Typecheck:** `npx tsc --noEmit` clean (the real typecheck — `vite build` uses esbuild).
- **Manual:** `npm run dev` — opening view faces the AURUM title wall; scroll walks forward and
  the camera turns to face each painting head-on, one full at a time; floor/ceiling/walls read as
  warm classical; reduced-motion snaps cleanly.

## Files touched

| File | Change |
|------|--------|
| `src/data/layout.ts` | Single straight hall mounts + rail; title anchor; station anchors; `sampleLook`. |
| `src/data/layout.test.ts` | Tests for the above. |
| `src/scene/CameraRig.tsx` | Look-target from `sampleLook`; station snap for reduced motion. |
| `src/scene/ProceduralRoom.tsx` | Warm-classical hall: parquet floor, coffered ceiling, paneled warm-white walls, warm directional light. |
| `src/scene/TitleWall.tsx` (new) | In-scene `AURUM` 3D text on the entrance wall. |
| `src/theme/tokens.ts` + `tokens.test.ts` | Warm-classical palette tokens. |
| `src/data/artworks.ts` + `artworks.test.ts` | Local `/art/...` src paths. |
| `src/hooks/activeArtwork.ts` + test | Align active-index mapping with the station model (if needed). |
| `public/art/NN-slug.jpg` (new) | 8 self-hosted Met CC0 images. |
| `public/textures/*` (new) | CC0 seamless maps (parquet/coffer/wall) with canvas fallback. |
| `CLAUDE.md` / `README` | Note the single-hall warm-classical procedural room; self-hosted art. |

## Risks / open considerations

- **Procedural classical fidelity.** Coffered ceiling + parquet via textures are stylized, not
  photoreal. Mitigation: good seamless CC0 maps + dim, spotlit framing hides flatness.
- **Head-on framing tuning.** Camera distance (centerline → wall ≈ `WALL_X`) vs painting width
  and FOV must be tuned so each work fills the view without clipping. Spacing and `WALL_X` are
  the knobs.
- **Texture sourcing.** If clean CC0 maps are hard to obtain in-session, the canvas fallback
  ships first and real maps drop in later without code changes.
