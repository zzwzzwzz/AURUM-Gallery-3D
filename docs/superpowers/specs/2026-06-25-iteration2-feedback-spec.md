# AURUM Hall — Iteration 2 (detailed build prompts)

**Date:** 2026-06-25
**Status:** Prompts drafted — awaiting Ziwen approval before build
**Builds on:** commit `1f769f2` (warm-classical hall v3)

Ziwen's 9 raw feedback notes, rewritten as precise, build-ready prompts. Resolved forks
(from intake): intro gate = **DOM frosted overlay**; brightness = **brighten the classical
room** (keep coffered ceiling, lighter + warmer, even indoor lights); hero 9th = **I curate →
Sargent *Madame X*** (Met CC0 #12127); seating = **low central benches** the camera glides over.

Two notes are diagnostic answers, folded into the relevant prompts:
- **#7 shimmer cause:** low-res `web-large` (~600px) textures + no mipmaps/anisotropy + Bloom
  over-amplifying. Fix = full-res `original/` images + mipmap/anisotropic filtering + bloom tune.
  No "3D paintings" needed (paintings are 2D — correct).
- **#5 wall mismatch cause:** both side walls already share one material; the difference is the
  single side-mounted directional light. Fixed by the symmetric rig in #4.

Suggested build order (dependencies): **8 → 3 → 9** (camera look model underpins label/detail
visibility and click-to-focus), then **2 → 7** (hero + full-res art), then **4 → 5 → 6 → 1**
(lighting, walls, furniture, gate). Each is independently testable.

---

## Prompt 1 — Intro gate (DOM frosted overlay)

**Intent:** On load, the site opens behind a simple, aesthetic, slightly-transparent "gate" that
blocks the gallery and shows the gallery name + a one-line intro, inviting the user to scroll.

**Build:**
- New `src/ui/IntroGate.tsx` — a `position:fixed` full-viewport DOM panel rendered as a sibling
  of `<Canvas>` (like `Overlay`), above it in z-order.
- Look: frosted glass — warm-white at ~70–85% opacity + `backdrop-filter: blur(12–20px)`.
  Centered: `AURUM` in Cormorant (large, letter-spaced), a single curatorial intro sentence
  beneath (muted), and a subtle `scroll to enter ↓` affordance (Space Mono, low opacity, gentle
  pulse).
- Behavior: drive opacity + blur from `useGalleryStore().offset`. At offset 0 the gate is fully
  opaque; from offset 0 → ~0.06 it fades opacity→0 and blur→0, then `pointer-events:none`. It
  reveals the live gallery already rendering behind it. (Scrolling back to top may restore it —
  optional, keep simple.)
- This **replaces** the in-scene far-wall title: delete/retire `TitleWall.tsx`; the AURUM name
  now lives only in the gate (and the existing top `Overlay` header).
- Accessibility: gate has a real `<h1>`; "scroll to enter" works with keyboard scroll;
  `prefers-reduced-motion` → instant/cross-fade rather than animated blur; never traps focus.

**Done when:** load shows the frosted AURUM gate over the gallery; first scroll fades it away
smoothly to reveal the hall; the far wall shows the hero painting (not the name).

---

## Prompt 2 — Add the 9th hero painting on the far wall

**Intent:** The far end wall (where the name used to be) holds a 9th, "most important/pretty"
painting — the visual climax of the hall.

**Build:**
- Curated hero: **John Singer Sargent — *Madame X*** (Met CC0, objectID 12127). Tall portrait
  (≈208×110 cm). Self-host its full-res `original` image to `public/art/09-madame-x.jpg`.
- `src/data/artworks.ts`: add `id: 9` with title/artist/meta and a curatorial blurb in the
  house voice.
- `src/data/layout.ts`: add a far-wall mount for id 9 — centered on the far wall (x≈0, z = far
  wall), facing **+Z** back toward the incoming camera, at a **grander width** than the others
  (hero scale). It is the camera's "forward" look target in Prompt 8.
- `GalleryCanvas` already maps `mounts → Painting`; the hero renders through the same path.

**Done when:** a grand Madame X hangs head-on on the far wall; it's what you see down the hall
from the start and the final head-on stop.

---

## Prompt 3 — Remove always-on wall labels; show details only on front view

**Intent:** The floating title on every painting is clutter. Details should appear only for the
painting currently being viewed head-on.

**Build:**
- Remove the in-scene `WallLabel` from `Painting.tsx` (stop rendering the per-painting `<Html>`
  title). Keep `WallLabel.tsx` file or delete if now unused.
- Details come solely from the DOM `SidePanel`, shown **only when a painting is in front view**.
  Add a `focusAmount` (0..1) to `galleryStore` written by `CameraRig` (from Prompt 8's focus
  weight). `SidePanel` renders its content only when `focusAmount` is high (e.g. > 0.5) and the
  active index is a real painting; it fades out between paintings and during the gate.

**Done when:** no labels float on the walls; settling head-on at a painting fades its
title/artist/blurb in; between paintings (and behind the gate) the panel is hidden.

---

## Prompt 4 — Lighting: brighten the classical room, lighter lit ceiling

**Intent:** Current room is dim/depressing. Make it bright, warm, airy with even **indoor**
ceiling lighting (not a single raking sun), keeping the classical coffered ceiling but lighter.

**Build:**
- `GalleryCanvas.tsx`: raise `ambientLight` and `hemisphereLight` intensities for an airy base.
- `ProceduralRoom.tsx`:
  - Lighten the **ceiling** tone (lighter warm-wood / off-white coffers) — update the coffer
    texture (`textures.ts`) and `tokens.color.ceil` to a lighter value.
  - Replace the single side `directionalLight` with an **even, symmetric** warm light rig — e.g.
    a row of soft warm ceiling fixtures down the hall (several `pointLight`/`rectAreaLight`, or
    emissive ceiling panels) casting balanced light on both walls and the floor.
  - Rebalance the per-painting spotlights so art is well-lit without blowing into bloom.
- `GalleryCanvas` Bloom: lower so it reads as a gentle gold glow, not a wash (ties to #7).

**Done when:** the hall is bright, warm, and even; ceiling reads light and intentionally lit; the
mood is inviting, not depressing.

---

## Prompt 5 — Right wall same color/brightness as left wall

**Intent:** The two long walls should look identical.

**Build:** Material is already shared; the fix is the **symmetric light rig from Prompt 4**.
Verify by screenshot that left and right walls render equal tone along the hall. (If any residual
gap remains, ensure both wall meshes use identical material instances and receive symmetric
light.)

**Done when:** left and right walls are visually indistinguishable in tone across the hall.

---

## Prompt 6 — Low central benches (seating)

**Intent:** The middle feels empty; add gallery seating without blocking the camera or views.

**Build:**
- New `src/scene/Furniture.tsx` — a low museum **bench** (~0.45 m high): a cushioned box top +
  simple legs/base, warm neutral leather/wood material. Low-poly, procedural.
- Place one or two benches on/near the **centerline between painting zones** (NOT at a painting
  station's z), at floor level. The camera at eye height (1.6 m) glides over them → foreground
  life, never blocking a head-on painting view or the scroll path.
- Optional: a soft runner rug plane beneath for warmth (matches the reference). Keep subtle.
- Mount in `GalleryCanvas` as a sibling of the room.

**Done when:** benches read as seating in the middle of the hall; the camera passes over them;
no head-on painting view is blocked and scroll pacing is unchanged.

---

## Prompt 7 — Fix painting shimmer ("2D pixel / wrong-signal" sparkle)

**Intent:** Paintings sparkle/crawl like signal noise. Make them crisp and stable. (No 3D
versions needed — this is a texture-filtering + resolution + bloom issue.)

**Build:**
- **Resolution:** re-fetch every painting from the Met **`original/`** path (full-res) instead of
  `web-large/` (~600px). The only change is `web-large` → `original` in the image URL; confirmed
  available for all works (e.g. `/ep/original/DP-42549-001.jpg`). Re-download into `public/art/`.
- **Filtering (the main fix):** on each painting texture set
  `minFilter = THREE.LinearMipmapLinearFilter`, `generateMipmaps = true`,
  `anisotropy = renderer.capabilities.getMaxAnisotropy()` (cap ~8–16), `colorSpace = SRGB`. This
  removes the crawling/sparkle as the camera moves. (drei `<Image>` shares the `useTexture`
  cache — apply via a texture `onUpdate`/effect, or load the texture and pass it in.)
- **Bloom:** raise `luminanceThreshold` (~0.55 → ~0.8) and/or lower intensity so bright paint
  areas stop blooming into the "signal" glow; bloom should mainly catch the gold accents.
- Sanity-check `toneMapped`/tint on `<Image>`: keep the dimmed-art tint but ensure it isn't
  over-bright; adjust if the art looks washed.

**Done when:** paintings are sharp and stable while the camera moves; no sparkle; close framing
holds visible brushwork detail.

---

## Prompt 8 — Camera choreography: forward-default, yaw to each painting, return to forward

**Intent (the key motion fix):** While moving ahead the camera should **always face forward down
the hall toward the 9th (hero) wall**, exactly like at the start. As it reaches each painting it
**yaws to face that painting head-on** (left for №1, right for №2, left for №3, right for №4, …),
then **returns to forward** before the next. The current behavior eases directly painting→painting
(swinging diagonally across the room) — that's the "wrong angle." Replace it.

**Build:**
- `src/data/layout.ts` — replace `sampleLook` with a **forward-default + per-station focus**
  model:
  - `forwardTarget` = the hero/far-wall center (down the hall).
  - For the current offset, find the nearest painting station and a `focusWeight ∈ [0,1]` that
    **peaks (=1) at the station** (camera head-on to that painting) and **falls to 0 between
    stations** (camera looks at `forwardTarget`). A smooth bump (e.g. raised cosine) per station.
  - `look = forwardTarget.lerp(paintingCenter_k, focusWeight)`.
  - Export `focusAmount(offset)` (the peak weight) for `SidePanel` visibility (Prompt 3).
- Position rail: keep the forward dolly; spacing so the left/right alternation matches the mounts
  (№1 left, №2 right, №3 left, …) and the camera "slightly moves forward" between glances.
- `CameraRig.tsx`: use the new look; write `focusAmount` to `galleryStore`.
- Reduced motion: snap to each painting station (head-on) and to the forward/hero view.

**Done when:** walking forward you face the hero wall; you glance left at №1, return forward,
glance right at №2, forward, left at №3, right at №4 …; each glance is square-on; the finale is the
hero wall head-on. No diagonal cross-room swings.

---

## Prompt 9 — Click any painting → it comes to front + details show

**Intent:** From anywhere, clicking a painting brings it to head-on front view and shows its
details.

**Build:**
- Update `Painting.tsx` `focusThis`: map the clicked artwork's id → that painting's **station
  offset** in the new model (Prompt 8) and smooth-scroll the ScrollControls element there, so the
  camera glides to frame it head-on (`focusAmount → 1`), which also reveals its `SidePanel`
  details (Prompt 3). Ensure the hero (№9) is clickable too.
- Keep the hover cursor affordance.

**Done when:** from any scroll position, clicking any painting glides it to a head-on front view
and shows its details.

---

## Global constraints (unchanged)

React 18 / r3f@8 pinned; `npx tsc --noEmit` is the real typecheck; gold = light only; procedural
room must always run with no required external asset (full-res art + fonts are self-hosted under
`public/`); ring-fence: fictional gallery, Met CC0 art, OFL fonts, no production data; nothing
ships without Ziwen's senior-review sign-off.
