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
      gl={{ antialias: true, toneMappingExposure: 1.22 }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <color attach="background" args={[tokens.color.bg]} />
      {/* Warm, well-lit gallery fill: a generous warm hemisphere + ambient so the room
          reads inviting (oil-painting vibe), with the per-painting spotlights still the
          brightest thing on each work. */}
      <hemisphereLight args={[0xfff0d4, 0x4a3c2a, 0.62]} />
      <ambientLight intensity={0.55} />
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
        <Bloom mipmapBlur intensity={isSmall ? 0.26 : 0.34} luminanceThreshold={0.9} luminanceSmoothing={0.22} />
        <Vignette eskil={false} offset={0.35} darkness={0.42} />
      </EffectComposer>
    </Canvas>
  );
}
