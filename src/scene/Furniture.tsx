// v2 furnishing (feedback #6): a warm runner rug down the centre to guide the walk,
// plus two low dark-stone benches that add life and scale.
//
// The reviewer asked for a "centre bench" but with the v2 continuous walk the camera
// glides straight down x=0 at eye height — a bench ON the rail would be glided
// through (the exact reason benches were pulled in v1). So the benches sit just OFF
// the aisle (x=±1.45) and low (0.45m), flush to the floor: they read in peripheral
// view and never block the forward look down the corridor.

const BENCHES = [
  { x: -1.45, z: 0 },
  { x: 1.45, z: -12 },
];

function Bench({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* seat slab */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.55, 0.12, 1.8]} />
        <meshStandardMaterial color="#2b2b30" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* plinth */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.42, 0.36, 1.6]} />
        <meshStandardMaterial color="#202024" roughness={0.8} />
      </mesh>
    </group>
  );
}

export default function Furniture() {
  return (
    <group>
      {/* Warm runner rug down the centre — guides the walk, sits just above the floor. */}
      <mesh position={[0, 0.02, -7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.0, 30]} />
        <meshStandardMaterial color="#9c7b58" roughness={1} />
      </mesh>
      {BENCHES.map((b, i) => <Bench key={i} x={b.x} z={b.z} />)}
    </group>
  );
}
