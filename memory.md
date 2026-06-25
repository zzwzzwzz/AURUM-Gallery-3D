# AURUM Immersive Gallery (v2) — project memory

Project-specific context and preferences. Read at session start; update as decisions land.

## Status
- 2026-06-24 — **v1 built end-to-end** via subagent-driven development (13 tasks, fresh implementer + spec/quality review each, final Opus whole-branch review). Green: `tsc --noEmit` clean, 13/13 Vitest tests, `vite build` OK. Procedural room is the default → runnable with no downloaded assets. Authored as the personal account; pushed to GitHub `zzwzzwzz/AURUM-Gallery-3D`.

## Decisions (settled — don't relitigate)
- **Stack: R3F + TS + Vite**, a new project (chosen over extending the zero-build 2D static site). **React pinned to 18** for r3f v8.
- **Scroll-on-rails + one turn** (corridor → Room B). NOT free-roam, NOT photoreal — council line carried from the 2D spike.
- **Procedural room** (charcoal box-rooms, generated in code) — runs with no external model asset. (An optional Sketchfab-GLB swap path existed early on but was never used and has been removed.)
- **Reuse AURUM tokens** + the **8 Met CC0 works** already curated in the 2D spike.
- **3dswart.vercel.app = vibe reference only** (don't copy its features).
- **WebXR skipped** for v1.

## Preferences observed (how Ziwen works on this project)
- Reference-first, constraints up front; wants to **eyeball the running app** and refine, not approve blind.
- Subagent-driven build with review between tasks (the review loop caught real R3F-API bugs — keep it).
- Token-efficient, skimmable updates. Opus for the build/taste calls.
- **Personal git identity only** (`ziwenzhou.zz@gmail.com`) — see global memory `feedback-git-identity-default`.

## Open / next
- **Eyeball mount coords** — Room B framing especially.
- **Before any deploy:** set the real 2D-AURUM URL in `Fallback.tsx` (currently `"../"` placeholder); senior review per ring-fence.
- Optional follow-ups (deferred): self-host the 8 images, multi-turn rooms, ambient audio + headphones prompt, glossy-floor tuning, WebXR.

## Gotchas
- Full technical gotchas (drei `<Image>` aspect, spotlight target, postprocessing `enableNormalPass`, texture-error fallback, tsc-not-vite-build) live in `CLAUDE.md` — read it.
- Met images are self-hosted under `public/art/` (no hotlinks); the per-painting error boundary still degrades a load failure gracefully — keep it.
