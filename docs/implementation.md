# ARTVERSE implementation notes

ARTVERSE presents woxiwaldie’s supplied artwork in a cyan floating world with pink, lime, and electric blue accents. The application uses the Next.js App Router, React, Three.js, and React Three Fiber.

## Artwork and content

`data/artworks.ts` defines titles, categories, descriptions, dimensions, gallery metadata, and detail-page text. The current artwork sources are `public/artworks/art1.png`, `art2.jpg`, `compart1.png`, and `compart2.png`.

These files are exact copies of the supplied originals. They were not resized, re-encoded, repainted, or cleaned up. All original PNG alpha channels remain intact. `compart2.png` contains transparent margins rather than a baked white background. Dimensions, alpha bounds, hashes, and source paths are recorded in `docs/artwork-prompts.md`.

Earlier generated demo PNG and WebP assets are retained with their provenance records. The current gallery does not use them.

## Interactive world

`components/three/DreamScene.tsx` renders the floating cyan environment with Three.js through React Three Fiber. The original artwork is used as front-facing sprite textures; shallow instanced voxel extrusion adds thickness to the silhouette. This is a 2.5D presentation of the supplied artwork, not a fully modeled or rigged character.

The browser controls support orbiting, zooming, and artwork selection. Mobile uses a simpler scene and lower rendering resolution. Reduced-motion preferences pause ambient animation and use demand rendering. A static world remains available when WebGL is unsupported, rendering fails, or the context is lost.

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

