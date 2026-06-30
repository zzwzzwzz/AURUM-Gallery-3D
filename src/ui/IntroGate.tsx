import { useGalleryStore } from '../store/galleryStore';
import { tokens } from '../theme/tokens';

// A frosted "gate" that blocks the gallery on load and shows the name + intro.
// It fades + un-blurs over the first sliver of scroll, revealing the hall behind it.
// pointerEvents are never captured, so the wheel/touch passes through to ScrollControls
// underneath — scrolling is what dismisses the gate.
//
// Two independent layers so the fade reads cleanly (feedback): the TEXT clears first
// (by TEXT_END), then the frosted BACKGROUND clears (by BG_END), revealing the whole
// gallery. Previously a single div opacity was multiplied into the background alpha,
// so the background went ~a² while the dark text went ~a and lingered over the hall.
const TEXT_END = 0.03; // text fully gone early
const BG_END = 0.06;   // frost fully gone a beat later

export default function IntroGate() {
  const offset = useGalleryStore((s) => s.offset);
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const bgA = clamp(1 - offset / BG_END);     // frosted background: 1 → 0 across [0, BG_END]
  const textA = clamp(1 - offset / TEXT_END); // text/content: 1 → 0 across [0, TEXT_END] (clears first)
  if (bgA <= 0.001) return null;

  return (
    <>
      {/* Frosted background layer */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none',
          background: `rgba(238, 235, 228, ${0.9 * bgA})`,
          backdropFilter: `blur(${18 * bgA}px)`, WebkitBackdropFilter: `blur(${18 * bgA}px)`,
        }}
      />
      {/* Content layer — fades out ahead of the background */}
      <div
        aria-hidden={textA < 0.5}
        style={{
          position: 'fixed', inset: 0, zIndex: 41, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 24px', opacity: textA,
        }}
      >
        <div className="u-mono" style={{ fontSize: 'clamp(11px, 1.5vw, 15px)', letterSpacing: 'clamp(0.24em, 1.4vw, 0.42em)', color: tokens.color.gold, marginBottom: 18 }}>
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
          fontFamily: tokens.font.serif, margin: 0, maxWidth: 540,
          fontSize: 'clamp(18px, 2.8vw, 26px)', lineHeight: 1.5, color: '#3a372f',
        }}>
          An experimental 3D Art Gallery built with Claude.
        </p>
        <div className="u-mono" style={{ marginTop: 'clamp(26px, 4vh, 34px)', fontSize: 'clamp(14px, 3.6vw, 20px)', letterSpacing: 'clamp(0.2em, 1vw, 0.34em)', color: '#8a8576' }}>
          SCROLL TO ENTER&nbsp; ↓
        </div>
      </div>
    </>
  );
}
