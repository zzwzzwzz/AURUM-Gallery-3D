import { create } from 'zustand';
import type { Mode } from '../theme/lighting';

const MODE_KEY = 'aurum-mode';

// Restore the visitor's last light/dark choice; default to the dark, spotlit mood.
function initialMode(): Mode {
  if (typeof localStorage === 'undefined') return 'dark';
  return localStorage.getItem(MODE_KEY) === 'light' ? 'light' : 'dark';
}

interface GalleryState {
  offset: number;       // 0..1 scroll progress (snapped under reduced motion)
  focus: number;        // 0..1 how head-on the camera is to the active painting
  activeIndex: number;  // mount/artwork index currently framed (0..8)
  focusedMount: number | null; // mount index pinned head-on by a click (null = walking)
  mode: Mode;           // 'light' | 'dark' lighting mood (persisted)
  setView: (v: { offset: number; focus: number; index: number }) => void;
  setFocusedMount: (i: number | null) => void;
  toggleMode: () => void;
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
}));
