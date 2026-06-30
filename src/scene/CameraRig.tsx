import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { sampleRail, focusPose, stops } from '../data/layout';
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
  const focusedMount = useGalleryStore((s) => s.focusedMount);
  const setFocusedMount = useGalleryStore((s) => s.setFocusedMount);
  const reduced = useReducedMotion();

  // Start looking forward at the hero wall (offset 0) to avoid a first-frame swing.
  const lookTarget = useRef<THREE.Vector3>(sampleRail(0).look.clone());
  // Scroll offset captured when a painting was clicked; any drift past this clears focus.
  const focusBaseline = useRef<number | null>(null);

  useFrame((state, delta) => {
    const raw = scroll.offset; // 0..1

    // CLICK-TO-FOCUS state: tween to a head-on, frame-filling pose. The first real
    // scroll afterwards (offset drifts from the captured baseline) releases it.
    if (focusedMount !== null) {
      if (focusBaseline.current === null) focusBaseline.current = raw;
      else if (Math.abs(raw - focusBaseline.current) > 0.012) {
        setFocusedMount(null);
        focusBaseline.current = null;
      }
    } else if (focusBaseline.current !== null) {
      focusBaseline.current = null;
    }

    if (focusedMount !== null) {
      const { pos, look } = focusPose(focusedMount);
      const damp = 1 - Math.pow(0.0008, delta); // a touch snappier than the walk
      state.camera.position.lerp(pos, damp);
      lookTarget.current.lerp(look, damp);
      state.camera.lookAt(lookTarget.current);
      setView({ offset: raw, focus: 1, index: focusedMount });
      return;
    }

    // WALK state: continuous glide along the rail; yaw glances handled in sampleRail.
    const t = reduced ? nearest(stops, raw) : raw;
    const { pos, look, focus, index } = sampleRail(t);
    setView({ offset: t, focus, index });

    const damp = reduced ? 1 : 1 - Math.pow(0.001, delta);
    state.camera.position.lerp(pos, damp);
    lookTarget.current.lerp(look, damp);
    state.camera.lookAt(lookTarget.current);
  });

  return null;
}
