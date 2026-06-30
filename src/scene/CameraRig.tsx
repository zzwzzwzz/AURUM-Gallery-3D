import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { sampleRail, focusPose, focusOffsetForMount, stops } from '../data/layout';
import { useGalleryStore } from '../store/galleryStore';
import { useReducedMotion } from '../hooks/useReducedMotion';

/** Nearest value in `arr` to `x` (for reduced-motion station snapping). */
function nearest(arr: number[], x: number): number {
  let best = arr[0];
  for (const v of arr) if (Math.abs(v - x) < Math.abs(best - x)) best = v;
  return best;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export default function CameraRig() {
  const scroll = useScroll();
  const setView = useGalleryStore((s) => s.setView);
  const focusedMount = useGalleryStore((s) => s.focusedMount);
  const setFocusedMount = useGalleryStore((s) => s.setFocusedMount);
  const reduced = useReducedMotion();

  // Start looking forward at the hero wall (offset 0) to avoid a first-frame swing.
  const lookTarget = useRef<THREE.Vector3>(sampleRail(0).look.clone());
  // Scroll offset captured when a painting was clicked; any drift past this releases focus.
  const focusBaseline = useRef<number | null>(null);
  // Remap between the raw DOM scroll and the rail: effectiveOffset = raw + shift.
  // Set when you scroll away from a focused work so the walk resumes from THAT work's
  // position — no scroll teleport (which made drei's damped offset sweep across the
  // hall and lurch the camera). The handoff is a smooth ease, never a jump.
  const offsetShift = useRef(0);

  useFrame((state, delta) => {
    const raw = scroll.offset; // 0..1

    // CLICK-TO-FOCUS state: tween to a head-on, frame-filling pose.
    //  • SCROLLING while focused releases it and resumes the walk FROM THE CLICKED
    //    work's own spot, by rebasing offsetShift so the effective offset equals that
    //    work's offset right now (continuous — no teleport, no sweep).
    //  • CLICKING AGAIN (Painting → focusedMount=null, scroll untouched) returns to the
    //    pre-click spot, since the walk simply resumes at the current effective offset.
    if (focusedMount !== null) {
      if (focusBaseline.current === null) {
        focusBaseline.current = raw;
      } else if (Math.abs(raw - focusBaseline.current) > 0.012) {
        offsetShift.current = focusOffsetForMount(focusedMount) - raw;
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
      setView({ offset: clamp01(raw + offsetShift.current), focus: 1, index: focusedMount });
      return;
    }

    // WALK state: continuous glide along the rail; yaw glances handled in sampleRail.
    const eff = clamp01(raw + offsetShift.current);
    const t = reduced ? nearest(stops, eff) : eff;
    const { pos, look, focus, index } = sampleRail(t);
    setView({ offset: t, focus, index });

    const damp = reduced ? 1 : 1 - Math.pow(0.001, delta);
    state.camera.position.lerp(pos, damp);
    lookTarget.current.lerp(look, damp);
    state.camera.lookAt(lookTarget.current);
  });

  return null;
}
