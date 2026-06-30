import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { ScrollControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { tokens } from '../theme/tokens';
import ProceduralRoom from './ProceduralRoom';
import CeilingLights from './CeilingLights';
import Furniture from './Furniture';
import Painting from './Painting';
import CameraRig from './CameraRig';
import { mounts } from '../data/layout';
import { artworks } from '../data/artworks';

export default function GalleryCanvas() {
  // Detect small/mobile screens at mount time to lower GPU cost.
  // matchMedia guard keeps this safe in SSR / test environments where window is absent.
  const isSmall = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches;

  return (
    <Canvas
      dpr={[1, isSmall ? 1.5 : 2]}
      camera={{ position: [0, 1.6, 10], fov: 55, near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMappingExposure: 1.0 }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <color attach="background" args={[tokens.color.bg]} />
      {/* Moody, dim gallery fill: a low, COOL hemisphere + faint ambient so the room falls
          into shadow and the per-painting spotlights become the clear focal pools. Cool sky /
          near-black warm ground keeps shadows neutral while the spots stay warm. */}
      <hemisphereLight args={[0x9aa3ad, 0x141210, 0.3]} />
      <ambientLight intensity={0.16} />
      <Suspense fallback={null}>
        {/* ScrollControls creates the scroll DOM overlay; CameraRig reads it via useScroll().
            Room, furniture and paintings are plain children (NOT wrapped in <Scroll>) so they
            remain world-static — only the camera moves, driven by CameraRig's useFrame. */}
        <ScrollControls pages={4} damping={0.25}>
          <CameraRig />
          <ProceduralRoom />
          <CeilingLights />
          <Furniture />
          {mounts.map((m) => {
            const art = artworks.find((a) => a.id === m.artworkId)!;
            return <Painting key={m.artworkId} mount={m} artwork={art} />;
          })}
        </ScrollControls>
      </Suspense>
      {/* Postprocessing: composer must be last child (outside Suspense) so it composites
          over the fully-rendered scene. Bloom threshold raised so it reads as a gentle gold
          glow on highlights, not a wash over the paintings (feedback #7). */}
      <EffectComposer enableNormalPass={false}>
        <Bloom mipmapBlur intensity={isSmall ? 0.3 : 0.4} luminanceThreshold={0.85} luminanceSmoothing={0.22} />
        <Vignette eskil={false} offset={0.42} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
