import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { ScrollControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { tokens } from '../theme/tokens';
import { config } from '../config';
import ProceduralRoom from './ProceduralRoom';
import GltfRoom from './GltfRoom';
import Painting from './Painting';
import CameraRig from './CameraRig';
import { mounts } from '../data/layout';
import { artworks } from '../data/artworks';

export default function GalleryCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.6, 10], fov: 55, near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMappingExposure: 1.1 }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <color attach="background" args={[tokens.color.bg]} />
      <hemisphereLight args={[0xffffff, 0x222222, 0.45]} />
      <ambientLight intensity={0.5} />
      <Suspense fallback={null}>
        {/* ScrollControls creates the scroll DOM overlay; CameraRig reads it via useScroll().
            Room and paintings are plain children (NOT wrapped in <Scroll>) so they remain
            world-static — only the camera moves, driven by CameraRig's useFrame. */}
        <ScrollControls pages={4} damping={0.25}>
          <CameraRig />
          {config.useGltfRoom ? <GltfRoom url={config.gltfUrl} /> : <ProceduralRoom />}
          {mounts.map((m) => {
            const art = artworks.find((a) => a.id === m.artworkId)!;
            return <Painting key={m.artworkId} mount={m} artwork={art} />;
          })}
        </ScrollControls>
      </Suspense>
      {/* Postprocessing: composer must be last child (outside Suspense) so it composites
          over the fully-rendered scene. enableNormalPass={false} skips the normal-pass
          render (v2.19 API — the brief used the old disableNormalPass prop which no longer
          exists; the inverse boolean achieves the same result). */}
      <EffectComposer enableNormalPass={false}>
        <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.55} luminanceSmoothing={0.2} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
