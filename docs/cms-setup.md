# Connect the owner studio

This guide connects the existing ARTVERSE portfolio to Supabase so its owner can manage artwork without editing source code or rebuilding the website. The application code is included; a real Supabase project and owner account must be supplied before authenticated publishing can be activated and tested.

The public portfolio shows the original four pieces only while every required CMS connection setting is absent. Once any CMS connection setting is supplied, incomplete configuration fails closed. A configured database failure never silently restores deleted or unpublished seed artwork.

## 1 Create a Supabase project and owner

1. Create a project at [Supabase](https://supabase.com/dashboard), select the region you want, and keep the database password in a password manager.
2. In Authentication configuration, disable **Allow new users to sign up**. This application has no public registration route.
3. In Authentication → Users, add the single owner with an email and a strong password. Confirm the account when provisioning it.
4. Copy that user's UUID into `CMS_OWNER_ID`. This UUID is the server-side authorization boundary. Another authenticated Supabase user does not become a portfolio owner.
5. Configure the Supabase Auth Site URL for your local origin while developing, then your public origin for production. Email/password sign-in does not require a public registration or OAuth callback.

Use your own email; the application does not invent an owner email or password. The public contact email in Profile settings is a separate, optional field.

## 2 Add environment settings locally

From `C:\Users\LENOVO\artverse` in PowerShell:

```powershell
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}
```

Open `.env` locally and fill in the blank values. If the file already exists, preserve its settings rather than replacing it with the template. Do not post database URLs, passwords, or keys in chat. `.env` is excluded from Git.

| Setting | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API/project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project API publishable key; do not use a service-role key |
| `CMS_OWNER_ID` | UUID of the user provisioned above |
| `DATABASE_URL` | Runtime PostgreSQL connection, normally transaction pooler port 6543 for Vercel |
| `DIRECT_URL` | Trusted migration/initial seed connection, using the direct endpoint or session pooler port 5432 |
| `SUPABASE_STORAGE_BUCKET` | Keep `portfolio` unless you also update the bucket name in the setup SQL |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for normal development, or the actual public domain in production |

Use the project's **Connect** panel for its exact connection strings. If direct IPv6 connectivity is unavailable, use the session pooler for migrations. For this project's Prisma 6 runtime transaction connection, include `pgbouncer=true` and a small `connection_limit` in the connection parameters. URL-encode special characters in passwords and preserve the provider's TLS settings. See [Supabase's Prisma connection guide](https://supabase.com/docs/guides/database/prisma).

For a transaction-pooler URL on port `6543`, append `?pgbouncer=true&connection_limit=3` if there is no query string, or `&pgbouncer=true&connection_limit=3` if other parameters are already present. A PostgreSQL `42P05` prepared-statement conflict usually indicates that this pooler compatibility setting is missing. Keep `DIRECT_URL` on the direct or session connection for migrations.

Use a migration account for `DIRECT_URL` only in a trusted local or CI setup process. Both migrations and the seed use this setup connection; the seed falls back to `DATABASE_URL` only when `DIRECT_URL` is absent. After setup, use the restricted application role described by `supabase/runtime-role.sql`. In the production website environment, set **both** `DATABASE_URL` and `DIRECT_URL` to restricted-role connections. Keeping a privileged migration URL in the same running process would undo that separation. The runtime role needs only the CMS tables; it does not need access to Supabase Auth tables or direct Storage administration.

## 3 Create the schema and import your portfolio

Install the dependencies, generate the database client, apply the migration, and import the initial content:

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed imports `toge-toge`, `portrait-study`, `digital-companion`, and `character-sketch` as published artwork with their original metadata and local assets. It provisions the profile for `CMS_OWNER_ID`. Re-running the seed must not overwrite edits or create duplicate artwork. Do not delete published records merely to run the seed again.

Seed failures print a specific safe category such as `POOLER_CONFIGURATION`, `MIGRATIONS_REQUIRED`, `DATABASE_PERMISSIONS`, or `TRANSACTION_TIMEOUT`. Connection strings and raw database messages are withheld. The initial import runs atomically with a 60-second transaction timeout; a failed import can be retried after fixing its reported setup issue.

The original local images can remain during the transition, as allowed by the PRD. New uploads go to Storage. Existing local image files are not deleted by CMS artwork deletion.

## 4 Install private Storage policies

After the migration and seed, run `supabase/setup.sql` in the Supabase SQL Editor. Then create the restricted `portfolio_app` login using the instruction at the top of `supabase/runtime-role.sql`, choosing a strong password locally, and run the rest of that file. Switch the application connection to this restricted account only after those policies and grants exist. Keep the migration connection separate for future maintenance.

The SQL creates or configures the `portfolio` bucket as **private**, permits only the registered owner to upload and manage owner paths, and permits anonymous reads only for files referenced by published artwork or the public avatar. Anonymous bucket listing is excluded. Keep the bucket's MIME allowlist and 10 MB size restriction enabled. Do not switch the bucket to public to resolve a policy error; [public buckets bypass file-read access checks](https://supabase.com/docs/guides/storage/buckets/fundamentals).

Uploads use three stages:

1. The authenticated server issues a token for a generated owner path.
2. The browser uploads the file directly into private Storage.
3. The server downloads and validates the actual file, checks JPEG/PNG/WebP signatures and decoded dimensions, and generates a WebP frame before making the asset available to the editor.

A pending or invalid upload cannot be published. This direct flow also avoids sending a 10 MB file through Vercel's 4.5 MB function payload limit. Public media URLs remain stable application URLs; after checking publication or owner access, the server redirects to a short-lived Storage URL. See [Vercel's request and response limits](https://vercel.com/docs/functions/limitations).

## 5 Sign in and verify the owner workflow

Restart the development server after adding or changing environment values:

```powershell
npm run dev
```

Open `/login`, sign in as the owner, and verify this sequence:

1. The dashboard shows four published artworks and no duplicate seed records.
2. Create a draft with a title and category; it stays absent from the public API, gallery, detail route, and 3D gallery.
3. Upload a cover and gallery images. Use only JPEG, PNG, or WebP, at most 10 MB per file and 15 images total including the cover.
4. Add cover alt text, arrange gallery images, and publish.
5. Open a separate anonymous browser session. Verify the new card, artwork detail, gallery order, and 3D frame without rebuilding.
6. Edit the title, image order, metadata, and profile. Verify the public changes.
7. Unpublish the test artwork. Confirm its public detail and media endpoints no longer grant access.
8. Delete a disposable test artwork using the confirmation dialog. Confirm the record is removed and any failed Storage deletions remain queued for retry.
9. Sign out. Confirm dashboard routes redirect to sign-in and private API operations reject access.

The URL slug locks after the first publication, including after an artwork returns to draft. This keeps already shared URLs stable. Titles and other metadata remain editable.

## 6 Deploy to Vercel

Use Node.js 24, the runtime used for local verification. Import the repository as a Next.js project and supply environment values through Vercel's settings. Use restricted-role database connections for both URL variables in the running website; supply the privileged migration URL only to the separate migration job. Set `NEXT_PUBLIC_SITE_URL` and Supabase's Site URL to the final domain. Use separate Supabase projects or credentials for preview and production environments if you need isolated content.

Run the migration against the intended environment before the first release. `npm run build` generates the Prisma client and builds Next.js; it does not change the database or seed content automatically. Do not run a schema reset on an existing portfolio.

```powershell
npm run test:cms
npm run lint
npm run build
```

No public deployment or paid Supabase/Vercel resource is created automatically by this repository setup. Publishing content after deployment uses the database directly and does not require another build.

## Owner access recovery

- Keep project-owner access, the database password, and an inventory of environment settings in a password manager.
- If the portfolio password is lost, ask the Supabase project administrator to reset that existing Auth user's password through a trusted administrative workflow. Preserve the user's UUID so it continues to match `CMS_OWNER_ID` and the profile.
- An administrator can use Supabase's supported [updateUserById password operation](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid) from a trusted server or administrative tool. That operation requires administrative credentials; never add those credentials to browser code or a `NEXT_PUBLIC_` variable.
- After a suspected compromise, revoke affected sessions through Supabase, change the password, and review the owner UUID and Storage access policies. Rotating the database password also requires updating Vercel/local connection strings.
- Do not create a public signup endpoint, disable owner verification, or create a replacement owner UUID as a password-recovery shortcut. An intentional ownership transfer requires coordinated changes to configuration, profile ownership, and storage paths.

## Backup and image recovery

Database records and image files need separate backups. Before production release, choose a retention period that fits the portfolio and configure regular database backups or exports plus a private copy of the Storage objects. Keep an inventory of object paths with the database backup and test restoration into a separate project before relying on it.

Artwork deletion removes database references transactionally and queues original/frame file deletion. Failed deletions remain in `StorageCleanup` for owner-authorized retry. Use **Dashboard → Maintenance → Retry image cleanup** to retry queued removals and prune unused uploads older than 24 hours. Active images are excluded from this cleanup. Deleting an artwork is not an undo feature. Recover accidentally deleted work from the matching database and Storage backup.

Cleanup jobs wait 2 hours and 5 minutes after removal before deleting physical objects. Supabase signed upload tokens last 2 hours, so this delay prevents a still-valid token from recreating an untracked object after deletion. Metadata access is revoked immediately. A pending cleanup job during this waiting period is expected; use Maintenance again afterward. See [Supabase's signed upload URL reference](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl).

New uploaded assets are private until published. A Storage link already issued to a visitor remains usable for up to 60 seconds after unpublishing; cached copies already downloaded by a visitor cannot be recalled. The original four legacy files under `/artworks/` were public before this CMS and remain public during the migration transition, even when their artwork cards/pages are unpublished. New CMS images are excluded from the Next image optimizer cache.

## Verification boundary

The local test suite covers validation and authorization barriers without using real account secrets. Complete the connected owner workflow above once this Supabase project is configured. Until then, successful real-account sign-in, database mutations, Storage policies, and publication against the hosted service are not certified by an unconfigured local preview. Core Web Vitals, physical-device touch behavior, and production network performance should be measured after deployment.
