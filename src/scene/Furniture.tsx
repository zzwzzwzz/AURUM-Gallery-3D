// A single warm runner rug down the center of the hall — guides the walk and adds
// warmth without obstructing the camera (benches removed: a chair mid-aisle that the
// camera glides through read as illogical). Sits just above the floor.

export default function Furniture() {
  return (
    <mesh position={[0, 0.02, -7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[3.0, 30]} />
      <meshStandardMaterial color="#b8946a" roughness={1} />
    </mesh>
  );
}
