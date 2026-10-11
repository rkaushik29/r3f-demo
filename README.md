# Show, don't tell

A real-time 3D product viewer. One full-viewport canvas, one model, one HDRI.

Vite + React + TypeScript, `@react-three/fiber`, `@react-three/drei`. No UI framework, no CSS framework.

## Run

```bash
npm install
npm run dev
```

`npm run build` type-checks and bundles to `dist/`.

## Deploy

Zero config on Vercel: import the repo, framework preset "Vite", done.

## What is in the box

- `src/App.tsx`: canvas, headline, loading overlay, `prefers-reduced-motion` hook.
- `src/Scene.tsx`: HDRI environment, floating model that tilts toward the cursor, contact shadows.
- `public/model.glb`: Poly Haven "Camera 01" (CC0), compressed with `gltf-transform optimize` (meshopt geometry, WebP textures). 6.2 MB source, 2.5 MB shipped.
- `public/studio.hdr`: Poly Haven "Studio Small 09" (CC0), 1k.

## The details that matter

- `useProgress` loading overlay, released only when the whole scene has resolved, so nothing pops in.
- `AdaptiveDpr` lowers render resolution while the pointer moves, so phones keep a steady frame rate.
- `prefers-reduced-motion` freezes the float, the spin and the tilt, and drops the render loop to on-demand.
- Model is fitted to the viewport width, so a wide strap does not get cropped on a phone.

## Swap the product

Replace `public/model.glb` with any glTF binary and `public/studio.hdr` with any equirectangular HDR. The model is auto-centred and auto-scaled.
