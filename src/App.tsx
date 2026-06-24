import { tokens } from './theme/tokens';

export default function App() {
  return (
    <main style={{ height: '100%', display: 'grid', placeItems: 'center', background: tokens.color.bg }}>
      <h1 style={{ fontFamily: tokens.font.serif, color: tokens.color.warmWhite, fontWeight: 400 }}>
        <span style={{ color: tokens.color.gold }}>—</span> AURUM <span style={{ color: tokens.color.gold }}>—</span>
      </h1>
    </main>
  );
}
