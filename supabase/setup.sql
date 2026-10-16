-- Run AFTER Prisma migrations and the owner seed, using the migration/database owner.
-- Keep the bucket private. If SUPABASE_STORAGE_BUCKET differs, replace 'portfolio' below.
begin;

-- These operation-aware helpers keep anonymous users from listing the bucket.
do $$ begin
  if to_regprocedure('storage.allow_any_operation(text[])') is null then
    raise exception 'Supabase Storage operation helpers are required. Update Storage before applying these policies.';
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

alter table public."PortfolioProfile" enable row level security;
alter table public."Artwork" enable row level security;
alter table public."ArtworkImage" enable row level security;
alter table public."MediaAsset" enable row level security;
alter table public."StorageCleanup" enable row level security;
alter table public."CmsRateLimit" enable row level security;
revoke all on public."PortfolioProfile", public."Artwork", public."ArtworkImage", public."MediaAsset", public."StorageCleanup", public."CmsRateLimit" from anon, authenticated;

create or replace function public.is_portfolio_owner()
returns boolean language sql stable security definer set search_path = pg_catalog
as $$ select exists (select 1 from public."PortfolioProfile" p where p.id = 'singleton' and p."authId" = auth.uid()); $$;

create or replace function public.can_read_portfolio_asset(object_name text)
returns boolean language sql stable security definer set search_path = pg_catalog
as $$
  select exists (
    select 1 from public."MediaAsset" m
    where m.validated = true and (m."storagePath" = object_name or m."framePath" = object_name)
    and (
      exists (select 1 from public."Artwork" a where a.status = 'published' and
        (a."coverPath" = m."storagePath" or a."framePath" = m."framePath" or exists (
          select 1 from public."ArtworkImage" i where i."artworkId" = a.id and i."storagePath" = m."storagePath"
        )))
      or exists (select 1 from public."PortfolioProfile" p where p.id = 'singleton' and p."avatarPath" = m."storagePath")
    )
  );
$$;

create or replace function public.can_write_portfolio_asset(object_name text)
returns boolean language sql stable security definer set search_path = pg_catalog
as $$
  select public.is_portfolio_owner() and exists (
    select 1 from public."MediaAsset" m where m."ownerId" = auth.uid() and m.validated = false
      and (m."storagePath" = object_name or m."framePath" = object_name)
  );
$$;

create or replace function public.can_delete_portfolio_asset(object_name text)
returns boolean language sql stable security definer set search_path = pg_catalog
as $$
  select public.is_portfolio_owner() and exists (
    select 1 from public."StorageCleanup" c where c."ownerId" = auth.uid() and object_name = any(c."storagePaths")
  );
$$;

revoke all on function public.is_portfolio_owner(), public.can_read_portfolio_asset(text), public.can_write_portfolio_asset(text), public.can_delete_portfolio_asset(text) from public;
grant execute on function public.can_read_portfolio_asset(text) to anon, authenticated;
grant execute on function public.is_portfolio_owner(), public.can_write_portfolio_asset(text), public.can_delete_portfolio_asset(text) to authenticated;

drop policy if exists "portfolio_public_read" on storage.objects;
create policy "portfolio_public_read" on storage.objects for select to anon, authenticated using (
  bucket_id = 'portfolio'
  and storage.allow_any_operation(array['object.sign', 'object.get_authenticated', 'object.get_authenticated_info', 'object.head_authenticated_info'])
  and public.can_read_portfolio_asset(name)
);

drop policy if exists "portfolio_owner_read" on storage.objects;
create policy "portfolio_owner_read" on storage.objects for select to authenticated using (
  bucket_id = 'portfolio' and public.is_portfolio_owner() and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "portfolio_owner_insert" on storage.objects;
create policy "portfolio_owner_insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'portfolio' and public.can_write_portfolio_asset(name)
);

drop policy if exists "portfolio_owner_update" on storage.objects;
create policy "portfolio_owner_update" on storage.objects for update to authenticated using (
  bucket_id = 'portfolio' and public.can_write_portfolio_asset(name)
) with check (
  bucket_id = 'portfolio' and public.can_write_portfolio_asset(name)
);

drop policy if exists "portfolio_owner_delete" on storage.objects;
create policy "portfolio_owner_delete" on storage.objects for delete to authenticated using (
  bucket_id = 'portfolio' and public.can_delete_portfolio_asset(name)
);

-- Published URLs are permanent, including while a formerly published work is a draft.
create or replace function public.preserve_published_artwork_url()
returns trigger language plpgsql set search_path = pg_catalog
as $$ begin
  if old."publishedAt" is not null and (new.slug <> old.slug or new."publishedAt" is distinct from old."publishedAt") then
    raise exception 'Published artwork URLs and first publication timestamps are immutable';
  end if;
  return new;
end $$;
drop trigger if exists preserve_artwork_url on public."Artwork";
create trigger preserve_artwork_url before update on public."Artwork" for each row execute function public.preserve_published_artwork_url();
commit;
