import { useGalleryStore } from '../store/galleryStore';
import { OUTRO_FADE_START } from '../data/layout';
import { tokens } from '../theme/tokens';

// Creative ending — a frosted sign-off bookending the intro gate. It fades in only
// AFTER the hero admire-hold (OUTRO_FADE_START comes from the camera choreography),
// so the visitor sees Madame X clearly, then scrolls the final stretch to the FIN.
export default function OutroCard() {
  const offset = useGalleryStore((s) => s.offset);
  const a = Math.min(1, Math.max(0, (offset - OUTRO_FADE_START) / (1 - OUTRO_FADE_START)));
  if (a <= 0.001) return null;

  return (
    <div
      aria-hidden={a < 0.5}
      style={{
        position: 'fixed', inset: 0, zIndex: 35, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px',
        background: `rgba(11, 11, 12, ${0.5 * a})`,
        backdropFilter: `blur(${4 * a}px)`, WebkitBackdropFilter: `blur(${4 * a}px)`,
        opacity: a,
      }}
    >
      <h2 style={{
        fontFamily: tokens.font.serif, fontWeight: 400, margin: 0,
        fontSize: 'clamp(40px, 8vw, 84px)', letterSpacing: 'clamp(0.12em, 0.8vw, 0.2em)', color: tokens.color.warmWhite,
        textIndent: 'clamp(0.12em, 0.8vw, 0.2em)',
      }}>
        AURUM
      </h2>
      <p style={{
        fontFamily: tokens.font.serif, fontStyle: 'italic', margin: '20px 0 0',
        fontSize: 'clamp(16px, 2.3vw, 22px)', color: tokens.color.muted, lineHeight: 1.5,
      }}>
        Thank you for visiting
      </p>

      {/* Personal credit — the name itself links out. */}
      <div style={{ marginTop: 28, fontFamily: tokens.font.serif, fontSize: 'clamp(15px, 2vw, 19px)', color: tokens.color.warmWhite }}>
        Designed by{' '}
        <a
          href="https://ziwenzhou.com"
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={a < 0.5 ? -1 : 0}
          style={{ color: tokens.color.warmWhite, fontStyle: 'italic', textDecoration: 'underline', textUnderlineOffset: 4, textDecorationColor: tokens.color.gold, pointerEvents: 'auto' }}
        >
          Ziwen Zhou
        </a>
      </div>

      <div className="u-mono" style={{ marginTop: 22, fontSize: 10, letterSpacing: '0.16em', color: tokens.color.muted, opacity: 0.75 }}>
        Art: The Met — Open Access (CC0)
      </div>
    </div>
  );
}
