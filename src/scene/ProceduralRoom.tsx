import { tokens } from '../theme/tokens';

// Two boxes meeting at a doorway: a -Z corridor and a +X room B.
export default function ProceduralRoom() {
  return (
    <group>
      {/* Corridor (Room A): centered near z=-2, spans z[10..-14], x[-3.4..3.4] */}
      <Box size={[6.8, 4, 24]} center={[0, 2, -2]} />
      {/* Room B: centered near (9,-18), wider box */}
      <Box size={[10, 4, 12]} center={[9, 2, -18]} />
    </group>
  );
}

/** Inward-facing room shell (floor, ceiling, 4 walls) built from planes. */
function Box({ size, center }: { size: [number, number, number]; center: [number, number, number] }) {
  const [w, h, d] = size;
  const [cx, cy, cz] = center;
  const wall = tokens.color.wall, floor = tokens.color.floor, ceil = tokens.color.ceil;
  return (
    <group position={[cx, cy, cz]}>
      <mesh position={[0, -h / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} /><meshStandardMaterial color={floor} roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} /><meshStandardMaterial color={ceil} roughness={1} />
      </mesh>
      <mesh position={[0, 0, -d / 2]}>
        <planeGeometry args={[w, h]} /><meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      <mesh position={[0, 0, d / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} /><meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      <mesh position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} /><meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      <mesh position={[w / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} /><meshStandardMaterial color={wall} roughness={1} />
      </mesh>
    </group>
  );
}
