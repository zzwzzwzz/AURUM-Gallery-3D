import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { sampleCamera, stops } from '../data/layout';
import { useGalleryStore } from '../store/galleryStore';
import { useReducedMotion } from '../hooks/useReducedMotion';

/** Nearest value in `arr` to `x` (for reduced-motion station snapping). */
function nearest(arr: number[], x: number): number {
  let best = arr[0];
  for (const v of arr) if (Math.abs(v - x) < Math.abs(best - x)) best = v;
  return best;
}

export default function CameraRig() {
  const scroll = useScroll();
  const setView = useGalleryStore((s) => s.setView);
  const reduced = useReducedMotion();

  // Start looking forward at the hero wall (offset 0) to avoid a first-frame swing.
  const lookTarget = useRef<THREE.Vector3>(sampleCamera(0).look.clone());

  useFrame((state, delta) => {
    const raw = scroll.offset; // 0..1
    // Reduced motion: snap to the nearest station (start, each painting, hero).
    const t = reduced ? nearest(stops, raw) : raw;
    const { pos, look, focus, index } = sampleCamera(t);
    setView({ offset: t, focus, index });

    const damp = reduced ? 1 : 1 - Math.pow(0.001, delta);
    state.camera.position.lerp(pos, damp);
    lookTarget.current.lerp(look, damp);
    state.camera.lookAt(lookTarget.current);
  });

  return null;
}
