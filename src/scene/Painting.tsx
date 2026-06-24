/**
 * Painting.tsx — one framed artwork on its MountPoint, with a warm per-painting spotlight.
 *
 * API deviations from the brief (all justified):
 *
 * 1. Aspect correction via useTexture (read synchronously), NOT onUpdate reading
 *    self.material.map.
 *    Reason: drei <Image> uses a custom shaderMaterial (not a standard MeshStandardMaterial)
 *    whose texture lives in a `map` uniform, not `material.map`. The onUpdate callback fires
 *    on the forwarded THREE.Mesh ref but the texture is not guaranteed to be assigned at that
 *    point, and self.material is typed as Material (no .map). Instead, useTexture suspends
 *    until the texture is fully loaded, so we read texture.image.{naturalWidth,naturalHeight}
 *    synchronously on render — the texture is already resolved by the time we render. The
 *    <Image url> below calls useTexture on the same src, which is a shared THREE.Cache hit
 *    (no extra fetch).
 *
 * 2. Spotlight targeting via a stable Object3D ref rendered as a <primitive> scene child,
 *    NOT via the `target-position` prop alone.
 *    Reason: Three.js SpotLight.target is a plain Object3D that is NOT automatically added
 *    to the scene graph. Setting `target-position` only mutates the target's .position
 *    property, but since the target is never added to the scene the renderer never calls
 *    target.updateMatrixWorld() — the light keeps pointing at world-origin. Rendering the
 *    target as a <primitive> child of the same group adds it to the scene graph, making the
 *    spotlight correctly track local [0,0,0] (the art/wall centre).
 *
 * 3. Click-to-focus uses useScroll().el (HTMLDivElement) confirmed in ScrollControlsState
 *    type definition. scroll.el.scrollTo({ top, behavior:'smooth' }) is the correct API.
 *    artwork.id is 1-based; total = artworks.length — target band = (id-1)/(total-1) mapped to
 *    scrollable range.
 *
 * 4. Per-painting TextureErrorBoundary wraps ArtPlane so a 404 / network error for one
 *    painting degrades gracefully to an empty matte (FramePlaceholder) without affecting
 *    the rest of the gallery or hanging the canvas Suspense.
 */

import { useMemo, useState } from 'react';
import { Image, useTexture, useCursor, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import type { MountPoint } from '../data/layout';
import type { Artwork } from '../data/artworks';
import { artworks } from '../data/artworks';
import { tokens } from '../theme/tokens';
import WallLabel from './WallLabel';
import TextureErrorBoundary from './TextureErrorBoundary';

interface PaintingProps {
  mount: MountPoint;
  artwork: Artwork;
}

// ---------------------------------------------------------------------------
// ArtPlane — the texture-loading subtree. Suspends (via useTexture) until the
// image is ready; throws on rejection — caught by the wrapping ErrorBoundary.
// ---------------------------------------------------------------------------
interface ArtPlaneProps {
  mount: MountPoint;
  artwork: Artwork;
}

function ArtPlane({ mount, artwork }: ArtPlaneProps) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const scroll = useScroll();
  const focusThis = () => {
    const total = artworks.length;
    const target = (artwork.id - 1) / (total - 1);
    scroll.el.scrollTo({
      top: target * (scroll.el.scrollHeight - scroll.el.clientHeight),
      behavior: 'smooth',
    });
  };

  // useTexture suspends until resolved; rejects (404/net error) → ErrorBoundary catches.
  const texture = useTexture(artwork.src);
  const img = texture.image as HTMLImageElement | undefined;
  const aspect = img?.naturalWidth && img.naturalHeight
    ? img.naturalWidth / img.naturalHeight
    : img?.width && img.height
      ? img.width / img.height
      : 1;

  const w = mount.width;
  const h = w / aspect;

  // Frame border: 9 cm per side
  const fw = w + 0.18;
  const fh = h + 0.18;

  return (
    <>
      {/* Dark frame slab slightly behind the art plane */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[fw, fh, 0.06]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.8} metalness={0.0} />
      </mesh>

      {/*
        AURUM dimmed-art tint: color="#eae7df" desaturates/warms slightly.
        drei <Image> renders via its own unlit shader (imageMaterial), so scene
        lighting doesn't affect the art surface — only the color uniform does.
        The warm tint replicates the CSS artFilter: saturate(0.92) brightness(0.92)
        from the 2D site. toneMapped={false} keeps the tint from being colour-shifted
        again by the renderer's tone-mapping pass.
      */}
      <Image
        url={artwork.src}
        scale={[w, h]}
        transparent
        toneMapped={false}
        color="#eae7df"
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={focusThis}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// FramePlaceholder — shown when the texture load fails. Renders an empty,
// on-brand matted frame so the slot reads as intentionally empty, not broken.
// Sized to a sane default aspect (1.25) that approximates a portrait canvas.
// ---------------------------------------------------------------------------
const DEFAULT_ASPECT = 1.25; // width / height — portrait-ish default

interface FramePlaceholderProps {
  mount: MountPoint;
}

function FramePlaceholder({ mount }: FramePlaceholderProps) {
  const w = mount.width;
  const h = w / DEFAULT_ASPECT;
  const fw = w + 0.18;
  const fh = h + 0.18;

  return (
    <>
      {/* Dark frame slab */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[fw, fh, 0.06]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.8} metalness={0.0} />
      </mesh>
      {/* Muted wall-tone matte — reads as an empty canvas, no gold */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={tokens.color.wall} />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// Painting — outer component. Spotlight and WallLabel are outside the
// ErrorBoundary so they always render regardless of texture outcome.
// ---------------------------------------------------------------------------
export default function Painting({ mount, artwork }: PaintingProps) {
  // Stable spotlight target — created once per Painting instance so the <primitive>
  // always holds the same Object3D reference across re-renders.
  const lightTarget = useMemo(() => new THREE.Object3D(), []);

  return (
    <group position={mount.position} rotation={[0, mount.rotationY, 0]}>
      {/*
        TextureErrorBoundary wraps only ArtPlane (the texture-dependent subtree).
        - While loading: useTexture throws a Promise → caught by canvas <Suspense>, fine.
        - On 404/error: loader rejects → React re-throws into the tree → ErrorBoundary
          catches via getDerivedStateFromError → renders FramePlaceholder for this
          painting only. The canvas Suspense is NOT involved, so it resolves normally
          and the loading bar does not hang.
      */}
      <TextureErrorBoundary fallback={<FramePlaceholder mount={mount} />}>
        <ArtPlane mount={mount} artwork={artwork} />
      </TextureErrorBoundary>

      <WallLabel artwork={artwork} width={mount.width} />

      {/*
        Warm per-painting spotlight.
        Position: 2.2 units above and 1.6 units out from the wall — roughly where a
        track light would sit on a gallery ceiling rail.
        target={lightTarget} wires the SpotLight to our stable Object3D.
        The <primitive> below adds that Object3D to the scene graph at local [0, 0, 0]
        (the art centre / wall centre) so Three.js resolves its world position correctly.
      */}
      <spotLight
        position={[0, 2.2, 1.6]}
        target={lightTarget}
        angle={0.5}
        penumbra={0.7}
        intensity={2.6}
        distance={7}
        color={tokens.color.spot}
        castShadow={false}
      />
      {/* Adds lightTarget to the scene graph so the spotlight aim is resolved */}
      <primitive object={lightTarget} position={[0, 0, 0]} />
    </group>
  );
}
