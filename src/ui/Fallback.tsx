/**
 * Fallback.tsx — accessible screen shown when WebGL is not available.
 *
 * Links back to the main site (the gallery deploys at gallery.ziwenzhou.com as a
 * subdomain of the personal site). Update HOME_URL if the domain changes.
 */
import { tokens } from '../theme/tokens';

const HOME_URL = 'https://ziwenzhou.com';

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
        <a
          href={HOME_URL}
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 13,
            color: tokens.color.goldBright,
          }}
        >
          Visit ziwenzhou.com →
        </a>
      </div>
    </main>
  );
}
