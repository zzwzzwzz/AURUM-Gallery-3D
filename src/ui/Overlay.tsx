import { tokens } from '../theme/tokens';

export default function Overlay() {
  return (
    <>
      <header style={{ position: 'fixed', top: 22, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 clamp(16px,4vw,56px)', pointerEvents: 'none' }}>
        <h1 style={{ margin: 0, fontFamily: tokens.font.serif, fontWeight: 400, fontSize: 22, letterSpacing: '0.18em', color: tokens.color.warmWhite }}>
          <span style={{ color: tokens.color.gold }}>—</span> AURUM <span style={{ color: tokens.color.gold }}>—</span>
        </h1>
        <span className="u-mono" style={{ fontSize: 11, color: tokens.color.muted, letterSpacing: '0.14em', alignSelf: 'center' }}>
          immersive · beta
        </span>
      </header>
      <div className="u-mono" style={{ position: 'fixed', bottom: 18, right: 'clamp(16px,4vw,56px)', fontSize: 10, color: tokens.color.muted, pointerEvents: 'none', textAlign: 'right', lineHeight: 1.6 }}>
        scroll to walk the gallery<br />
        <span style={{ opacity: 0.7 }}>model: VR Gallery House by Elin (CC BY 4.0) · art: The Met (CC0)</span>
      </div>
    </>
  );
}
