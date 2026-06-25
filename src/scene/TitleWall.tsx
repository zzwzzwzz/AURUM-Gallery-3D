import { Text } from '@react-three/drei';
import { tokens } from '../theme/tokens';
import { FAR_Z } from '../data/layout';

// In-scene AURUM wordmark on the far end-wall (z = FAR_Z). Text faces +Z toward the
// incoming camera, sitting just in front of the wall plane so it never z-fights.
// Fonts are self-hosted (public/fonts) so the title renders on-brand AND offline —
// drei <Text> would otherwise fetch Roboto from a CDN.
const SERIF = '/fonts/CormorantGaramond.ttf';
const MONO = '/fonts/SpaceMono-Regular.ttf';

export default function TitleWall() {
  return (
    <group position={[0, 2.0, FAR_Z + 0.05]}>
      <Text
        font={SERIF}
        fontSize={1.0}
        letterSpacing={0.18}
        color={tokens.color.warmWhite}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.004}
        outlineColor={tokens.color.gold}
      >
        AURUM
      </Text>
      <Text
        position={[0, -0.8, 0]}
        font={MONO}
        fontSize={0.14}
        letterSpacing={0.4}
        color={tokens.color.muted}
        anchorX="center"
        anchorY="middle"
      >
        IMMERSIVE GALLERY
      </Text>
    </group>
  );
}
