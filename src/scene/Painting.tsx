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
 */

import { useMemo, useState } from 'react';
import { Image, useTexture, useCursor, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import type { MountPoint } from '../data/layout';
import type { Artwork } from '../data/artworks';
import { artworks } from '../data/artworks';
import { tokens } from '../theme/tokens';
import WallLabel from './WallLabel';

interface PaintingProps {
  mount: MountPoint;
  artwork: Artwork;
}

export default function Painting({ mount, artwork }: PaintingProps) {
  // Stable spotlight target — created once per Painting instance so the <primitive>
  // always holds the same Object3D reference across re-renders.
  const lightTarget = useMemo(() => new THREE.Object3D(), []);

  // Hover state for pointer-cursor affordance (useCursor sets document.body cursor style).
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // useScroll() is valid here because Painting is always rendered inside <ScrollControls>.
  // scroll.el is the HTMLDivElement scroll container; we drive it programmatically on click.
  const scroll = useScroll();
  const focusThis = () => {
    // Map this artwork's 1-based id to a 0..1 band within the scroll range.
    // artworks.length replaces the former hardcoded TOTAL=8 — stays correct if artworks grow.
    const total = artworks.length;
    const target = (artwork.id - 1) / (total - 1);
    scroll.el.scrollTo({
      top: target * (scroll.el.scrollHeight - scroll.el.clientHeight),
      behavior: 'smooth',
    });
  };

  // useTexture suspends until the texture is fully loaded (inside <Suspense>), so by the
  // time this component renders the texture is resolved and its natural dimensions are
  // available synchronously — no onLoad callback or state needed.
  const texture = useTexture(artwork.src);
  const img = texture.image as HTMLImageElement | undefined;
  const aspect = img?.naturalWidth && img.naturalHeight
    ? img.naturalWidth / img.naturalHeight
    : img?.width && img.height
      ? img.width / img.height
      : 1; // width / height

  const w = mount.width;
  const h = w / aspect;

  // Frame border: 9 cm per side
  const fw = w + 0.18;
  const fh = h + 0.18;

  return (
    <group position={mount.position} rotation={[0, mount.rotationY, 0]}>
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

      <WallLabel artwork={artwork} width={w} />

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
