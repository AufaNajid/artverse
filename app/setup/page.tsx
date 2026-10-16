import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { hasCmsConfiguration } from "@/lib/cms/config";
import "./setup.css";

export const metadata: Metadata = { title: "Connect your studio", robots: { index: false, follow: false } };

async function ConfigurationStatus() {
  await connection();
  const ready = hasCmsConfiguration();
  return <div className={ready ? "setup-configuration is-ready" : "setup-configuration"} role="status"><i /><span>{ready ? "Configuration is present. Finish the database setup, then sign in." : "Supabase is not connected yet. Your portfolio preview remains available."}</span></div>;
}

export default function SetupPage() {
  return <main className="studio-setup">
    <header><Link className="setup-brand" href="/">ARTVERSE<span>/ OWNER SETUP</span></Link><Link href="/login">Back to sign in ↗</Link></header>
    <section className="setup-intro"><span className="setup-eyebrow">A ONE-TIME CONNECTION</span><h1>Your art.<br /><em>Your studio.</em></h1><p>Connect Supabase to manage your artwork, drafts, and profile from a private dashboard. Your existing portfolio keeps its pixel world.</p><Suspense fallback={<div className="setup-configuration">Checking configuration…</div>}><ConfigurationStatus /></Suspense></section>
    <ol className="setup-steps">
      <li><span className="setup-step-number">01</span><div><h2>Create your Supabase project</h2><p>Open <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Supabase ↗</a>, create a project, choose a region near your audience, and save the database password in your password manager.</p><p>In Authentication, disable public sign-ups. Add one owner user with an email and password, confirm the account, and copy its user UUID.</p></div></li>
      <li><span className="setup-step-number">02</span><div><h2>Add the project connection</h2><p>If you do not have an environment file yet, copy the template with the command below. If <code>.env</code> already exists, edit its missing settings without replacing it. Keep passwords and database URLs out of chat and source control.</p><pre><code>{"if (-not (Test-Path .env)) {\n  Copy-Item .env.example .env\n}"}</code></pre><dl><dt>DATABASE_URL</dt><dd>Runtime transaction-pooler URL from the project’s Connect panel. On port 6543, include <code>pgbouncer=true</code> and <code>connection_limit=3</code> in its query parameters.</dd><dt>DIRECT_URL</dt><dd>Direct or session-pooler connection for local migrations. Use the restricted app role for both URLs in production.</dd><dt>NEXT_PUBLIC_SUPABASE_URL</dt><dd>Your project URL.</dd><dt>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</dt><dd>Your publishable API key.</dd><dt>CMS_OWNER_ID</dt><dd>The confirmed owner user’s UUID.</dd></dl><p className="setup-note">Use the connection strings supplied by your project. Encode special characters in database passwords. The bucket name defaults to <code>portfolio</code>.</p></div></li>
      <li><span className="setup-step-number">03</span><div><h2>Create the database and private storage</h2><p>Run the project commands below. In the Supabase SQL Editor, run the repository’s <code>supabase/setup.sql</code> after the migrations to install the private bucket and access policies.</p><pre><code>{"npm run db:generate\nnpm run db:migrate\nnpm run db:seed"}</code></pre><p>The seed imports your four existing artworks once. Re-running it preserves artwork you have already edited.</p><p>Follow <code>supabase/runtime-role.sql</code> to create the restricted application login, then use its connection strings for the running website. Keep the migration account separate. Full instructions are in <code>docs/cms-setup.md</code>.</p></div></li>
      <li><span className="setup-step-number">04</span><div><h2>Open your private studio</h2><p>Restart the local server after adding environment settings, then sign in using the owner email and password. Save a draft, add images, and publish when you are ready. Published changes appear on the portfolio without another deployment.</p><div className="setup-actions"><Link className="setup-button" href="/login">Go to sign in →</Link><Link href="/">View the portfolio ↗</Link></div></div></li>
    </ol>
    <aside className="setup-deployment"><span className="setup-eyebrow">WHEN YOU ARE READY TO SHARE</span><h2>Use the same settings on Vercel.</h2><p>Add the environment variables to the production project, set <code>NEXT_PUBLIC_SITE_URL</code> to your domain, and apply the migration before release. The detailed installation, backup, and owner recovery guide is in <code>docs/cms-setup.md</code>.</p></aside>
    <footer><span>ONE ARTIST. A WORLD OF POSSIBILITIES.</span><a href="https://supabase.com/docs/guides/database/prisma" target="_blank" rel="noopener noreferrer">Supabase connection documentation ↗</a></footer>
  </main>;
}
