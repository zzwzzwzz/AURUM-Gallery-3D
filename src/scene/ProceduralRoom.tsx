import { useMemo } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { tokens } from '../theme/tokens';
import { makeParquetTexture, makeCofferTexture, makePanelTexture } from './textures';

const W = 8.8;   // hall width  (x: -4.4..4.4)
const H = 4;     // hall height (y: 0..4)
const Z0 = 10;   // entrance wall z
const Z1 = -26;  // far (title) wall z
const D = Z0 - Z1;          // depth 36
const CZ = (Z0 + Z1) / 2;   // center z = -8

// One warm-classical hall: parquet floor, coffered ceiling, paneled warm-white walls.
// Built from runtime CanvasTextures (no external assets) so it always runs.
export default function ProceduralRoom() {
  const parquet = useMemo(makeParquetTexture, []);
  const coffer = useMemo(makeCofferTexture, []);
  const panel = useMemo(makePanelTexture, []);

  return (
    <group position={[0, H / 2, CZ]}>
      {/* Parquet floor with a subtle waxed reflection (lower mirror than a true mirror). */}
      <mesh position={[0, -H / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <MeshReflectorMaterial
          map={parquet}
          roughness={0.7}
          metalness={0.05}
          blur={[200, 60]}
          mixBlur={1}
          mixStrength={1.2}
          resolution={512}
          mirror={0.12}
        />
      </mesh>

      {/* Coffered ceiling */}
      <mesh position={[0, H / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={coffer} roughness={0.95} />
      </mesh>

      {/* Long paneled walls (warm-white) */}
      <mesh position={[-W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={panel} color={tokens.color.wall} roughness={0.95} />
      </mesh>
      <mesh position={[W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={panel} color={tokens.color.wall} roughness={0.95} />
      </mesh>

      {/* Entrance wall (behind camera start) and far/title wall (plain — TitleWall draws text in front) */}
      <mesh position={[0, 0, D / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={panel} color={tokens.color.wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={tokens.color.wall} roughness={0.95} />
      </mesh>

      {/* Warm directional "window" light raking across the floor + the per-painting spots. */}
      <directionalLight position={[6, 7, 4]} intensity={0.9} color={'#ffdfae'} />
    </group>
  );
}
