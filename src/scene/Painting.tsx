/**
 * Painting.tsx — one framed artwork on its MountPoint, with a warm per-painting spotlight.
 *
 * Notes / deliberate choices:
 *
 * 1. The art is a plain <mesh> + <meshBasicMaterial map>, NOT drei <Image>. drei's <Image>
 *    uses a custom shader whose sampling crawled/sparkled under camera motion. A standard
 *    material with a fully-configured texture (trilinear mipmaps + max anisotropy, set in a
 *    useMemo so it applies BEFORE the first GPU upload) renders crisp and stable.
 *
 * 2. The art plane sits at z = +0.02, IN FRONT of the frame slab's front face (z = 0). They
 *    were previously coplanar at z = 0, which z-fights and flickers as the camera moves.
 *
 * 3. Aspect is read from the loaded texture image (useTexture suspends until ready).
 *
 * 4. Spotlight targets a stable Object3D added to the scene graph via <primitive>.
 *
 * 5. Click-to-focus scrolls to the painting's head-on station (focusOffsetForMount).
 *
 * 6. Per-painting TextureErrorBoundary degrades a load failure to an empty matte.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTexture, useCursor } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LEAN, type MountPoint } from '../data/layout';
import type { Artwork } from '../data/artworks';
import { tokens } from '../theme/tokens';
import { LIGHTING } from '../theme/lighting';
import { useGalleryStore } from '../store/galleryStore';
import TextureErrorBoundary from './TextureErrorBoundary';

interface PaintingProps {
  mount: MountPoint;
  artwork: Artwork;
}

function ArtPlane({ mount, artwork }: { mount: MountPoint; artwork: Artwork }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // Click pins this work head-on (a separate camera state in CameraRig); clicking it
  // AGAIN returns to the walk spot you were at before (feedback #4); the next scroll
  // also releases it. mounts are ordered by artworkId, so mount index = artwork.id - 1.
  const mountIndex = artwork.id - 1;
  const focusedMount = useGalleryStore((s) => s.focusedMount);
  const setFocusedMount = useGalleryStore((s) => s.setFocusedMount);
  const focusThis = () => setFocusedMount(focusedMount === mountIndex ? null : mountIndex);

  // useTexture suspends until resolved; rejects (404) → ErrorBoundary catches.
  const texture = useTexture(artwork.src);
  const gl = useThree((s) => s.gl);

  // Crisp, stable art: SRGB + trilinear mipmaps + max anisotropy. One deliberate
  // side-effect per loaded texture (re-uploads once via needsUpdate).
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
  }, [texture, gl]);

  const img = texture.image as HTMLImageElement | undefined;
  const aspect = img?.naturalWidth && img.naturalHeight
    ? img.naturalWidth / img.naturalHeight
    : img?.width && img.height
      ? img.width / img.height
      : 1;

  // Size by width, but CAP the height so a tall/portrait work is never cropped by the
  // floor or ceiling — it hangs whole on the wall (feedback #3). Aspect is preserved
  // (width shrinks with height), so the image is shown complete, never cover-cropped.
  const maxH = artwork.id === 9 ? 2.6 : 2.1;
  let w = mount.width;
  let h = w / aspect;
  if (h > maxH) { w *= maxH / h; h = maxH; }

  return (
    <>
      {/* Dark frame slab; front face at z = 0. */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.18, h + 0.18, 0.06]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.8} metalness={0.0} />
      </mesh>
      {/* Art plane in front of the frame face (z = 0.02 → no z-fight). */}
      <mesh
        position={[0, 0, 0.02]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={focusThis}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} color="#f4f1ea" />
      </mesh>
    </>
  );
}

const DEFAULT_ASPECT = 1.25;

function FramePlaceholder({ mount }: { mount: MountPoint }) {
  const w = mount.width;
  const h = w / DEFAULT_ASPECT;
  return (
    <>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.18, h + 0.18, 0.06]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.8} metalness={0.0} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={tokens.color.wall} />
      </mesh>
    </>
  );
}

export default function Painting({ mount, artwork }: PaintingProps) {
  const lightTarget = useMemo(() => new THREE.Object3D(), []);
  const mode = useGalleryStore((s) => s.mode);
  const L = LIGHTING[mode];
  // The hero (far-wall work) is the corridor's destination — give it a stronger,
  // wider key light so it stays bright at the vanishing point (feedback #3).
  const isHero = artwork.id === 9;

  return (
    <group position={mount.position} rotation={[0, mount.rotationY, 0]}>
      {/* Inner group tilts the art+frame forward about its local X (top toward viewer),
          while the mount stays square to the wall. Positive LEAN tips local +Y toward
          local +Z (the outward normal), i.e. a forward museum lean for every work. */}
      <group rotation={[LEAN, 0, 0]}>
        <TextureErrorBoundary fallback={<FramePlaceholder mount={mount} />}>
          <ArtPlane mount={mount} artwork={artwork} />
        </TextureErrorBoundary>
      </group>

      {/* Warm per-painting spotlight aimed at the art centre — in the dim room this is the
          focal pool, throwing a tight warm halo on the frame + wall around each work. */}
      <spotLight
        position={[0, isHero ? 2.6 : 2.2, 1.6]}
        target={lightTarget}
        angle={isHero ? 0.6 : 0.5}
        penumbra={L.spotPenumbra}
        intensity={isHero ? L.spotIntensityHero : L.spotIntensity}
        distance={isHero ? 9 : 7}
        color={tokens.color.spot}
        castShadow={false}
      />
      {/* Soft fill from the front keeps the hero from going flat under one key. */}
      {isHero && (
        <pointLight position={[0, 0, 2.4]} intensity={1.2} distance={6} decay={2} color="#fff0d6" />
      )}
      <primitive object={lightTarget} position={[0, 0, 0]} />
    </group>
  );
}
