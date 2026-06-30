import { tokens } from '../theme/tokens';
import ThemeToggle from './ThemeToggle';

export default function Overlay() {
  // Return the visitor to the start of the walk. The gallery is driven by drei's
  // ScrollControls, which mounts a single scrollable <div> (absolute, overflow-y:auto)
  // in the DOM; CameraRig reads its offset. Smoothly scrolling that element to the top
  // rewinds the camera to the entrance — no coupling to the scene code.
  const goToStart = () => {
    const divs = document.querySelectorAll('div');
    for (let i = 0; i < divs.length; i++) {
      const el = divs[i];
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
  };

  return (
    <>
      <header style={{ position: 'fixed', top: 'clamp(14px,2.4vh,22px)', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '0 clamp(16px,4vw,56px)', pointerEvents: 'none', textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}>
        <h1 style={{ margin: 0 }}>
          <button
            onClick={goToStart}
            aria-label="AURUM 3D — back to the start"
            style={{ all: 'unset', cursor: 'pointer', pointerEvents: 'auto', fontFamily: tokens.font.serif, fontWeight: 400, fontSize: 'clamp(15px,4.8vw,22px)', letterSpacing: 'clamp(0.1em,0.6vw,0.18em)', whiteSpace: 'nowrap', color: tokens.color.warmWhite }}
          >
            <span style={{ color: tokens.color.gold }}>—</span> AURUM 3D <span style={{ color: tokens.color.gold }}>—</span>
          </button>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px,2vw,22px)', alignSelf: 'center', pointerEvents: 'auto' }}>
          <a
            href="https://aurumgallery.ziwenzhou.com"
            className="u-mono"
            style={{ fontSize: 'clamp(11px,3vw,12px)', color: tokens.color.gold, letterSpacing: '0.14em', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            ← 2D gallery
          </a>
          <span className="u-mono u-hide-sm" style={{ fontSize: 11, color: tokens.color.muted, letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>
            immersive · beta
          </span>
          <ThemeToggle />
        </div>
      </header>
      <div className="u-mono" style={{ position: 'fixed', bottom: 18, right: 'clamp(16px,4vw,56px)', fontSize: 10, color: tokens.color.muted, pointerEvents: 'none', textAlign: 'right', lineHeight: 1.7, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
        scroll to walk the gallery<br />
        click a painting to bring it forward<br />
        <span style={{ opacity: 0.7 }}>art: The Met — Open Access (CC0)</span>
      </div>
    </>
  );
}
