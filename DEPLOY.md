# Deploying AURUM — Immersive Gallery

This is a **static Vite + React SPA** (no server/backend). `npm run build` emits a plain
`dist/` folder of HTML/JS/CSS plus the self-hosted art under `dist/art/`. It deploys to
**Cloudflare Pages** as-is at the site root (so it suits a **subdomain**, e.g.
`gallery.ziwenzhou.com`, with no base-path changes).

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** 20+ (pinned via `.nvmrc` → `22`; Vite 8 / TS 6 need it)
- **No environment variables required.**

---

## Option 1 — Git-connected (auto-deploy on push) — recommended

1. **Push this repo to GitHub** — already linked to
   `https://github.com/zzwzzwzz/AURUM-Gallery-3D` (personal account `zzwzzwzz`):
   ```bash
   git push
   ```
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
3. Build settings:
   - Framework preset: **Vite** (or "None")
   - Build command: `npm run build`
   - Build output directory: `dist`
   - (`.nvmrc` sets Node 22 automatically; or add env var `NODE_VERSION=22`.)
4. **Save and Deploy.** You get a `https://<project>.pages.dev` URL, plus automatic
   preview deploys for every PR.

## Option 2 — Direct upload (no GitHub)

```bash
npm run build
npx wrangler pages deploy dist --project-name aurum-gallery
```

---

## Custom subdomain — `gallery.ziwenzhou.com`

Because `ziwenzhou.com` is already on Cloudflare, this is a couple of clicks:

1. Open the Pages project → **Custom domains → Set up a domain**.
2. Enter `gallery.ziwenzhou.com`. Cloudflare auto-creates the `CNAME` record and
   provisions the TLS certificate (a minute or two).
3. Link to it from your homepage — e.g. a card/button **"Enter the 3D Gallery →"**.

---

## Pre-flight checklist

- [x] Self-hosted art (`public/art/`, Met CC0) — no external hotlinks.
- [x] `Fallback.tsx` link points to the real site (`https://ziwenzhou.com`).
- [x] `.nvmrc` pins Node 22 so the Cloudflare build matches local.
- [ ] `npm run build` succeeds locally (CI parity).
- [x] `git push` to `zzwzzwzz/AURUM-Gallery-3D` — remote linked.

## Notes

- **Single page, no client router** → no SPA fallback / `_redirects` needed (only `/`).
- **Assets ≈ 5–6 MB** (9 paintings at 1800px + three.js bundle) — well within Pages' free tier;
  served from Cloudflare's CDN.
- **Procedural room** — the gallery is generated in code, so no external model asset is
  fetched and the build is fully self-contained.
- **Licensing for a public deploy:** art = The Met Open Access (CC0); fonts = Google
  Fonts (OFL). No production data. Safe to publish.
