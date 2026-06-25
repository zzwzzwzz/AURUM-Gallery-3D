/**
 * Map a 0..1 scroll offset to the active painting index (0-based).
 *
 * The rail has N+1 stations: station 0 is the title wall (offset 0, no painting)
 * and stations 1..N are the N paintings. So the active painting index is the
 * nearest station minus one, clamped to [0, N-1]. At offset 0 (title view) the
 * panel shows the first work as a lead-in.
 */
export function offsetToActiveIndex(offset: number, paintingCount: number): number {
  const stations = paintingCount + 1;            // title + paintings
  const clamped = Math.min(1, Math.max(0, offset));
  const station = Math.round(clamped * (stations - 1)); // 0..paintingCount
  return Math.min(paintingCount - 1, Math.max(0, station - 1));
}
