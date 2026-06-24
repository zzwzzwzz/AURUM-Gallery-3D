import { create } from 'zustand';
import { artworks } from '../data/artworks';
import { offsetToIndex } from '../hooks/activeArtwork';

interface GalleryState {
  offset: number;
  activeIndex: number;
  setOffset: (offset: number) => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  offset: 0,
  activeIndex: 0,
  setOffset: (offset) => set({ offset, activeIndex: offsetToIndex(offset, artworks.length) }),
}));
