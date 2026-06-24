/**
 * Fallback.tsx — accessible screen shown when WebGL is not available.
 *
 * The href below is a placeholder. Replace it with the deployed 2D AURUM gallery URL
 * (e.g. "https://aurum.example.com/" or a relative path like "../") at integration time.
 */
import { tokens } from '../theme/tokens';

export default function Fallback() {
  return (
    <main
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        padding: 24,
        background: tokens.color.bg,
      }}
    >
      <div style={{ maxWidth: 460 }}>
        <h1
          style={{
            fontFamily: tokens.font.serif,
            fontWeight: 400,
            color: tokens.color.warmWhite,
          }}
        >
          <span style={{ color: tokens.color.gold }}>—</span> AURUM{' '}
          <span style={{ color: tokens.color.gold }}>—</span>
        </h1>
        <p
          style={{
            fontFamily: tokens.font.serif,
            fontSize: 18,
            color: tokens.color.warmWhite,
          }}
        >
          The immersive gallery needs WebGL, which isn't available here.
        </p>
        {/* TODO: replace href with the deployed 2D AURUM gallery URL at integration time */}
        <a
          href="../"
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 13,
            color: tokens.color.goldBright,
          }}
        >
          Enter the gallery in 2D →
        </a>
      </div>
    </main>
  );
}
