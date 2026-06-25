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
      <div className="u-mono" style={{ fontSize: 11, letterSpacing: '0.5em', color: tokens.color.gold, marginBottom: 16 }}>
        — FIN —
      </div>
      <h2 style={{
        fontFamily: tokens.font.serif, fontWeight: 400, margin: 0,
        fontSize: 'clamp(34px, 7vw, 76px)', letterSpacing: '0.2em', color: tokens.color.warmWhite,
        textIndent: '0.2em',
      }}>
        AURUM
      </h2>
      <p style={{
        fontFamily: tokens.font.serif, fontStyle: 'italic', margin: '18px 0 0',
        fontSize: 'clamp(15px, 2.2vw, 21px)', color: tokens.color.muted, maxWidth: 460, lineHeight: 1.5,
      }}>
        Thank you for walking the hall.
      </p>

      {/* Personal credit */}
      <div style={{ marginTop: 30, fontFamily: tokens.font.serif, fontSize: 'clamp(14px, 1.9vw, 18px)', color: tokens.color.warmWhite }}>
        Designed by <span style={{ fontStyle: 'italic' }}>Ziwen Zhou</span>
      </div>
      <a
        href="https://ziwenzhou.com"
        target="_blank"
        rel="noopener noreferrer"
        className="u-mono"
        tabIndex={a < 0.5 ? -1 : 0}
        style={{ marginTop: 6, fontSize: 12, letterSpacing: '0.18em', color: tokens.color.muted, textDecoration: 'none', pointerEvents: 'auto' }}
      >
        ziwenzhou.com ↗
      </a>

      <div className="u-mono" style={{ marginTop: 26, fontSize: 10, letterSpacing: '0.16em', color: tokens.color.muted, opacity: 0.7 }}>
        art: The Met — Open Access (CC0) · in the public domain
      </div>
    </div>
  );
}
