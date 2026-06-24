import { Html } from '@react-three/drei';
import type { Artwork } from '../data/artworks';
import { tokens } from '../theme/tokens';

export default function WallLabel({ artwork, width }: { artwork: Artwork; width: number }) {
  return (
    <Html
      position={[width / 2 + 0.35, -0.1, 0]}
      transform
      occlude={false}
      distanceFactor={4}
      style={{ width: 150, pointerEvents: 'none', userSelect: 'none' }}
    >
      <div style={{ fontFamily: tokens.font.mono, color: tokens.color.warmWhite, lineHeight: 1.35 }}>
        <div style={{ color: tokens.color.gold, fontSize: 11, letterSpacing: '0.12em' }}>
          № {String(artwork.id).padStart(2, '0')}
        </div>
        <div style={{ fontFamily: tokens.font.serif, fontSize: 15, marginTop: 4 }}>{artwork.title}</div>
        <div style={{ fontSize: 10, color: tokens.color.muted, marginTop: 2 }}>{artwork.artist}</div>
        <div style={{ fontSize: 9, color: tokens.color.muted }}>{artwork.meta}</div>
      </div>
    </Html>
  );
}
