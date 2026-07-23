-- À exécuter dans Supabase > SQL Editor.
create extension if not exists pgcrypto;
create sequence if not exists public.report_reference_seq start 1;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reference text unique default (
    'RT-' || extract(year from now())::text || '-' ||
    lpad(nextval('public.report_reference_seq')::text, 4, '0')
  ),
  created_at timestamptz not null default now(),
  reporter_name text not null,
  company text not null,
  client_name text not null,
  site_name text not null,
  location_detail text,
  event_type text not null,
  who text,
  observed_at timestamptz,
  what text not null,
  how text,
  photo_forbidden text,
  severity integer not null check (severity between 1 and 4),
  probability integer not null check (probability between 1 and 4),
  priority integer not null check (priority between 1 and 3),
  immediate_actions jsonb default '[]'::jsonb,
  action_details text not null,
  person_informed text,
  danger_present boolean not null,
  improvement_proposal text,
  photo_paths jsonb default '[]'::jsonb,
  status text not null default 'Nouvelle'
);

alter table public.reports enable row level security;

-- Première version : dépôt public de remontées.
create policy "public_can_insert_reports" on public.reports
for insert to anon with check (true);

-- L'espace QSE nécessite une authentification Supabase avant la diffusion réelle.
-- Ne pas créer une règle de lecture publique des remontées.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public_can_upload_report_photos" on storage.objects
for insert to anon with check (bucket_id = 'report-photos');
