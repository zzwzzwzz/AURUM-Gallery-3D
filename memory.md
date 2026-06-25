# AURUM Immersive Gallery (v2) — project memory

Project-specific context and preferences. Read at session start; update as decisions land.

## Status
- 2026-06-24 — **v1 built end-to-end** via subagent-driven development (13 tasks, fresh implementer + spec/quality review each, final Opus whole-branch review). Green: `tsc --noEmit` clean, 13/13 Vitest tests, `vite build` OK. Procedural room is the default → runnable with no downloaded assets. 17 commits on `main`, authored as the personal account; no remote yet.

## Decisions (settled — don't relitigate)
- **Stack: R3F + TS + Vite**, a new project (chosen over extending the zero-build 2D static site). **React pinned to 18** for r3f v8.
- **Scroll-on-rails + one turn** (corridor → Room B). NOT free-roam, NOT photoreal — council line carried from the 2D spike.
- **Hybrid room:** procedural box-rooms are the default; **Sketchfab GLB** (Elin's *VR Gallery House (baked)*, CC-BY) swaps in via a config flag. Chosen over pure-procedural and over loading-a-model-as-is.
- **Reuse AURUM tokens** + the **8 Met CC0 works** already curated in the 2D spike.
- **3dswart.vercel.app = vibe reference only** (don't copy its features).
- **WebXR skipped** for v1.

## Preferences observed (how Ziwen works on this project)
- Reference-first, constraints up front; wants to **eyeball the running app** and refine, not approve blind.
- Subagent-driven build with review between tasks (the review loop caught real R3F-API bugs — keep it).
- Token-efficient, skimmable updates. Opus for the build/taste calls.
- **Personal git identity only** (`ziwenzhou.zz@gmail.com`) — see global memory `feedback-git-identity-default`.

## Open / next
- **Swap in the GLB:** download *VR Gallery House (baked)* from Sketchfab (free login) → `public/models/gallery.glb`, set `config.useGltfRoom = true`, re-author `mounts`/`railPoints` to the model's rooms (plan Task 12 §5).
- **Eyeball mount coords** — Room B framing especially.
- **Before any deploy:** set the real 2D-AURUM URL in `Fallback.tsx` (currently `"../"` placeholder); senior review per ring-fence.
- Optional follow-ups (deferred): self-host the 8 images, multi-turn rooms, ambient audio + headphones prompt, glossy-floor tuning, WebXR.

## Gotchas
- Full technical gotchas (drei `<Image>` aspect, spotlight target, postprocessing `enableNormalPass`, Met hotlink fallback, tsc-not-vite-build) live in `CLAUDE.md` — read it.
- The Met image hotlink is the main real-world fragility; the per-painting error boundary degrades a 404 gracefully — keep it.
