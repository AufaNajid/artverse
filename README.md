# ARTVERSE — woxiwaldie

Live portfolio: [woxiwaldie-portfolio.vercel.app](https://woxiwaldie-portfolio.vercel.app). Share this address with visitors. See `docs/deployment.md` for deployment and verification details.

A pixel-art portfolio for woxiwaldie, built with Next.js, React, Three.js, and React Three Fiber. A private owner studio adds Supabase Auth, PostgreSQL through Prisma, validated image uploads, draft/publish controls, and profile editing while preserving the public portfolio and 3D exhibition.

## Run locally

```sh
npm install
npm run dev
```

Use Node.js 24. Open [localhost:3000](http://localhost:3000), [owner sign-in](http://localhost:3000/login), or the [setup guide](http://localhost:3000/setup). With no CMS connection configured, the public site shows the original four works and sign-in explains the required setup. It does not provide a mock owner session.

```sh
npm run lint
npm run test:cms
npm run build
npm run start
```

`start` serves the production build after `build` succeeds.

## Connect and update the portfolio

- Follow `docs/cms-setup.md` to create the Supabase owner, configure `.env`, apply the migration, seed the existing artwork, and install private Storage policies.
- Run `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed` during installation. The seed preserves later edits and deletions on repeat runs.
- Use `/dashboard` to create drafts, upload covers/gallery images, arrange artwork and images, publish, and edit the artist profile. See `docs/owner-guide.md`.
- Connected public pages read only published database records at request time. New content does not require source edits or another build.
- `data/artworks.ts` and `data/profile.ts` remain bootstrap/connection-free preview data, rather than the connected site's content source.
- Original files `art1.png`, `art2.jpg`, `compart1.png`, and `compart2.png` are intact in `public/artworks/`, including PNG transparency. See `docs/artwork-prompts.md` for provenance.
- Set optional `NEXT_PUBLIC_SITE_URL` to the public site origin for production metadata.

The homepage hero uses original sprite textures with shallow instanced voxel extrusion. It provides a 2.5D presentation of the artwork; the characters are not fully modeled or rigged. The separate **Explore in 3D** exhibition presents the supplied artwork inside blue frames. Open it from the homepage hero, the Selected Work feature, the gallery’s 3D view, or `/3d`. Share links such as `/3d?karya=toge-toge` open directly on a piece.

Drag to orbit, scroll or pinch to zoom, and click a frame to focus. Previous/Next buttons and Left/Right keys cycle through pieces. The selection panel opens a full-resolution image preview and links to the artwork’s story. Escape steps back through preview, artwork focus, and the full-screen world. Pause and Reset are available; reduced-motion preferences stop ambient animation. A 2D fallback keeps selection, preview, and sharing available when WebGL cannot render.

All supplied originals are intact. The exhibition uses optimized WebP derivatives without replacing the full images used by artwork pages and previews. See `docs/exhibition.md` for texture sizes, source verification, integration details, and controls.

The brief composer copies a draft to the visitor’s clipboard so they can send it on Instagram. There is no email backend or automatic message transmission.

Earlier generated demo assets remain in `public/artworks/` for provenance and are not used by the current portfolio. See `docs/implementation.md` for implementation notes.

CMS validation, API authorization, build, and browser verification are recorded in `docs/cms-verification.md`. Actual Supabase account login, database mutations, Storage policies, and publication must be tested after project setup; no cloud credentials or deployment have been supplied. Physical-device pinch input, device FPS, and 4G performance remain unbenchmarked.
