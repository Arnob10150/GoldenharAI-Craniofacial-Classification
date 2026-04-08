create extension if not exists pgcrypto;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

create or replace function public.is_chw()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'chw', false);
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('parent', 'doctor', 'chw', 'admin')),
  institution text,
  district text,
  specialty text,
  language_pref text not null default 'en',
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  dob date not null,
  sex text not null check (sex in ('male', 'female')),
  assigned_doctor uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  doctor_id uuid references public.profiles(id),
  image_url text,
  classification text check (classification in ('positive', 'negative', 'inconclusive')),
  confidence double precision,
  severity text check (severity in ('mild', 'moderate', 'severe')),
  variant text check (variant in ('unilateral_left', 'unilateral_right', 'bilateral')),
  xai_data jsonb not null default '[]'::jsonb,
  segmentation_data jsonb not null default '[]'::jsonb,
  comorbidity_flags jsonb not null default '[]'::jsonb,
  surgical_windows jsonb not null default '[]'::jsonb,
  care_pathway jsonb not null default '[]'::jsonb,
  raw_inference_response jsonb not null default '{}'::jsonb,
  doctor_notes text,
  care_pathway_notes text,
  icd10_codes text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  from_doctor uuid not null references public.profiles(id),
  to_doctor uuid not null references public.profiles(id),
  specialty text not null,
  urgency text not null check (urgency in ('routine', 'urgent', 'emergency')),
  status text not null check (status in ('sent', 'accepted', 'booked', 'completed')),
  appointment_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  language text not null default 'en',
  replies_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text,
  message text not null,
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create or replace function public.child_visible_to_user(child_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.children c
    where c.id = child_uuid
      and (
        c.parent_id = auth.uid()
        or c.assigned_doctor = auth.uid()
        or public.is_admin()
        or public.is_chw()
      )
  );
$$;

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.scans enable row level security;
alter table public.referrals enable row level security;
alter table public.posts enable row level security;
alter table public.post_replies enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_authenticated" on public.profiles
for select to authenticated
using (true);

create policy "profiles_insert_self" on public.profiles
for insert to authenticated
with check (id = auth.uid() or public.is_admin());

create policy "profiles_update_self_or_admin" on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "children_select_visible" on public.children
for select to authenticated
using (
  parent_id = auth.uid()
  or assigned_doctor = auth.uid()
  or public.is_admin()
  or public.is_chw()
);

create policy "children_insert_role_aware" on public.children
for insert to authenticated
with check (
  parent_id = auth.uid()
  or public.current_role() in ('doctor', 'chw', 'admin')
);

create policy "children_update_visible" on public.children
for update to authenticated
using (
  parent_id = auth.uid()
  or assigned_doctor = auth.uid()
  or public.is_admin()
  or public.is_chw()
)
with check (
  parent_id = auth.uid()
  or assigned_doctor = auth.uid()
  or public.is_admin()
  or public.is_chw()
);

create policy "children_delete_visible" on public.children
for delete to authenticated
using (
  parent_id = auth.uid()
  or assigned_doctor = auth.uid()
  or public.is_admin()
  or public.is_chw()
);

create policy "scans_select_visible" on public.scans
for select to authenticated
using (
  public.child_visible_to_user(child_id)
  or doctor_id = auth.uid()
  or public.is_admin()
  or public.is_chw()
);

create policy "scans_insert_visible" on public.scans
for insert to authenticated
with check (
  public.child_visible_to_user(child_id)
  or doctor_id = auth.uid()
  or public.current_role() in ('doctor', 'chw', 'admin')
);

create policy "scans_update_clinical" on public.scans
for update to authenticated
using (
  doctor_id = auth.uid()
  or public.is_admin()
  or public.is_chw()
)
with check (
  doctor_id = auth.uid()
  or public.is_admin()
  or public.is_chw()
);

create policy "scans_delete_visible" on public.scans
for delete to authenticated
using (
  public.child_visible_to_user(child_id)
  or doctor_id = auth.uid()
  or public.is_admin()
  or public.is_chw()
);

create policy "referrals_select_visible" on public.referrals
for select to authenticated
using (
  from_doctor = auth.uid()
  or to_doctor = auth.uid()
  or exists (
    select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()
  )
  or public.is_admin()
  or public.is_chw()
);

create policy "referrals_insert_sender" on public.referrals
for insert to authenticated
with check (
  from_doctor = auth.uid()
  or public.is_admin()
  or public.is_chw()
);

create policy "referrals_update_participants" on public.referrals
for update to authenticated
using (
  from_doctor = auth.uid()
  or to_doctor = auth.uid()
  or public.is_admin()
  or public.is_chw()
)
with check (
  from_doctor = auth.uid()
  or to_doctor = auth.uid()
  or public.is_admin()
  or public.is_chw()
);

create policy "referrals_delete_visible" on public.referrals
for delete to authenticated
using (
  from_doctor = auth.uid()
  or to_doctor = auth.uid()
  or exists (
    select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()
  )
  or public.is_admin()
  or public.is_chw()
);

create policy "posts_select_authenticated" on public.posts
for select to authenticated
using (true);

create policy "posts_insert_authenticated" on public.posts
for insert to authenticated
with check (author_id = auth.uid() or public.is_admin() or public.is_chw() or public.current_role() in ('parent', 'doctor'));

create policy "posts_update_owner_or_admin" on public.posts
for update to authenticated
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

create policy "posts_delete_owner_or_admin" on public.posts
for delete to authenticated
using (author_id = auth.uid() or public.is_admin());

create policy "replies_select_authenticated" on public.post_replies
for select to authenticated
using (true);

create policy "replies_insert_authenticated" on public.post_replies
for insert to authenticated
with check (author_id = auth.uid() or public.is_admin() or public.is_chw() or public.current_role() in ('parent', 'doctor'));

create policy "replies_delete_owner_or_admin" on public.post_replies
for delete to authenticated
using (author_id = auth.uid() or public.is_admin());

create policy "notifications_select_owner" on public.notifications
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "notifications_insert_authenticated" on public.notifications
for insert to authenticated
with check (true);

create policy "notifications_update_owner" on public.notifications
for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "notifications_delete_owner" on public.notifications
for delete to authenticated
using (user_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
values ('scan-images', 'scan-images', true)
on conflict (id) do nothing;

create policy "scan_images_read" on storage.objects
for select to authenticated
using (bucket_id = 'scan-images');

create policy "scan_images_write" on storage.objects
for insert to authenticated
with check (bucket_id = 'scan-images');

create policy "scan_images_update" on storage.objects
for update to authenticated
using (bucket_id = 'scan-images')
with check (bucket_id = 'scan-images');

create policy "scan_images_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'scan-images');
