# AURUM 3D — project memory

Accumulated decisions, state, and operational know-how specific to this repo.
Standing *rules* live in the root `CLAUDE.md`; this file holds *context* that
isn't obvious from the code or git history. Not indexed in global memory.

## Lighting direction (decided 2026-06-30)

The gallery's chosen mood is a **dark, spotlit museum** — dark matte greige-green
walls, dim cool ambient, each painting reading as a warm glowing focal island,
ceiling fixtures as concealed downlights (not bright bulbs). Reference-driven:
Ziwen supplied two real museum photos (deep-charcoal rooms, paintings as warm
pools) as the target. This replaced the earlier warm, well-lit "inviting oil-
painting" fill. Tuned values are in `GalleryCanvas.tsx`, `CeilingLights.tsx`,
`ProceduralRoom.tsx`, `Painting.tsx`, `tokens.ts`.
**Why it matters:** if asked to "brighten" or "warm up" the room later, check this
is intentional first — don't quietly regress to the old well-lit look.

## Verifying WebGL renders (operational — non-obvious)

The live **Claude-in-Chrome extension is unreliable** for this app: it dropped the
MCP tab group on every `computer` (scroll/screenshot) action, though `navigate`
worked. Don't burn attempts fighting it.

Reliable path = **headless Playwright + SwiftShader** (via the render-specialist
agent). Key gotchas that make it work:
- Launch Chromium with `--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader --ignore-gpu-blocklist` or WebGL is blank.
- Camera is driven by page scroll (drei `<ScrollControls>` mounts one scrollable
  `<div>`). To move down the corridor, find that div and set
  `scrollTop = fraction * (scrollHeight - clientHeight)`, then wait ~1.2s for the
  tween before screenshotting.
- Wait for `networkidle` **plus** ~3s extra — textures load from the Met (network)
  and Three.js needs time to compile shaders / render the first frame.
- A 2D-canvas luma sampler reads all-zero even on a good frame (R3F clears the
  backbuffer; `preserveDrawingBuffer` is false). Playwright's own screenshot is
  ground truth — don't trust a `drawImage` luma check.
- The offset-0 frame shows the frosted intro gate (a DOM overlay), not the room —
  the dark scene only appears after scrolling in. Expected, not a bug.

## Deferred: v2 rebuild (per feedback doc)

A larger "v2" is still pending and **not started**: rebuild camera choreography
(scroll = walk forward; click = bring painting head-on/flat), re-balance staging
hierarchy (single hanging center-line, hero end-wall, center bench), and the
bug/polish list (frame-9 scrollbar artifact, low-contrast captions). Two open
questions before touching scene code: (1) how to keep v2 separate from the current
working version (worktree on a `v2` branch vs new branch same folder vs build on
`main`); (2) the feedback's "roll left→right" glance — confirm yaw/turn vs actual
horizon roll. Awaiting Ziwen's steer.
