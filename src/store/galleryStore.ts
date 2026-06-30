import { create } from 'zustand';
import type { Mode } from '../theme/lighting';

const MODE_KEY = 'aurum-mode';

// The OS light/dark preference (falls back to dark where matchMedia is unavailable).
export function systemMode(): Mode {
  if (typeof matchMedia === 'undefined') return 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Has the visitor made an explicit choice via the toggle? If so it sticks and we stop
// following the OS; otherwise we track `prefers-color-scheme` live.
export function hasExplicitMode(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const v = localStorage.getItem(MODE_KEY);
  return v === 'light' || v === 'dark';
}

// Honor an explicit saved choice; otherwise follow the OS setting.
function initialMode(): Mode {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return systemMode();
}

interface GalleryState {
  offset: number;       // 0..1 scroll progress (snapped under reduced motion)
  focus: number;        // 0..1 how head-on the camera is to the active painting
  activeIndex: number;  // mount/artwork index currently framed (0..8)
  focusedMount: number | null; // mount index pinned head-on by a click (null = walking)
  mode: Mode;           // 'light' | 'dark' lighting mood
  setView: (v: { offset: number; focus: number; index: number }) => void;
  setFocusedMount: (i: number | null) => void;
  toggleMode: () => void;       // explicit visitor choice — persists + stops following the OS
  followSystemMode: (m: Mode) => void; // OS scheme changed — track it (does NOT persist)
}

export const useGalleryStore = create<GalleryState>((set) => ({
  offset: 0,
  focus: 0,
  activeIndex: 0,
  focusedMount: null,
  mode: initialMode(),
  setView: ({ offset, focus, index }) => set({ offset, focus, activeIndex: index }),
  setFocusedMount: (i) => set({ focusedMount: i }),
  toggleMode: () =>
    set((s) => {
      const mode: Mode = s.mode === 'dark' ? 'light' : 'dark';
      if (typeof localStorage !== 'undefined') localStorage.setItem(MODE_KEY, mode);
      return { mode };
    }),
  followSystemMode: (mode) => set({ mode }),
}));
