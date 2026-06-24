/**
 * webgl.ts — lightweight WebGL availability probe.
 * Returns true if the browser can create a WebGL context (webgl2 preferred, webgl fallback).
 * Called synchronously before mounting the Canvas so we can show the Fallback screen.
 */
export function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
