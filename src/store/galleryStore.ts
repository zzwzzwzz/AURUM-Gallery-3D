import { create } from 'zustand';

interface GalleryState {
  offset: number;       // 0..1 scroll progress (snapped under reduced motion)
  focus: number;        // 0..1 how head-on the camera is to the active painting
  activeIndex: number;  // mount/artwork index currently framed (0..8)
  setView: (v: { offset: number; focus: number; index: number }) => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  offset: 0,
  focus: 0,
  activeIndex: 0,
  setView: ({ offset, focus, index }) => set({ offset, focus, activeIndex: index }),
}));
