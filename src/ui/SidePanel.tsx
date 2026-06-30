import { useGalleryStore } from '../store/galleryStore';
import { artworks } from '../data/artworks';
import { tokens } from '../theme/tokens';

// Details appear ONLY when a painting is in head-on front view (focus high),
// and fade out between paintings / behind the intro gate.
const SHOW_AT = 0.5;

export default function SidePanel() {
  const activeIndex = useGalleryStore((s) => s.activeIndex);
  const focus = useGalleryStore((s) => s.focus);
  const art = artworks[activeIndex] ?? artworks[0];

  const visible = focus > SHOW_AT;
  const opacity = Math.min(1, Math.max(0, (focus - SHOW_AT) / 0.3));

  // The aria-live region stays in the DOM; the content mounts only when a painting
  // is in front view, so screen readers announce it on arrival (and visibility:hidden
  // — which removes the live region from the a11y tree — is avoided).
  return (
    <aside
      aria-live="polite"
      aria-hidden={!visible}
      style={{
        position: 'fixed', left: 'clamp(16px, 4vw, 56px)', bottom: 'clamp(24px, 8vh, 80px)',
        maxWidth: 'min(340px, calc(100vw - 32px))', pointerEvents: 'none',
        opacity, transition: 'opacity 400ms ease',
        // No card scrim: the room is dark enough that the cream copy reads cleanly straight on
        // the scene. A slightly stronger text-shadow is the only safeguard for the rare lighter
        // patch (lit floor / wall pool). (See "dark room → no card scrim" rule in CLAUDE.md.)
        padding: 'clamp(14px, 2.2vw, 22px)',
        textShadow: '0 1px 14px rgba(0,0,0,0.78), 0 0 2px rgba(0,0,0,0.6)',
      }}
    >
      {visible && (
        <div key={art.id} style={{ animation: 'aurumFade 600ms ease both' }}>
          <div className="u-mono" style={{ color: tokens.color.gold, fontSize: 12, letterSpacing: '0.14em' }}>
            № {String(art.id).padStart(2, '0')}
          </div>
          <h2 style={{ fontFamily: tokens.font.serif, fontWeight: 500, fontSize: 30, margin: '6px 0 2px', color: tokens.color.warmWhite }}>
            {art.title}
          </h2>
          <div className="u-mono" style={{ fontSize: 12, color: tokens.color.muted }}>{art.artist} · {art.meta}</div>
          <p style={{ fontFamily: tokens.font.serif, fontSize: 18, lineHeight: 1.5, color: tokens.color.warmWhite, marginTop: 12 }}>
            {art.blurb}
          </p>
        </div>
      )}
    </aside>
  );
}
