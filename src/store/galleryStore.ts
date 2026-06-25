import { create } from 'zustand';
import { artworks } from '../data/artworks';
import { offsetToActiveIndex } from '../hooks/activeArtwork';

interface GalleryState {
  offset: number;
  activeIndex: number;
  setOffset: (offset: number) => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  offset: 0,
  activeIndex: 0,
  setOffset: (offset) => set({ offset, activeIndex: offsetToActiveIndex(offset, artworks.length) }),
}));
