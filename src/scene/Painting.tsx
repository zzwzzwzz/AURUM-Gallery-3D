/**
 * Painting.tsx — one framed artwork on its MountPoint, with a warm per-painting spotlight.
 *
 * Notes / deliberate API choices:
 *
 * 1. Aspect via useTexture read synchronously (drei <Image> keeps the texture in a `map`
 *    shader uniform, not material.map). useTexture suspends until the image is loaded, so we
 *    can read image.naturalWidth/Height on render. The <Image url> shares the same THREE.Cache
 *    entry (no second fetch).
 *
 * 2. Texture quality fix (the "2D pixel / signal shimmer"): the Met images are ~1800px and
 *    non-power-of-two; without mipmaps + anisotropy they crawl/sparkle as the camera moves.
 *    We enable trilinear mipmaps + max anisotropy on the shared texture so the art is crisp
 *    and stable. WebGL2 (three r169) supports mipmaps on NPOT textures.
 *
 * 3. Spotlight targets a stable Object3D added to the scene graph via <primitive> — a raw
 *    SpotLight.target is not auto-added, so it would otherwise aim at world origin.
 *
 * 4. Click-to-focus scrolls the ScrollControls element to the painting's head-on station
 *    offset (focusOffsetForMount), so clicking any painting glides it to the front.
 *
 * 5. Per-painting TextureErrorBoundary degrades a load failure to an empty matte without
 *    breaking the canvas Suspense or the rest of the gallery.
 */

import { useEffect, useMemo, useState } from 'react';
import { Image, useTexture, useCursor, useScroll } from '@react-three/drei';
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
    const off = focusOffsetForMount(artwork.id - 1); // mounts are ordered by artworkId
    scroll.el.scrollTo({
      top: off * (scroll.el.scrollHeight - scroll.el.clientHeight),
      behavior: 'smooth',
    });
  };

  // useTexture suspends until resolved; rejects (404/net error) → ErrorBoundary catches.
  const texture = useTexture(artwork.src);
  const gl = useThree((s) => s.gl);

  // Crisp, stable art: trilinear mipmaps + anisotropic filtering on the shared texture.
  useEffect(() => {
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    texture.colorSpace = THREE.SRGBColorSpace;
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
  const fw = w + 0.18;
  const fh = h + 0.18;

  return (
    <>
      {/* Dark frame slab slightly behind the art plane */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[fw, fh, 0.06]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.8} metalness={0.0} />
      </mesh>
      <Image
        url={artwork.src}
        scale={[w, h]}
        transparent
        toneMapped={false}
        color="#f2efe8"
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={focusThis}
      />
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
      <mesh position={[0, 0, 0]}>
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
