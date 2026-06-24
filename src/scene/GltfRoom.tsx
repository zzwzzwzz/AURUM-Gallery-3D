import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';

// Renders the baked Sketchfab GLB room near-unlit so AURUM's post-processing
// (Bloom/Vignette/exposure) owns the mood rather than PBR lighting.
// NOTE: Do NOT call useGLTF.preload() here — the GLB may not be present on disk
// (only placed after the user downloads Elin's "VR Gallery House (baked)").
// GltfRoom is only rendered when config.useGltfRoom is true, so a missing asset
// causes no runtime error in the default build.
export default function GltfRoom({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useLayoutEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const m = mesh.material as THREE.MeshStandardMaterial;
        if (m && 'roughness' in m) {
          m.roughness = 1;
          m.metalness = 0;
        }
        mesh.castShadow = false;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}
