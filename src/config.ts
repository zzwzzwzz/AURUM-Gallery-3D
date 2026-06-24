// Flip useGltfRoom to true after dropping Elin's model at public/models/gallery.glb.
// See Task 13 README for the asset-fit procedure (re-author mounts/railPoints to the model's rooms).
export const config = {
  useGltfRoom: false,
  gltfUrl: '/models/gallery.glb',
} as const;
