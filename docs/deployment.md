# Public portfolio

Share this address: **https://woxiwaldie-portfolio.vercel.app**

The portfolio was published to the owner's Vercel project `woxiwaldie-portfolio` on 15 October 2026. The existing homepage, artwork detail routes, and 3D exhibition are live. No extra portfolio page was added.

The production deployment is `dpl_9iUJAr7Smv6MABuHXmF3Sb66CB3d`. Vercel reports `READY`. Use the stable production address above when sharing; Vercel's individual deployment URL may require Vercel authentication.

## Configuration

- Node.js 24; `npm ci`; `npm run build` generates Prisma Client and builds Next.js 16.4.
- Production `DATABASE_URL` and `DIRECT_URL` both use the restricted `portfolio_app` login.
- The privileged setup connection remains local. Environment values were passed through stdin and stored in Vercel settings after explicit owner approval; local `.env*` files were excluded from the source upload.
- Private Storage policies are installed, with no older policies present to override them. The runtime role has CMS read/write access, no extra role memberships, no public-schema CREATE privilege, and no Auth/Storage-schema access.
- Canonical metadata and the sitemap use Vercel's production domain automatically unless `NEXT_PUBLIC_SITE_URL` is explicitly configured.
- Vercel is linked to the existing GitHub repository. This release was uploaded from the local working tree; retain and commit the current application changes before relying on future Git-triggered releases.

## Verified on the public site

- Homepage loads the seeded artist profile and artwork from Supabase.
- The 3D gallery renders all four supplied artworks.
- The canonical URL is the stable public production domain.
- Unauthenticated owner operations reject access with `401`; cross-origin writes reject access with `403`.
- Protected CMS media is excluded from the public image optimizer.

[Browser proof](previews/public-portfolio.png)

Authenticated owner CRUD and new-file upload still need a real owner sign-in check. Physical-device FPS, touch behavior, 4G performance, and production Core Web Vitals have not been measured.
