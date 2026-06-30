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
import type { MountPoint } from '../data/layout';
import type { Artwork } from '../data/artworks';
import { tokens } from '../theme/tokens';
import { useGalleryStore } from '../store/galleryStore';
import TextureErrorBoundary from './TextureErrorBoundary';

interface PaintingProps {
  mount: MountPoint;
  artwork: Artwork;
}

function ArtPlane({ mount, artwork }: { mount: MountPoint; artwork: Artwork }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // Click pins this work head-on (a separate camera state in CameraRig); the next
  // scroll releases it back to the walk. mounts are ordered by artworkId, so the
  // mount index is artwork.id - 1.
  const setFocusedMount = useGalleryStore((s) => s.setFocusedMount);
  const focusThis = () => setFocusedMount(artwork.id - 1);

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

  const w = mount.width;
  const h = w / aspect;

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
  // The hero (far-wall work) is the corridor's destination — give it a stronger,
  // wider key light so it stays bright at the vanishing point (feedback #3).
  const isHero = artwork.id === 9;

  return (
    <group position={mount.position} rotation={[0, mount.rotationY, 0]}>
      <TextureErrorBoundary fallback={<FramePlaceholder mount={mount} />}>
        <ArtPlane mount={mount} artwork={artwork} />
      </TextureErrorBoundary>

      {/* Warm per-painting spotlight aimed at the art centre. Art is the brightest
          thing in the room now that ambient/hemi were dropped (feedback #2). */}
      <spotLight
        position={[0, isHero ? 2.6 : 2.2, 1.6]}
        target={lightTarget}
        angle={isHero ? 0.6 : 0.5}
        penumbra={0.7}
        intensity={isHero ? 3.6 : 2.6}
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
