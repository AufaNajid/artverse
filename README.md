# ARTVERSE — woxiwaldie

A pixel-art portfolio for woxiwaldie, built with Next.js, React, Three.js, and React Three Fiber. Original character artwork, a filterable gallery, artwork detail pages, and an Instagram contact flow sit alongside a floating 3D exhibition of blue frames, cyan glass stairs, and colorful crystals.

## Run locally

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

```sh
npm run lint
npm run build
npm run start
```

`start` serves the production build after `build` succeeds.

## Update the portfolio

- Edit titles, descriptions, categories, gallery entries, and image dimensions in `data/artworks.ts`.
- Keep `coverImage` pointed at the original artwork and `frameImage` pointed at a WebP exhibition texture with dimensions no larger than 1024 pixels.
- Update the Instagram URL and artist copy in `components/Portfolio.tsx`.
- Original files `art1.png`, `art2.jpg`, `compart1.png`, and `compart2.png` are intact in `public/artworks/`, including PNG transparency. See `docs/artwork-prompts.md` for provenance.
- Set optional `NEXT_PUBLIC_SITE_URL` to the public site origin for production metadata.

The homepage hero uses original sprite textures with shallow instanced voxel extrusion. It provides a 2.5D presentation of the artwork; the characters are not fully modeled or rigged. The separate **Explore in 3D** exhibition presents the supplied artwork inside blue frames. Open it from the homepage hero, the Selected Work feature, the gallery’s 3D view, or `/3d`. Share links such as `/3d?karya=toge-toge` open directly on a piece.

Drag to orbit, scroll or pinch to zoom, and click a frame to focus. Previous/Next buttons and Left/Right keys cycle through pieces. The selection panel opens a full-resolution image preview and links to the artwork’s story. Escape steps back through preview, artwork focus, and the full-screen world. Pause and Reset are available; reduced-motion preferences stop ambient animation. A 2D fallback keeps selection, preview, and sharing available when WebGL cannot render.

All supplied originals are intact. The exhibition uses optimized WebP derivatives without replacing the full images used by artwork pages and previews. See `docs/exhibition.md` for texture sizes, source verification, integration details, and controls.

The brief composer copies a draft to the visitor’s clipboard so they can send it on Instagram. There is no email backend or automatic message transmission.

Earlier generated demo assets remain in `public/artworks/` for provenance and are not used by the current portfolio. No deployment has been performed. See `docs/implementation.md` for implementation notes.

Production build, TypeScript, and ESLint pass. Browser checks cover the rendered WebGL gallery, desktop/mobile layouts, frame focus, orbit and wheel zoom, previews, deep links, sharing, filtering, and return navigation. Physical-device pinch input, device FPS, and 4G loading performance have not been benchmarked.
