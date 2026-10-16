# ARTVERSE implementation notes

ARTVERSE presents woxiwaldie’s supplied artwork in a cyan floating world with pink, lime, and electric blue accents. The application uses the Next.js App Router, React, Three.js, and React Three Fiber.

## Artwork and content

The connected portfolio reads published PostgreSQL records through `lib/cms/public.ts`; data is requested at runtime behind Suspense boundaries. `data/artworks.ts` and `data/profile.ts` supply the one-time seed and the explicit preview when no CMS configuration exists. Partial configuration and database failures never silently return preview content. The initial artwork sources remain `public/artworks/art1.png`, `art2.jpg`, `compart1.png`, and `compart2.png`. `coverImage` references full originals; `frameImage` references optimized WebP derivatives.

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

The owner updates artwork, gallery order, and profile information through the dashboard. The public UI receives published artwork and profile props, including empty-collection handling. The hero, 3D gallery, metadata, and sitemap do not resurrect unpublished seed records. Ordered process/gallery images use lightweight previews and open full originals on demand.

## Owner CMS and storage

The private studio uses verified Supabase `getUser()` identity and a configured owner UUID. No public registration is provided. Cookie-authenticated mutations require matching Origin/Host and reject cross-site requests. Login/upload throttles persist in PostgreSQL. Zod validates metadata; publication requires a title, fixed category, cover and alt text. A slug locks after its first publication, including after unpublishing.

The Prisma migration defines artwork, image, profile, tracked media, cleanup queue, and rate-limit tables. Database constraints reinforce publication requirements; row-level policies deny direct anonymous/authenticated Data API access. A separate runtime role has only CMS table permissions. Private Storage policies expose only published references and the public avatar; owner paths remain private otherwise.

Signed direct uploads support JPEG/PNG/WebP up to 10 MB and 15 referenced images including the cover. Uploaded bytes are decoded and checked before validation; 1024-pixel WebP derivatives feed public previews and 3D frames. This avoids Vercel's function payload limit. Stable `/api/media/[id]` URLs authorize each request, then redirect to a short-lived signed Storage URL. Protected media cannot enter the public Next image cache. Links already issued remain valid for 60 seconds; legacy local files remain public as documented in `docs/cms-setup.md`.

Artwork changes and deletions use database transactions; failed object deletion remains queued for owner-authorized retry. Dashboard Maintenance retries queued cleanup and expires unused uploads. Owner installation, usage, backup, and access recovery are documented in `docs/cms-setup.md` and `docs/owner-guide.md`.

## Contact behavior

The project-brief composer formats the visitor’s input as a draft and copies it to the clipboard. The visitor then opens Instagram and sends the message to @woxiwaldie themselves. If clipboard access is unavailable, the interface displays the prepared text for manual copying. There is no email backend, stored submission, or automatic message transmission.

## Local commands and production metadata

```sh
npm install
npm run dev
npm run lint
npm run test:cms
npm run build
npm run start
```

The development server is available at `http://localhost:3000`. Run `build` before `start`.

Optional `NEXT_PUBLIC_SITE_URL` supplies an explicit public origin for production metadata. Without it, Vercel's production domain is used automatically. The live site is https://woxiwaldie-portfolio.vercel.app; deployment details are in `docs/deployment.md`.

## Verification limits

Earlier exhibition browser checks are recorded in `docs/exhibition.md`. Current CMS verification and remaining Supabase activation steps are recorded in `docs/cms-verification.md`. Physical-device pinch input, device FPS targets, and 4G loading measurements remain unbenchmarked.
