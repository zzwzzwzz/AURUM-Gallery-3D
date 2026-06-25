import GalleryCanvas from './scene/GalleryCanvas';
import Overlay from './ui/Overlay';
import SidePanel from './ui/SidePanel';
import IntroGate from './ui/IntroGate';
import OutroCard from './ui/OutroCard';
import Loader from './ui/Loader';
import Fallback from './ui/Fallback';
import { isWebGLAvailable } from './lib/webgl';

export default function App() {
  if (!isWebGLAvailable()) return <Fallback />;
  return (
    <>
      <Loader />
      <GalleryCanvas />
      <Overlay />
      <SidePanel />
      <IntroGate />
      <OutroCard />
    </>
  );
}
