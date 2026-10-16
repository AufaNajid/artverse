# CMS verification — 15 October 2026

The owner CMS is integrated with the portfolio and exhibition. Connected publishing still needs the confirmed Supabase owner and the remaining setup below. No successful live-owner CRUD or Storage end-to-end run is claimed.

## Passed locally

- `npm run build`: Prisma Client 6.19.3 generation, Next.js 16.4 compilation, TypeScript, and production page generation pass. Public data, sign-in configuration, and dashboard authorization are requested at runtime behind Suspense.
- `npm run lint`: passes. Targeted ESLint also passes after the final setup/help edits.
- `npm run db:validate`: schema is valid. This check does not apply migrations.
- `npm run test:cms`: **13 tests pass**, covering required metadata, strict fields, publication checks, supported MIME/signatures, 10 MB file limits, the shared 15-image limit, owner paths, partial configuration, same-origin enforcement (including Next localhost normalization), bounded JSON streaming, and delayed cleanup beyond upload-token expiry.
- `node tests/cms/http-probe.mjs http://127.0.0.1:3001`: all checks pass against the configured production server without an owner session. Twelve private operations reject access with `401`, forged owner headers/cookies do not grant access, cross-origin writes return `403`, and protected media is excluded from the public Next image optimizer (`400`).
- The same HTTP probe with `--allow-unconfigured` passes against a separate production preview with connection variables cleared only in that process. Private/public CMS APIs report setup required (`503`); public pages may explicitly show the original four-piece preview.
- Browser verification: dashboard redirects to sign-in; sign-in and setup fit 390-pixel mobile and 1440-pixel desktop layouts. The connection-free portfolio, artwork detail, exhibition overlay, artwork selection, full-image preview/return, and shared portrait selection route render successfully.
- The production dependency audit (`npm audit --omit=dev`) reports **zero known vulnerabilities**. Prisma's configuration merge path was checked after upgrading to 6.19.3 and overriding its vulnerable deepmerge-ts dependency to 8.0.2.
- `git diff --check` passes. `.env` is ignored; the empty `.env.example` remains available. Real local settings were preserved.

Browser proof: [integrated exhibition](previews/cms-exhibition.png), [owner setup](previews/cms-setup.png).

## Initial connected setup status (before seed repair)

A read-only database check reached the supplied project. The initial `20261015000000_artist_cms` migration exists and its stored checksum matches this repository. No hosted records, roles, policies, or objects were changed during these checks.

At the time of verification:

- The owner confirmed that the Supabase Auth owner user has **not yet been created/confirmed**. Create it first and replace `CMS_OWNER_ID` with that exact UUID.
- The portfolio profile and initial artwork have not been seeded; the database contains zero artwork records.
- The new `20261015010000_cleanup_upload_tokens` migration is pending. Run `npm run db:migrate` using a trusted migration connection before enabling uploads.
- The runtime connection is not using the restricted `portfolio_app` role. Install the private Storage policies and runtime-role grants from the setup guide, then switch both production URL variables to that role.
- The supplied runtime connection produced a PostgreSQL `42P05` prepared-statement conflict. The read-only check succeeds with pooler compatibility enabled. Add `pgbouncer=true` and a small `connection_limit` to the port-6543 transaction-pooler URL as described in the setup guide.

Follow [cms-setup.md](cms-setup.md) in order. After the owner exists, apply the pending migration, seed the four original pieces, install the Storage and restricted-role SQL, restart the site, and complete the documented owner workflow. The migration history is preserved; no reset is required.

## Seed repair and successful initialization

The reported seed failure was reproduced as a prepared-statement conflict on the port-6543 transaction-pooler connection. `pgbouncer=true` was missing. The local runtime connection was corrected, and the seed now uses `DIRECT_URL` for trusted setup, allows a 60-second atomic import, and reports actionable error categories without printing raw database errors or credentials.

The configured owner Auth account was confirmed to exist, and the cleanup migration was confirmed applied. `npm run db:seed` then completed successfully. Read-back through both the runtime and setup connections confirms a matching owner profile and exactly four artworks. The connected homepage loads after retrying its earlier error state.

A second seed run reports that the portfolio is already initialized and preserves existing edits, drafts, and deletions. A fresh browser request loads the connected homepage and artwork cards. [Browser proof of the repaired gallery](previews/cms-seed-repaired.png).

The CMS test suite now contains **15 passing tests**, including diagnostics for the seed failure and checks that raw secret-bearing errors are withheld. Scoped ESLint and TypeScript checks pass for this repair. Storage permissions, the restricted runtime role, and authenticated owner CRUD still require their separate connected checks; a successful seed does not certify those flows.

## Remaining verification

Real-account sign-in/sign-out, owner create/edit/delete, direct upload/finalize, bucket RLS, draft isolation, publication without rebuilding, gallery ordering, live profile edits, and cleanup retries must be tested against the completed Supabase setup. No authentication bypass or fake owner session was added to substitute for these checks.

Storage download links expire after 60 seconds; already downloaded copies cannot be recalled. Cleanup waits at least 2 hours and 5 minutes so an outstanding upload token cannot recreate an untracked object. Original local artwork files remain public during the PRD's migration transition.

The full `npm audit` still reports five high development-only entries in the existing Next ESLint → fast-glob → micromatch → braces chain. Its suggested forced fix downgrades Next's lint configuration to 14.x, so it was not applied to this Next 16 project. These entries are absent from the production audit.

The site is now deployed; see `docs/deployment.md`. Production Core Web Vitals, physical-device input/FPS, and 4G measurements remain unverified.

## Preparation for a public portfolio link

The Vercel project `woxiwaldie-portfolio` has been created under the owner's signed-in account. A `.vercelignore` excludes local environment files, Git state, generated output, and setup utilities from the source upload. `vercel.json` preserves the Prisma generation/build command and Node.js 24 remains the configured runtime.

Private Storage policies have now been installed. No older Storage policies were present to override them. A new restricted `portfolio_app` role was provisioned and the local runtime connection was switched to it; trusted `DIRECT_URL` remains separate for local setup. A live check confirms CMS read/write access, no elevated role membership, no public-schema CREATE permission, and no Auth/Storage-schema access. The four published artworks remain intact.

The final local Next.js production build and TypeScript check pass. Local Prisma regeneration is blocked while the running development server holds the Windows engine DLL, so this check used the current generated client through `npx next build`; the clean hosting build will run `npm run build` normally.

The owner explicitly approved sending the restricted connection and Supabase settings to Vercel. They were configured and the production deployment completed successfully at https://woxiwaldie-portfolio.vercel.app. The privileged setup connection was excluded. Canonical links resolve to the public production domain.

Live browser checks confirm the homepage and 3D gallery load all four artworks. The full HTTP authorization probe passes against the public domain without a Vercel login or owner session. [Public browser proof](previews/public-portfolio.png).
