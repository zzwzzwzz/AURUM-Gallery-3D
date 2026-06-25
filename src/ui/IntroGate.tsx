import { useGalleryStore } from '../store/galleryStore';
import { tokens } from '../theme/tokens';

// A frosted "gate" that blocks the gallery on load and shows the name + intro.
// It fades + un-blurs over the first sliver of scroll, revealing the hall behind it.
// pointerEvents are never captured, so the wheel/touch passes through to ScrollControls
// underneath — scrolling is what dismisses the gate.
const FADE_END = 0.06;

export default function IntroGate() {
  const offset = useGalleryStore((s) => s.offset);
  const a = Math.min(1, Math.max(0, 1 - offset / FADE_END)); // 1 → 0 across [0, FADE_END]
  if (a <= 0.001) return null;

  return (
    <div
      aria-hidden={a < 0.5}
      style={{
        position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px',
        background: `rgba(238, 235, 228, ${0.82 * a})`,
        backdropFilter: `blur(${18 * a}px)`, WebkitBackdropFilter: `blur(${18 * a}px)`,
        opacity: Math.min(1, a * 1.2),
      }}
    >
      <div className="u-mono" style={{ fontSize: 11, letterSpacing: '0.42em', color: tokens.color.gold, marginBottom: 18 }}>
        AURUM&nbsp;GALLERY&nbsp;COLLECTION
      </div>
      <h1 style={{
        fontFamily: tokens.font.serif, fontWeight: 400, margin: 0,
        fontSize: 'clamp(56px, 13vw, 150px)', letterSpacing: '0.22em', color: '#15140f',
        textIndent: '0.22em',
      }}>
        AURUM
      </h1>
      <div style={{ width: 64, height: 1, background: tokens.color.gold, opacity: 0.7, margin: '22px 0' }} />
      <p style={{
        fontFamily: tokens.font.serif, fontStyle: 'italic', margin: 0, maxWidth: 540,
        fontSize: 'clamp(16px, 2.4vw, 23px)', lineHeight: 1.5, color: '#3a372f',
      }}>
        An experimental 3D Art Gallery built with Claude.
      </p>
      <div className="u-mono" style={{ marginTop: 34, fontSize: 11, letterSpacing: '0.34em', color: '#8a8576' }}>
        SCROLL TO ENTER&nbsp; ↓
      </div>
    </div>
  );
}
