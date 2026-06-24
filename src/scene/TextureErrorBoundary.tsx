import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * TextureErrorBoundary — catches errors thrown by useTexture (and any other
 * suspending/throwing child) and renders a fallback for that painting only.
 *
 * Why an ErrorBoundary works here:
 *   - `useTexture` suspends on load (throws a Promise → caught by <Suspense>).
 *   - On a 404 / network error the loader rejects its Promise. React detects the
 *     rejection, re-throws it synchronously into the component tree, and the
 *     nearest *ErrorBoundary* (not Suspense) catches it via getDerivedStateFromError.
 *   - Without this boundary the rejection propagates to the canvas <Suspense>,
 *     which never resolves (it only handles Promise *pending*, not *rejection*),
 *     so the fallback stays mounted forever and the loading bar hangs.
 *   - With this boundary, only the failing ArtPlane subtree is replaced by the
 *     empty-matte FramePlaceholder; the rest of the gallery renders normally.
 */
export default class TextureErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    // Swallow — a missing image degrades gracefully to the placeholder.
    console.warn('[AURUM] Texture failed to load; showing empty matte.', error);
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
