import { useGalleryStore } from '../store/galleryStore';
import { tokens } from '../theme/tokens';

/**
 * Sun/moon light-dark switch, modeled on the toggle on ziwenzhou.com: a square (8px-radius),
 * transparent, icon-only button at the right end of the top bar. Shows the icon for the mode
 * you'll switch TO — a moon in light mode, a sun in dark mode. Lives in Overlay's right group
 * so it sits in the top-right corner without colliding with the other chrome.
 */
export default function ThemeToggle() {
  const mode = useGalleryStore((s) => s.mode);
  const toggleMode = useGalleryStore((s) => s.toggleMode);
  const isDark = mode === 'dark';

  // Show the icon for the mode you'll switch TO: sun in dark, moon in light. Rendered in
  // AURUM gold (not the site's flat stone/amber) so it stays legible over the variable 3D
  // backdrop — same gold as the adjacent "← 2D gallery" link, which reads in both moods.
  const color = isDark ? tokens.color.goldBright : tokens.color.gold;
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        cursor: 'pointer',
        width: 36,
        height: 36,
        borderRadius: 8,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        opacity: 0.92,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}
      onPointerEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.08)'; }}
      onPointerLeave={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {isDark ? (
        // Sun
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.4v2.4M12 19.2v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.4 12h2.4M19.2 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
        </svg>
      ) : (
        // Crescent moon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
