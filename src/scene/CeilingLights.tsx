import { HALL } from '../data/layout';

// Recessed warm downlights set flush into the coffered ceiling — an architectural,
// "expensive classical" look rather than visible hanging bulbs. Two symmetric rows
// (x = ±1.8) so both side walls read equally lit. Each fixture = a small emissive
// disc flush with the ceiling (glows gently via bloom) + a warm point light below it.
const ROWS = [-1.8, 1.8];
const ZS = [4, -8, -20]; // 2 rows × 3 = 6 fixtures (kept modest for forward-render light budget)

export default function CeilingLights() {
  const discY = HALL.H - 0.04;  // flush just under the ceiling (y = 4)
  const lightY = HALL.H - 0.5;  // the actual illuminating source, recessed below

  return (
    <group>
      {ROWS.flatMap((x) =>
        ZS.map((z) => (
          <group key={`${x}_${z}`} position={[x, 0, z]}>
            {/* recessed disc, facing down — emissive tamed (feedback #2) so the
                ceiling edge no longer clips to white under bloom. */}
            <mesh position={[0, discY, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.14, 24]} />
              <meshStandardMaterial color="#2a2118" emissive="#ffd9a0" emissiveIntensity={1.05} roughness={1} />
            </mesh>
            <pointLight position={[0, lightY, 0]} intensity={5.5} distance={16} decay={2} color="#ffe7c6" />
          </group>
        )),
      )}
    </group>
  );
}
