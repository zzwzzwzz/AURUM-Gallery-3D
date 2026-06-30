import { useMemo } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { tokens } from '../theme/tokens';
import { HALL } from '../data/layout';
import { makeParquetTexture, makeCeilingTexture, makePanelTexture } from './textures';

const W = HALL.W;            // hall width (x: -4.4..4.4)
const H = HALL.H;            // hall height (y: 0..4)
const D = HALL.Z0 - HALL.Z1; // depth (z: 10..-26 = 36)
const CZ = (HALL.Z0 + HALL.Z1) / 2; // center z = -8

// Warm-classical hall shell: parquet floor, light coffered ceiling, paneled warm-white
// walls. Lighting lives in <CeilingLights /> (recessed downlights) + canvas ambient/hemi.
export default function ProceduralRoom() {
  const parquet = useMemo(makeParquetTexture, []);
  const ceiling = useMemo(makeCeilingTexture, []);
  const panel = useMemo(makePanelTexture, []);

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

      {/* Plaster ceiling with long recessed panels — tinted dark so the top edge reads as
          dim shadow (the bright cream base was clipping to white), matching the moody mood. */}
      <mesh position={[0, H / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={ceiling} color="#34322C" roughness={0.9} />
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
        <meshStandardMaterial color={tokens.color.wall} roughness={0.95} />
      </mesh>
    </group>
  );
}
