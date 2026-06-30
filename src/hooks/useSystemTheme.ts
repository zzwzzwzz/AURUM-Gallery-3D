import { useEffect } from 'react';
import { useGalleryStore, hasExplicitMode, systemMode } from '../store/galleryStore';

// One stable MediaQueryList for the app's lifetime. Binding the change listener to a single
// retained instance (rather than one created inside the effect — which StrictMode's
// mount/cleanup/remount churn can leave without a live listener) makes OS-change tracking
// reliable.
const darkMQ = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null;

/**
 * Keep the gallery's light/dark mood in sync with the OS `prefers-color-scheme` — but only
 * until the visitor makes an explicit choice with the toggle (which persists and wins from
 * then on).
 */
export function useSystemTheme(): void {
  const followSystemMode = useGalleryStore((s) => s.followSystemMode);

  useEffect(() => {
    if (!darkMQ) return;
    const apply = () => {
      // An explicit toggle choice sticks — don't override it with the OS setting.
      if (!hasExplicitMode()) followSystemMode(systemMode());
    };
    apply(); // catch a scheme that changed between store init and mount
    darkMQ.addEventListener('change', apply);
    return () => darkMQ.removeEventListener('change', apply);
  }, [followSystemMode]);
}
