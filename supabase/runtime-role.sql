-- First create the role in the Supabase SQL editor with your own strong password:
-- CREATE ROLE portfolio_app LOGIN PASSWORD 'REPLACE_WITH_A_UNIQUE_PASSWORD' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
-- Do not save a real password in this file. Production runtime uses this role for BOTH URLs.
-- Supply elevated DIRECT_URL migration credentials only to a trusted local/CI migration job.
begin;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'portfolio_app') then
    raise exception 'Create the portfolio_app role with a strong private password before running runtime-role.sql';
  end if;
  if exists (select 1 from pg_roles where rolname = 'portfolio_app' and (rolsuper or rolbypassrls or rolcreatedb or rolcreaterole or rolreplication or rolinherit)) then
    raise exception 'portfolio_app must be a non-inheriting role without elevated privileges';
  end if;
end $$;
revoke create on schema public from portfolio_app;
grant usage on schema public to portfolio_app;
grant select, insert, update, delete on public."PortfolioProfile", public."Artwork", public."ArtworkImage", public."MediaAsset", public."StorageCleanup", public."CmsRateLimit" to portfolio_app;
-- The backend is the sole holder of these credentials and verifies the Supabase owner on every private request.
-- Data API roles anon/authenticated retain no table access. No auth/storage schema privileges are granted.
drop policy if exists portfolio_runtime on public."PortfolioProfile";
create policy portfolio_runtime on public."PortfolioProfile" to portfolio_app using (true) with check (true);
drop policy if exists portfolio_runtime on public."Artwork";
create policy portfolio_runtime on public."Artwork" to portfolio_app using (true) with check (true);
drop policy if exists portfolio_runtime on public."ArtworkImage";
create policy portfolio_runtime on public."ArtworkImage" to portfolio_app using (true) with check (true);
drop policy if exists portfolio_runtime on public."MediaAsset";
create policy portfolio_runtime on public."MediaAsset" to portfolio_app using (true) with check (true);
drop policy if exists portfolio_runtime on public."StorageCleanup";
create policy portfolio_runtime on public."StorageCleanup" to portfolio_app using (true) with check (true);
drop policy if exists portfolio_runtime on public."CmsRateLimit";
create policy portfolio_runtime on public."CmsRateLimit" to portfolio_app using (true) with check (true);
commit;
