# ARTVERSE implementation notes

ARTVERSE presents woxiwaldie’s supplied artwork in a cyan floating world with pink, lime, and electric blue accents. The application uses the Next.js App Router, React, Three.js, and React Three Fiber.

## Artwork and content

`data/artworks.ts` defines titles, categories, descriptions, dimensions, gallery metadata, and detail-page text. The current artwork sources are `public/artworks/art1.png`, `art2.jpg`, `compart1.png`, and `compart2.png`. `coverImage` references these full originals; `frameImage` references optimized WebP derivatives for the exhibition.

These files are exact copies of the supplied originals. They were not resized, re-encoded, repainted, or cleaned up. All original PNG alpha channels remain intact. `compart2.png` contains transparent margins rather than a baked white background. Dimensions, alpha bounds, hashes, and source paths are recorded in `docs/artwork-prompts.md`.

Earlier generated demo PNG and WebP assets are retained with their provenance records. The current gallery does not use them.

The frame derivatives under `public/artworks/frames/` have no dimension over 1024 pixels. Pixel artwork uses nearest-neighbor resizing and lossless WebP; the small companion retains its source size. The painterly artwork uses quality-90 WebP. The character sketch derivative removes only transparent outer margins, retaining 24 source pixels of padding. Texture sizes and hash verification are recorded in `docs/exhibition.md`.

## Homepage hero world

`components/three/DreamScene.tsx` renders the floating cyan environment with Three.js through React Three Fiber. The original artwork is used as front-facing sprite textures; shallow instanced voxel extrusion adds thickness to the silhouette. This is a 2.5D presentation of the supplied artwork, not a fully modeled or rigged character.

The browser controls support orbiting, zooming, and artwork selection. Mobile uses a simpler scene and lower rendering resolution. Reduced-motion preferences pause ambient animation and use demand rendering. A static world remains available when WebGL is unsupported, rendering fails, or the context is lost.

## Explore in 3D exhibition

The exhibition is distinct from the hero’s sprite-and-voxel composition. `components/three/ExhibitionScene.tsx` arranges actual artwork textures inside a ring of blue frames, with cyan glass stairs, floating colored crystals, and square particles. Camera transitions frame a selected piece; orbit controls support drag, wheel, and pinch input. Narrow layouts use lower DPR, fewer ambient objects, and simpler glass. Continuous rendering stops when the scene is hidden, off-screen, paused, or subject to reduced motion.

`components/explore/ExploreWorld.tsx` provides the selection panel, artwork rail, Previous/Next, Pause, Reset, loading UI, and WebGL fallback. Selection shows the artwork’s title, category, description, and tags, plus a detail-page link. **View full artwork** opens a native dialog with the full original image and Fit/Zoom controls. Share copies an absolute `/3d?karya=<slug>` link, with visible manual-copy text if clipboard access fails.

The homepage’s Explore in 3D buttons open a full-screen native dialog overlay. The new feature below Selected Work introduces the exhibition in the portfolio’s existing visual theme. The gallery’s 3D view embeds the same world and filters it by category. The ordinary grid stays available. `/3d` provides a dedicated full-screen route; a valid `karya` query selects the matching piece, and route-mode selection updates that query. Route metadata, a social preview image, and the sitemap include the new exhibition page.

Left/Right keys select the previous/next artwork. Escape closes the image preview first, clears focus second, and then closes the homepage overlay or returns from the dedicated route. Keyboard controls for the embedded exhibition require focus within its interface. Reduced-motion preferences disable ambient animation and make camera focus immediate. The fallback retains artwork selection, information, preview, and sharing.

## Gallery and viewing

`components/Portfolio.tsx` provides the landing page, gallery filters, artist section, and contact controls. Artwork routes under `app/artwork/[slug]/` show the original artwork, supporting text, and image fullscreen controls. Layouts adapt to smaller screens, and reduced-motion styles also apply to the interface.

To change the public Instagram destination, edit the Instagram URL in `components/Portfolio.tsx`. Gallery labels and titles live in `data/artworks.ts`.

## Contact behavior

The project-brief composer formats the visitor’s input as a draft and copies it to the clipboard. The visitor then opens Instagram and sends the message to @woxiwaldie themselves. If clipboard access is unavailable, the interface displays the prepared text for manual copying. There is no email backend, stored submission, or automatic message transmission.

## Local commands and production metadata

```sh
npm install
npm run dev
npm run lint
npm run build
npm run start
```

The development server is available at `http://localhost:3000`. Run `build` before `start`.

Optional `NEXT_PUBLIC_SITE_URL` supplies the public origin for production metadata. Configure it for the eventual hosting URL before a production build. No deployment has been performed.

## Verification limits

Production build, TypeScript, and ESLint pass. Browser checks verified WebGL rendering, artwork focus and camera transitions, drag orbit, wheel zoom without page scrolling, desktop/mobile/landscape HUD layouts, and navigation between the exhibition and portfolio. Physical-device pinch input, device FPS targets, and 4G loading measurements remain unbenchmarked. See `docs/exhibition.md` for the full verification record.
