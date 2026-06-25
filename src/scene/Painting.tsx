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
import { useTexture, useCursor, useScroll } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { MountPoint } from '../data/layout';
import { focusOffsetForMount } from '../data/layout';
import type { Artwork } from '../data/artworks';
import { tokens } from '../theme/tokens';
import TextureErrorBoundary from './TextureErrorBoundary';

interface PaintingProps {
  mount: MountPoint;
  artwork: Artwork;
}

function ArtPlane({ mount, artwork }: { mount: MountPoint; artwork: Artwork }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const scroll = useScroll();
  const focusThis = () => {
    const off = focusOffsetForMount(artwork.id - 1); // mounts ordered by artworkId
    scroll.el.scrollTo({
      top: off * (scroll.el.scrollHeight - scroll.el.clientHeight),
      behavior: 'smooth',
    });
  };

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

  return (
    <group position={mount.position} rotation={[0, mount.rotationY, 0]}>
      <TextureErrorBoundary fallback={<FramePlaceholder mount={mount} />}>
        <ArtPlane mount={mount} artwork={artwork} />
      </TextureErrorBoundary>

      {/* Warm per-painting spotlight aimed at the art centre. */}
      <spotLight
        position={[0, 2.2, 1.6]}
        target={lightTarget}
        angle={0.5}
        penumbra={0.7}
        intensity={2.2}
        distance={7}
        color={tokens.color.spot}
        castShadow={false}
      />
      <primitive object={lightTarget} position={[0, 0, 0]} />
    </group>
  );
}
