import { useMemo } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { HALL } from '../data/layout';
import { LIGHTING } from '../theme/lighting';
import { useGalleryStore } from '../store/galleryStore';
import { makeParquetTexture, makeCeilingTexture, makePanelTexture } from './textures';

const W = HALL.W;            // hall width (x: -4.4..4.4)
const H = HALL.H;            // hall height (y: 0..4)
const D = HALL.Z0 - HALL.Z1; // depth (z: 10..-26 = 36)
const CZ = (HALL.Z0 + HALL.Z1) / 2; // center z = -8

// Warm-classical hall shell: parquet floor, light coffered ceiling, paneled warm-white
// walls. Lighting lives in <CeilingLights /> (recessed downlights) + canvas ambient/hemi.
export default function ProceduralRoom() {
  const mode = useGalleryStore((s) => s.mode);
  const L = LIGHTING[mode];
  const parquet = useMemo(makeParquetTexture, []);
  const ceiling = useMemo(makeCeilingTexture, []);
  // Bake both wall palettes once and swap the map on toggle (no per-toggle texture churn).
  const panelLight = useMemo(() => makePanelTexture(LIGHTING.light.wall, LIGHTING.light.wallTrim), []);
  const panelDark = useMemo(() => makePanelTexture(LIGHTING.dark.wall, LIGHTING.dark.wallTrim), []);
  const panel = mode === 'dark' ? panelDark : panelLight;

  return (
    <group position={[0, H / 2, CZ]}>
      {/* Parquet floor with a soft waxed reflection (low mirror — reads as wood, not glass). */}
      <mesh position={[0, -H / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <MeshReflectorMaterial
          map={parquet}
          roughness={0.8}
          metalness={0.05}
          blur={[200, 60]}
          mixBlur={1}
          mixStrength={0.8}
          resolution={512}
          mirror={0.08}
        />
      </mesh>

      {/* Plaster ceiling with long recessed panels. In dark mode it's tinted down so the top
          edge reads as dim shadow (the bright cream base would clip to white); in light mode
          the tint is white (no change) so the warm cream ceiling shows through. */}
      <mesh position={[0, H / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={ceiling} color={L.ceilTint} roughness={0.9} />
      </mesh>

      {/* Long paneled walls — identical material both sides (feedback #5). The panel texture
          is already drawn in the wall color, so the mesh color stays white to avoid squaring
          the dark albedo to near-black; the dim lights then carve the moody falloff. */}
      <mesh position={[-W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={panel} roughness={0.95} />
      </mesh>
      <mesh position={[W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={panel} roughness={0.95} />
      </mesh>

      {/* Entrance wall (behind camera start) and far wall (holds the hero painting). */}
      <mesh position={[0, 0, D / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={panel} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={L.wall} roughness={0.95} />
      </mesh>
    </group>
  );
}
