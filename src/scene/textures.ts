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
  const plankL = 128, plankW = 32, shades = ['#6B4A2E', '#7A5435', '#5E4026', '#724D30'];
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

/** Coffered ceiling — grid of recessed warm-wood panels with shaded bevels. */
export function makeCofferTexture(): THREE.Texture {
  const t = canvas(512);
  if (!t) return flat(tokens.color.ceil);
  const { c, ctx } = t;
  ctx.fillStyle = '#3C2A18'; // recess shadow
  ctx.fillRect(0, 0, 512, 512);
  const cell = 128, bevel = 16;
  for (let gy = 0; gy < 512; gy += cell) {
    for (let gx = 0; gx < 512; gx += cell) {
      // panel face
      ctx.fillStyle = tokens.color.ceil;
      ctx.fillRect(gx + bevel, gy + bevel, cell - 2 * bevel, cell - 2 * bevel);
      // highlight top/left, shadow bottom/right
      ctx.fillStyle = 'rgba(255,230,180,0.18)';
      ctx.fillRect(gx + bevel, gy + bevel, cell - 2 * bevel, 4);
      ctx.fillRect(gx + bevel, gy + bevel, 4, cell - 2 * bevel);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(gx + bevel, gy + cell - bevel - 4, cell - 2 * bevel, 4);
      ctx.fillRect(gx + cell - bevel - 4, gy + bevel, 4, cell - 2 * bevel);
    }
  }
  return finish(c, [5, 4]);
}

/** Paneled warm-white wall — large rectangular molding frames. */
export function makePanelTexture(): THREE.Texture {
  const t = canvas(512);
  if (!t) return flat(tokens.color.wall);
  const { c, ctx } = t;
  ctx.fillStyle = tokens.color.wall;
  ctx.fillRect(0, 0, 512, 512);
  const m = 48;
  ctx.strokeStyle = tokens.color.wallTrim;
  ctx.lineWidth = 6;
  ctx.strokeRect(m, m, 512 - 2 * m, 512 - 2 * m);
  ctx.lineWidth = 3;
  ctx.strokeRect(m + 22, m + 22, 512 - 2 * m - 44, 512 - 2 * m - 44);
  return finish(c, [3, 1]);
}
