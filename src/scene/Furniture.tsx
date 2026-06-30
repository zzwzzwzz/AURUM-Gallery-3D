// v2 furnishing: a runner rug down the centre to guide the walk, plus four low
// dark-stone benches (mirrored left/right) that add life and scale.
//
// The reviewer asked for a "centre bench" but with the v2 continuous walk the camera
// glides straight down x=0 at eye height — a bench ON the rail would be glided
// through (the exact reason benches were pulled in v1). So the benches sit just OFF
// the aisle (x=±1.45) and low (0.45m), flush to the floor: they read in peripheral
// view and never block the forward look down the corridor.

// Four benches, mirrored left/right at two depths (feedback #1: symmetrical, 4 > 2).
const BX = 1.45;
const BENCHES = [
  { x: -BX, z: -2 }, { x: BX, z: -2 },
  { x: -BX, z: -13 }, { x: BX, z: -13 },
];

function Bench({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* seat slab — dark walnut, warm */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.55, 0.12, 1.8]} />
        <meshStandardMaterial color="#3a2c1d" roughness={0.55} metalness={0.1} />
      </mesh>
      {/* plinth */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.42, 0.36, 1.6]} />
        <meshStandardMaterial color="#2c2114" roughness={0.8} />
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
