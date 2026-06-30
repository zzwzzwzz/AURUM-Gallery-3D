import * as THREE from 'three';
import { tokens } from '../theme/tokens';

function canvas(size = 512): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  return ctx ? { c, ctx } : null;
}

function flat(color: string): THREE.Texture {
  const t = canvas(2);
  if (!t) return new THREE.Texture(); // SSR/test: harmless empty texture
  t.ctx.fillStyle = color;
  t.ctx.fillRect(0, 0, 2, 2);
  const tex = new THREE.CanvasTexture(t.c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function finish(c: HTMLCanvasElement, repeat: [number, number]): THREE.Texture {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Herringbone parquet — warm wood planks at alternating 90°. */
export function makeParquetTexture(): THREE.Texture {
  const t = canvas(512);
  if (!t) return flat(tokens.color.floor);
  const { c, ctx } = t;
  ctx.fillStyle = tokens.color.floor;
  ctx.fillRect(0, 0, 512, 512);
  const plankL = 128, plankW = 32, shades = ['#6E4F32', '#7A5A3A', '#634629', '#74532F'];
  let n = 0;
  for (let y = -plankL; y < 512 + plankL; y += plankW) {
    for (let x = -plankL; x < 512 + plankL; x += plankL) {
      const horiz = ((Math.floor(y / plankW) + Math.floor(x / plankL)) % 2) === 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = shades[n++ % shades.length];
      if (horiz) ctx.fillRect(0, 0, plankL - 2, plankW - 2);
      else ctx.fillRect(0, 0, plankW - 2, plankL - 2);
      ctx.restore();
    }
  }
  return finish(c, [6, 6]);
}

/** Smooth warm plaster ceiling with one large soft-bevel panel per tile — reads as
 *  long elegant recessed panels down the hall (replaces the old "waffle" coffer grid). */
export function makeCeilingTexture(): THREE.Texture {
  const t = canvas(512);
  if (!t) return flat(tokens.color.ceil);
  const { c, ctx } = t;
  // Warm plaster base.
  ctx.fillStyle = tokens.color.ceil;
  ctx.fillRect(0, 0, 512, 512);
  // One generous recessed panel, gently inset — soft, architectural, not a grid.
  const m = 40;
  ctx.fillStyle = '#E4D5B2'; // slightly brighter panel face
  ctx.fillRect(m, m, 512 - 2 * m, 512 - 2 * m);
  // Soft warm bevel: light top/left, shadow bottom/right.
  ctx.fillStyle = 'rgba(255,240,210,0.5)';
  ctx.fillRect(m, m, 512 - 2 * m, 6);
  ctx.fillRect(m, m, 6, 512 - 2 * m);
  ctx.fillStyle = 'rgba(120,95,60,0.22)';
  ctx.fillRect(m, 512 - m - 6, 512 - 2 * m, 6);
  ctx.fillRect(512 - m - 6, m, 6, 512 - 2 * m);
  // One thin warm molding line just inside the recess.
  ctx.strokeStyle = tokens.color.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(m + 16, m + 16, 512 - 2 * m - 32, 512 - 2 * m - 32);
  return finish(c, [1, 4]); // 1 across the width, 4 long panels down the hall
}

/** Paneled wall — large rectangular molding frames. Colors are passed in so the same
 *  paneling can be baked in either the light (warm-white) or dark (greige) mood. */
export function makePanelTexture(wall: string = tokens.color.wall, trim: string = tokens.color.wallTrim): THREE.Texture {
  const t = canvas(512);
  if (!t) return flat(wall);
  const { c, ctx } = t;
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, 512, 512);
  const m = 48;
  ctx.strokeStyle = trim;
  ctx.lineWidth = 6;
  ctx.strokeRect(m, m, 512 - 2 * m, 512 - 2 * m);
  ctx.lineWidth = 3;
  ctx.strokeRect(m + 22, m + 22, 512 - 2 * m - 44, 512 - 2 * m - 44);
  return finish(c, [3, 1]);
}
