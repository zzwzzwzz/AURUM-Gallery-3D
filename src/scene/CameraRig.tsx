import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { buildRail, railPoints, sampleRail, sampleLook, STATIONS } from '../data/layout';
import { useGalleryStore } from '../store/galleryStore';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function CameraRig() {
  const scroll = useScroll();
  const setOffset = useGalleryStore((s) => s.setOffset);
  const reduced = useReducedMotion();
  const curve = useMemo(() => buildRail(railPoints), []);

  // Start looking at the title wall (offset 0) to avoid a first-frame swing.
  const lookTarget = useRef<THREE.Vector3>(sampleLook(0));

  useFrame((state, delta) => {
    const raw = scroll.offset; // 0..1
    // Reduced motion: snap to the nearest of the N discrete stations (title + 8 works).
    const t = reduced ? Math.round(raw * (STATIONS - 1)) / (STATIONS - 1) : raw;
    setOffset(t); // store the snapped value so the side panel matches the camera's station

    const { pos } = sampleRail(curve, t);   // position: forward dolly
    const look = sampleLook(t);             // look: eased across station anchors

    // Frame-rate-independent easing; reduced-motion uses damp=1 for instant snap.
    const damp = reduced ? 1 : 1 - Math.pow(0.001, delta);
    state.camera.position.lerp(pos, damp);
    lookTarget.current.lerp(look, damp);
    state.camera.lookAt(lookTarget.current);
  });

  return null;
}
