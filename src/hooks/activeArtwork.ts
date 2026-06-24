/** Map a 0..1 scroll offset to a 0-based artwork index across `count` equal bands. */
export function offsetToIndex(offset: number, count: number): number {
  const clamped = Math.min(1, Math.max(0, offset));
  return Math.min(count - 1, Math.floor(clamped * count));
}
