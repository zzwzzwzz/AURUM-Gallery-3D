# AURUM — Immersive Gallery (v2)

A scroll-driven **3D** gallery for the (fictional) AURUM gallery. Built with
Vite + React + TypeScript + react-three-fiber. Scroll to glide along a fixed rail
through a multi-room gallery — rounding the corner *is* scrolling — while a side
panel narrates the active work.

> Sandbox / design study only. Fictional gallery, public-domain art.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest
npx tsc --noEmit   # the real typecheck (vite build uses esbuild, no typecheck)
```

No external assets or API keys required — the room is generated procedurally and
the artwork is self-hosted under `public/art/`.

## Project structure

```
src/
  data/      artworks (8 Met CC0 works) + layout (frame mounts + camera rail)
  scene/     R3F canvas: ProceduralRoom, Painting, CameraRig, lights, furniture
  ui/        DOM overlays — SidePanel, Overlay, IntroGate, OutroCard, Loader, Fallback
  store/     zustand store bridging the canvas to the DOM overlays
  theme/     locked AURUM design tokens
  hooks/ lib/ small helpers (reduced-motion, WebGL detection)
docs/        spec + plan archive (docs/superpowers/)
public/art/  self-hosted paintings
```

See [`DEPLOY.md`](./DEPLOY.md) for the Cloudflare Pages deploy.

## Credits

- Artworks: **The Met Open Access** (CC0).
- A fictional gallery / design study. Sandbox only.
