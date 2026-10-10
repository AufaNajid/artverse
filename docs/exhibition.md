# ARTVERSE: Explore in 3D

The 3D exhibition extends woxiwaldie’s portfolio with a floating ring of electric-blue artwork frames, translucent cyan stairs, and colored crystals. The original illustrations remain the artwork: the scene presents them as framed images rather than inventing modeled versions of the characters. The ordinary gallery and artwork pages remain available alongside the exhibition.

## Portfolio integration and routes

The homepage hero’s **Explore in 3D** button and the exhibition feature below Selected Work open the same full-screen world overlay. The gallery’s 3D view embeds that exhibition and follows the active category filter. The regular artwork grid remains available below it. Closing the overlay returns to the homepage context.

`/3d` opens the exhibition as a dedicated page. `/3d?karya=toge-toge` focuses the matching artwork on entry; unsupported or repeated `karya` parameters open the world overview. Selecting or clearing an artwork on this route updates the query without a full navigation. The selected artwork’s Share button copies its absolute `/3d?karya=<slug>` link, or displays the link for manual copying when clipboard access is unavailable.

`components/explore/ExploreWorld.tsx` owns the loading state, controls, selection panel, image preview, and fallback. `components/three/ExhibitionScene.tsx` owns the Three.js frames, glass installation, crystals, particles, orbit controls, and camera transitions. `components/explore/ExploreRoute.tsx` connects the dedicated page to its query parameters. Route metadata, a social preview image, and a sitemap entry are provided for `/3d`.

## Viewing and controls

- Drag to orbit; scroll or pinch to zoom. Click a frame, select an artwork in the thumbnail rail, or use Previous/Next to focus it. Focus moves the camera and opens a panel with the title, category, description, tags, story link, and Share control.
- Left and Right arrow keys cycle through artworks. In the embedded gallery, keyboard navigation is active while focus is within the exhibition; the full-screen overlay and dedicated page handle the keys across their world interface.
- **View full artwork** opens a native dialog using the unchanged, full-resolution `coverImage`, with Fit/Zoom and Close controls. The 3D textures are not used for this preview.
- Escape closes the image preview first, then clears an artwork focus, then closes the homepage overlay or returns from `/3d` to the portfolio. The embedded view remains in place after focus is cleared.
- Pause stops ambient movement and automatic orbit; Reset clears selection and returns to the world overview. The browser’s reduced-motion preference stops ambient movement and makes camera focus immediate. Orbit and artwork selection remain available.
- The fallback gallery exposes the same selection, artwork information, full-resolution preview, and share controls when WebGL is unavailable, scene loading fails, or the rendering context is lost.

The scene is loaded on the client. Narrow screens use lower rendering resolution, fewer crystals and particles, and simpler glass. Hidden or off-screen scenes suspend continuous rendering. These implementation measures are not evidence of a measured frame-rate or mobile-network target.

## Texture assets

`data/artworks.ts` separates `coverImage` (the full original) from `frameImage` (the optimized 3D texture). All four originals in `public/artworks/` are retained without modification. Frame textures in `public/artworks/frames/` are WebP derivatives with no dimension over 1024 pixels.

| Artwork | Texture | Dimensions | Bytes | Conversion |
| --- | --- | --- | ---: | --- |
| TOGE TOGE | `toge-toge.webp` | 1024 × 1024 | 53,006 | Nearest-neighbor resize, lossless WebP |
| Between the lines | `portrait-study.webp` | 1024 × 576 | 29,526 | Lanczos resize, WebP quality 90 |
| Little screen, big feelings | `digital-companion.webp` | 366 × 378 | 15,152 | Original dimensions, lossless WebP |
| A character in the making | `character-sketch.webp` | 1024 × 931 | 136,000 | Transparent-margin crop, Lanczos resize, WebP quality 90 |

The character sketch derivative crops only transparent margins. Its source alpha bounds are x=560–1643 and y=618–1598; the crop retains 24 source pixels of transparent padding on every side before resizing. TOGE TOGE retains the entire source canvas, including the isolated opaque pixel at the upper right. Pixel artwork uses nearest-neighbor resizing to keep its edges crisp; the small companion is not enlarged. These assets are display derivatives, not repainted artwork.

Asset verification: SHA-256 hashes for all four public originals match the supplied files in Downloads. Sharp metadata confirms that every frame derivative is WebP and stays within the 1024-pixel limit.

## Verification status

Production build, TypeScript, and ESLint pass. Integrated browser checks verified:

- WebGL overview with all four supplied artworks, glass stairs, crystals, and particles; focus layouts at 1280×800, 390×844, and 844×390 with no page overflow.
- Direct frame selection and camera focus; drag orbit and wheel zoom preserve selection; dragging does not trigger artwork clicks; wheel input does not scroll the page; blank-space clicks return to overview.
- Previous/Next and keyboard wraparound, pause-preserving Reset, and global homepage pause without losing the embedded selection.
- Full-resolution image preview and zoom; Escape closes the preview, clears focus, and then closes the world, restoring the homepage trigger and page scrolling.
- Share-copy success, valid focus deep links, graceful overview for invalid/repeated `karya` parameters, category filtering, the regular-gallery return, and artwork detail links that close the overlay.
- The dedicated 1200×630 Open Graph image renders successfully. The 2D fallback retained focus, previews, and sharing during rendering-failure checks.

The Canvas fallback contains no effects: React Three Fiber mounts canvas fallback children even when WebGL works. Renderer context-loss listeners clean up with their Canvas, and readiness waits for loaded textures and two animation frames, including development remounts.

Device-specific FPS, touch/pinch behavior on physical devices, and 4G loading measurements have not been benchmarked. Asset dimensions and source preservation have been verified as described above.
