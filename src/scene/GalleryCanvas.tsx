import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { tokens } from '../theme/tokens';
import ProceduralRoom from './ProceduralRoom';
import Painting from './Painting';
import { mounts } from '../data/layout';
import { artworks } from '../data/artworks';

export default function GalleryCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.6, 10], fov: 55, near: 0.1, far: 100 }}
      gl={{ antialias: true }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <color attach="background" args={[tokens.color.bg]} />
      <hemisphereLight args={[0xffffff, 0x222222, 0.45]} />
      <ambientLight intensity={0.5} />
      <Suspense fallback={null}>
        <ProceduralRoom />
        {mounts.map((m) => {
          const art = artworks.find((a) => a.id === m.artworkId)!;
          return <Painting key={m.artworkId} mount={m} artwork={art} />;
        })}
      </Suspense>
    </Canvas>
  );
}
