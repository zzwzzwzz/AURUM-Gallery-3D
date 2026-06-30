import { HALL } from '../data/layout';
import { LIGHTING, CEIL_DISC_EMISSIVE, CEIL_POINT_COLOR } from '../theme/lighting';
import { useGalleryStore } from '../store/galleryStore';

// Recessed warm downlights set flush into the ceiling — concealed apertures, NOT bright
// hanging bulbs, so they suit the dim spotlit-gallery mood. Two symmetric rows (x = ±1.8)
// so both side walls read equally. Each fixture = a softly-glowing emissive disc flush with
// the ceiling (low emissive — a warm aperture, not a white blob) + a dim warm point light.
const ROWS = [-1.8, 1.8];
const ZS = [4, -8, -20]; // 2 rows × 3 = 6 fixtures (kept modest for forward-render light budget)

export default function CeilingLights() {
  const mode = useGalleryStore((s) => s.mode);
  const L = LIGHTING[mode];
  const discY = HALL.H - 0.04;  // flush just under the ceiling (y = 4)
  const lightY = HALL.H - 0.5;  // the actual illuminating source, recessed below

  return (
    <group>
      {ROWS.flatMap((x) =>
        ZS.map((z) => (
          <group key={`${x}_${z}`} position={[x, 0, z]}>
            {/* recessed warm downlight disc, facing down */}
            <mesh position={[0, discY, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.14, 24]} />
              <meshStandardMaterial color={L.ceilDiscColor} emissive={CEIL_DISC_EMISSIVE} emissiveIntensity={L.ceilDiscEmissiveIntensity} roughness={1} />
            </mesh>
            <pointLight position={[0, lightY, 0]} intensity={L.ceilPointIntensity} distance={L.ceilPointDistance} decay={2} color={CEIL_POINT_COLOR} />
          </group>
        )),
      )}
    </group>
  );
}
