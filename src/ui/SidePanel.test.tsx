import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SidePanel from './SidePanel';
import { useGalleryStore } from '../store/galleryStore';
import { artworks } from '../data/artworks';

describe('SidePanel', () => {
  beforeEach(() => useGalleryStore.setState({ offset: 0, activeIndex: 0 }));
  it('shows the active work title and blurb', () => {
    useGalleryStore.setState({ activeIndex: 2 });
    render(<SidePanel />);
    expect(screen.getByText(artworks[2].title)).toBeInTheDocument();
    expect(screen.getByText(artworks[2].blurb)).toBeInTheDocument();
  });
});
