# AURUM — Immersive Gallery (v2): Design Spec

**Date:** 2026-06-24
**Status:** Draft for review
**Owner:** Ziwen
**Supersedes:** the `gallery3d.html` zero-build spike in `~/aurum-gallery` (kept as the accessible 2D-linked beta until this ships)

---

## 1. Goal

A scroll-driven 3D gallery website for the (fictional) AURUM gallery. The visitor scrolls; the camera glides forward through a gallery **with turns** (real room architecture, not one straight corridor), passing framed paintings on the walls while a **side intro panel** narrates the active work in AURUM's curatorial wall-label voice. Stylized, on-brand, accessible — not photoreal, not free-roam.

This is the evolution of the existing scroll-on-rails spike, rebuilt on a modern component stack with a real modeled room.

## 2. Locked decisions (resolved during brainstorming — do not relitigate)

| Decision | Choice | Why |
|---|---|---|
| Stack | **React + TypeScript + Vite**, react-three-fiber | User's stated stack; same stack as the 3dswart reference; clean component model |
| Movement | **Scroll-on-rails** (camera on a fixed curve) | Mobile-friendly, beginner-safe, no motion sickness; council decision carried from v1 |
| Room | **Procedural** charcoal box-rooms (with a turn) + our paintings/lighting/grade/rail | Always runs with no external asset; keeps AURUM on-brand |
| WebXR | **Out of scope** (v1) | User chose to skip; structure stays XR-addable later |
| Artwork | **Reuse AURUM's 8 Met Open Access (CC0) works** | Already curated, on-brand, zero licensing risk |
| 3dswart | **Reference only** (overall vibe) | User said reference, don't copy features |
| Visual look | **AURUM design system** (charcoal + gold-as-light, Cormorant + Space Mono) | Existing locked system |

## 3. Stack & dependencies

- **Build:** Vite + React 18 + TypeScript.
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei` (`ScrollControls`, `useScroll`, `Image`, `Environment`, `Html`, `useCursor`, `MeshReflectorMaterial`, `PerspectiveCamera`), `@react-three/postprocessing` (`Bloom`, `Vignette`, `ToneMapping`).
- **No** routing lib (single page), **no** state lib (local + a tiny zustand-or-context store only if the overlay↔scene sync needs it).
- New sibling project: **`~/aurum-gallery-3d/`** (the existing `~/aurum-gallery` static site stays zero-build and links to this; this links back to it as the accessible fallback).

## 4. Project structure

```
~/aurum-gallery-3d/
├── public/
│   └── art/                      # self-hosted Met CC0 images
├── src/
│   ├── main.tsx, App.tsx
│   ├── data/
│   │   ├── artworks.ts           # the 8 Met works (typed)
│   │   └── layout.ts             # camera rail control points + painting mount transforms
│   ├── scene/
│   │   ├── GalleryCanvas.tsx     # <Canvas> + ScrollControls + post-processing + Suspense
│   │   ├── ProceduralRoom.tsx    # charcoal box-rooms with one turn
│   │   ├── Painting.tsx          # <Image> plane + frame + per-painting SpotLight + WallLabel
│   │   ├── WallLabel.tsx         # in-world № + title + medium (Html, Space Mono)
│   │   └── CameraRig.tsx         # CatmullRomCurve3 + scroll→position/tangent, reduced-motion snap
│   ├── ui/
│   │   ├── Overlay.tsx           # fixed AURUM chrome: wordmark, beta tag, scroll hint, credits
│   │   ├── SidePanel.tsx         # active-work curatorial intro, cross-fades on scroll
│   │   └── Fallback.tsx          # no-WebGL / load-error → link to 2D AURUM
│   ├── theme/tokens.ts           # AURUM palette, type, filters (ported from style.css)
│   └── hooks/useActiveArtwork.ts # maps scroll offset → active painting index
└── docs/superpowers/specs/2026-06-24-aurum-immersive-gallery-design.md
```

## 5. Data models

```ts
// artworks.ts
export interface Artwork {
  id: number;          // 1..8, drives the № 0X catalog numeral
  title: string;
  artist: string;
  meta: string;        // e.g. "1889 · Oil on canvas"
  src: string;         // Met web-large CC0 image URL
  blurb: string;       // 1–2 sentence curatorial wall-label intro (present-tense, restrained)
}

// layout.ts
export interface MountPoint {
  artworkId: number;
  position: [number, number, number];   // world transform on a chosen wall
  rotationY: number;                     // facing into the room
  scale: number;                         // fit to the slot
}
export interface RailPoint { position: [number, number, number]; }  // CatmullRomCurve3 control pts
```

**The 8 works** (ported verbatim from the spike; `blurb` to be written in AURUM voice during implementation):
1. *Wheat Field with Cypresses* — Vincent van Gogh — 1889 · Oil on canvas — `DP-42549-001.jpg`
2. *The Great Wave off Kanagawa* — Katsushika Hokusai — c.1831 · Woodblock — `DP141042.jpg`
3. *Still Life with Apples* — Paul Cézanne — c.1890 · Oil on canvas — `DT47.jpg`
4. *The Monet Family in Their Garden* — Édouard Manet — 1874 · Oil on canvas — `DP-25465-001.jpg`
5. *L'Arlésienne: Madame Ginoux* — Vincent van Gogh — 1888 · Oil on canvas — `DT1396.jpg`
6. *The Card Players* — Paul Cézanne — 1890 · Oil on canvas — `DP231550.jpg`
7. *Portrait of a Man* — Rembrandt van Rijn — c.1660 · Oil on canvas — `DP145912.jpg`
8. *Six Jewel Rivers* — Utagawa Hiroshige — 1857 · Woodblock — `DP-13180-023.jpg`

(All `https://images.metmuseum.org/CRDImages/.../web-large/...`, Met Open Access CC0.)

## 6. Environment & camera (the room + the turn)

- **Room:** `ProceduralRoom.tsx` builds charcoal box-rooms (with one turn) from planes — the single room implementation, so the app always runs with no external asset. Postprocessing pulls the whole frame toward AURUM (see §8).
- **Mount points:** paintings are our own `<Image>` planes placed on the room's walls using authored `MountPoint` transforms. The rooms are arranged so the rail passes them in order and **turns through a doorway** between rooms.
- **Camera rig:** a `CatmullRomCurve3` through authored `RailPoint`s. `useScroll().offset` (0→1) = arc-length position along the curve; the camera looks along the smoothed curve tangent, so **rounding a corner is just continued scrolling**. Damped easing on look direction to avoid whip.
- **Reduced motion:** `prefers-reduced-motion` → camera *snaps* to discrete stops (one per painting) instead of gliding.

## 7. Paintings + side intro

- **Painting:** drei `<Image>` (crisp, unlit) with the AURUM dimmed-art filter (`saturate .92 / brightness .92` equivalent via material tint/tone), a thin dark frame, and a per-painting **`SpotLight`** (warm `#ffe6b0`, the pool of light that reads as "gallery"). Click → camera eases to a head-on stop facing it (`useCursor` for the pointer affordance).
- **In-world wall label:** small `Html` plate beside each work — `№ 0X`, title, artist, medium in Space Mono. Always present, like a real gallery.
- **Side panel (the "intro on the side"):** fixed AURUM overlay, left side. As scroll crosses each work's threshold (`useActiveArtwork`), it cross-fades to that work's `blurb` + title/artist in Cormorant/Space Mono. This is the narrated layer over the in-world labels.

## 8. AURUM skin (ported from `style.css`)

- **Palette:** bg `#0B0B0C`, wall `#18171a`, floor `#101012`, ceil `#0d0d0f`, warm white `#EDEAE3`, muted `#A39E92`, gold `#C9A24B`, bright gold `#E0B85A` (single accent), spot `#ffe6b0`, hairline `rgba(201,162,75,.18)`.
- **Gold = light, never paint:** spotlights, the bloom glow, hairline trim, links, and the *one* gold accent in the overlay. No gold panels.
- **Type:** Cormorant Garamond (headings, blurbs) + Space Mono (labels, numerals). `display=swap` + system fallbacks.
- **Motifs:** gold em-dash `— AURUM —` wordmark; catalog numerals `№ 01…`; dimmed-art filter on every work.
- **Post:** one `UnrealBloom` pass (gold glow does most of the "premium" work) + `Vignette` + a warm-dark `ToneMapping`/color grade. `setPixelRatio(min(dpr, 2))`.
- **Voice:** curatorial wall-label — short, present-tense, restrained. Never product/marketing copy.

## 9. Accessibility & fallback (non-negotiable, per AURUM)

- `prefers-reduced-motion` honored (snap, not glide).
- **No-WebGL / load error → `Fallback.tsx`**: an accessible screen that links to the **2D AURUM gallery as the equivalent experience** (the 2D site remains the front door).
- Keyboard: arrows / space / PageUp-Down drive the scroll rail; a visually-hidden focusable list of works as a non-3D path.
- One `<h1>`; descriptive `alt` on every artwork; visible `:focus-visible`; scroll-hint affordance on load; loading bar while Met images decode (`Suspense` + `useProgress`).

## 10. Attribution & ring-fence

- **Met (required):** "Artworks: The Met Open Access (CC0)" — shown in the overlay credits + an About/footer line + README.
- Fictional gallery; honesty fineprint ("design study / fictional gallery") carried from the 2D site. No production data. Nothing ships to a real surface without senior review.

## 11. Scope

**In (v1):** 8 works · one procedural multi-room layout with ≥1 turn · scroll-on-rails with tangent look · per-painting spotlights · in-world labels + side intro panel · bloom/grade · reduced-motion + no-WebGL fallback · CC0 art credit.

**Out (YAGNI, clean follow-ups):** WebXR / VR mode · free-roam (PointerLock) · spatial/ambient audio · multi-turn maze · screen-space reflections (one glossy floor at most) · the dark/white theme toggle from the spike · per-work deep-dive pages.

## 12. Risks / open items

- **Mount-point authoring:** placing 8 paintings precisely on the room's walls is iterative; we author transforms against the live scene (a temporary on-screen transform helper during dev).
- **Missing art image:** art is self-hosted under `public/art/`; if a file is missing, show a frame placeholder.

## 13. Milestones (each independently runnable)

1. **Scaffold + procedural room + rail** — Vite/R3F app, charcoal box-rooms with one turn, scroll glides the camera, 8 `<Image>` paintings on walls. *Runs end-to-end, on-brand, no external asset.*
2. **Side panel + wall labels + spotlights** — active-work sync, AURUM overlay chrome, per-painting light pools.
3. **Bloom + grade + a11y/fallback** — postprocessing, reduced-motion snap, no-WebGL screen, loading bar, credits.
4. **Polish** — easing feel (the 3dswart vibe), one glossy floor pass, mobile pass.
```
