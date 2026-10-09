# ARTVERSE — woxiwaldie

A pixel-art portfolio for woxiwaldie, built with Next.js, React, Three.js, and React Three Fiber. The cyan floating world presents original character artwork alongside a filterable gallery, artwork detail pages, and an Instagram contact flow.

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
- Update the Instagram URL and artist copy in `components/Portfolio.tsx`.
- Original files `art1.png`, `art2.jpg`, `compart1.png`, and `compart2.png` are intact in `public/artworks/`, including PNG transparency. See `docs/artwork-prompts.md` for provenance.
- Set optional `NEXT_PUBLIC_SITE_URL` to the public site origin for production metadata.

The 3D scene uses original sprite textures with shallow instanced voxel extrusion. It provides a 2.5D presentation of the artwork; the characters are not fully modeled or rigged. Visitors can orbit and zoom, select artworks, and view images fullscreen. The site supports mobile layouts, reduced motion, and a static fallback when WebGL is unavailable.

The brief composer copies a draft to the visitor’s clipboard so they can send it on Instagram. There is no email backend or automatic message transmission.

Earlier generated demo assets remain in `public/artworks/` for provenance and are not used by the current portfolio. No deployment has been performed. See `docs/implementation.md` for implementation notes.
