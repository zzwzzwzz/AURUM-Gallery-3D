// Low gallery seating down the centerline. The camera travels at eye height (1.6 m)
// and glides over these (~0.5 m tall), so they add foreground life without blocking
// any head-on painting view. Bench z's sit between painting stations (feedback #6).

const BENCH_Z = [4, -7, -14];

function Bench({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      {/* cushion */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[2.0, 0.16, 0.62]} />
        <meshStandardMaterial color="#6a6a6e" roughness={0.85} />
      </mesh>
      {/* base */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.84, 0.3, 0.5]} />
        <meshStandardMaterial color="#2c2c2e" roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  );
}

export default function Furniture() {
  return (
    <group>
      {/* Soft runner rug down the center for warmth (just above the floor). */}
      <mesh position={[0, 0.02, -7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.0, 30]} />
        <meshStandardMaterial color="#dcd7cb" roughness={1} />
      </mesh>
      {BENCH_Z.map((z) => <Bench key={z} z={z} />)}
    </group>
  );
}
