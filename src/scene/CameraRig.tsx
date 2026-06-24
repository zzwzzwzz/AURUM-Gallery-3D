import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { buildRail, railPoints, sampleRail } from '../data/layout';
import { useGalleryStore } from '../store/galleryStore';
import { artworks } from '../data/artworks';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function CameraRig() {
  const scroll = useScroll();
  const setOffset = useGalleryStore((s) => s.setOffset);
  const reduced = useReducedMotion();
  const curve = useMemo(() => buildRail(railPoints), []);

  // Initialize look-target to the first rail look point (t=0) to avoid an
  // initial camera swing from origin toward (0,0,0) on the first frame.
  const lookTarget = useRef<THREE.Vector3>(sampleRail(curve, 0).look.clone());

  useFrame((state, delta) => {
    const raw = scroll.offset; // 0..1
    // Reduced motion: snap to the nearest of N discrete stops.
    const t = reduced
      ? Math.round(raw * (artworks.length - 1)) / (artworks.length - 1)
      : raw;
    setOffset(raw);
    const { pos, look } = sampleRail(curve, t);
    // Frame-rate-independent easing; reduced-motion uses damp=1 for instant snap.
    const damp = reduced ? 1 : 1 - Math.pow(0.001, delta);
    state.camera.position.lerp(pos, damp);
    lookTarget.current.lerp(look, damp);
    state.camera.lookAt(lookTarget.current);
  });

  return null;
}
