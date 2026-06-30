import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { ScrollControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { tokens } from '../theme/tokens';
import { LIGHTING } from '../theme/lighting';
import { useGalleryStore } from '../store/galleryStore';
import ProceduralRoom from './ProceduralRoom';
import CeilingLights from './CeilingLights';
import Furniture from './Furniture';
import Painting from './Painting';
import CameraRig from './CameraRig';
import { mounts } from '../data/layout';
import { artworks } from '../data/artworks';

// toneMappingExposure is a renderer setting, not a reactive prop — the <Canvas gl> value
// only applies at mount. This drives it from the active mode so the toggle re-exposes live.
function ExposureSync({ exposure }: { exposure: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

export default function GalleryCanvas() {
  // Detect small/mobile screens at mount time to lower GPU cost.
  // matchMedia guard keeps this safe in SSR / test environments where window is absent.
  const isSmall = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches;
  const mode = useGalleryStore((s) => s.mode);
  const L = LIGHTING[mode];

  return (
    <Canvas
      dpr={[1, isSmall ? 1.5 : 2]}
      camera={{ position: [0, 1.6, 10], fov: 55, near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMappingExposure: L.exposure }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <ExposureSync exposure={L.exposure} />
      <color attach="background" args={[tokens.color.bg]} />
      {/* Gallery fill, mode-driven (see theme/lighting.ts). Dark = low cool hemisphere + faint
          ambient so the room falls into shadow and the per-painting spots become focal pools;
          light = a generous warm hemisphere + ambient for an inviting, well-lit room. */}
      <hemisphereLight args={[L.hemiSky, L.hemiGround, L.hemiIntensity]} />
      <ambientLight intensity={L.ambient} />
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
        <Bloom mipmapBlur intensity={isSmall ? L.bloomSmall : L.bloomBase} luminanceThreshold={L.bloomThreshold} luminanceSmoothing={0.22} />
        <Vignette eskil={false} offset={L.vignetteOffset} darkness={L.vignetteDarkness} />
      </EffectComposer>
    </Canvas>
  );
}
