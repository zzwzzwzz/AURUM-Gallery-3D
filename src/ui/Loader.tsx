/**
 * Loader.tsx — full-screen loading overlay driven by drei's useProgress.
 *
 * useProgress is a zustand store that reads three's global LoadingManager; it is
 * intentionally rendered OUTSIDE the <Canvas> (as a DOM overlay) so it remains
 * visible while the canvas itself is still initialising. This is the supported
 * usage pattern — useProgress does not require a Canvas context.
 *
 * API note: useProgress returns a zustand store selector; destructure { active, progress }
 * directly (no selector function needed for these two fields).
 */
import { useProgress } from '@react-three/drei';
import { tokens } from '../theme/tokens';

export default function Loader() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: tokens.color.bg,
        zIndex: 10,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          className="u-mono"
          style={{
            color: tokens.color.muted,
            fontSize: 11,
            letterSpacing: '0.2em',
            marginBottom: 10,
          }}
        >
          HANGING THE WORKS… {Math.round(progress)}%
        </div>
        <div
          style={{
            width: 200,
            height: 1,
            background: tokens.color.hairline,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: tokens.color.goldBright,
              transition: 'width 200ms',
            }}
          />
        </div>
      </div>
    </div>
  );
}
