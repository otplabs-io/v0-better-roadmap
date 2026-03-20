-- Roadmaps table
create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Untitled Roadmap',
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.roadmaps enable row level security;

-- Permissive policies for now (no auth required yet)
-- When auth is added, change these to: auth.uid() = user_id
create policy "roadmaps_select_all" on public.roadmaps for select using (true);
create policy "roadmaps_insert_all" on public.roadmaps for insert with check (true);
create policy "roadmaps_update_all" on public.roadmaps for update using (true);
create policy "roadmaps_delete_all" on public.roadmaps for delete using (true);

-- Swimlanes table
create table if not exists public.swimlanes (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  label text not null default 'New Lane',
  color text not null default '#eff6ff',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.swimlanes enable row level security;

create policy "swimlanes_select_all" on public.swimlanes for select using (true);
create policy "swimlanes_insert_all" on public.swimlanes for insert with check (true);
create policy "swimlanes_update_all" on public.swimlanes for update using (true);
create policy "swimlanes_delete_all" on public.swimlanes for delete using (true);

-- Items table
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  swimlane_id uuid not null references public.swimlanes(id) on delete cascade,
  parent_id uuid references public.items(id) on delete cascade,
  title text not null default 'New Item',
  description text not null default '',
  owner text not null default '',
  status text not null default 'Idea',
  start_date date not null,
  end_date date not null,
  color text not null default '#3b82f6',
  percent_complete int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.items enable row level security;

create policy "items_select_all" on public.items for select using (true);
create policy "items_insert_all" on public.items for insert with check (true);
create policy "items_update_all" on public.items for update using (true);
create policy "items_delete_all" on public.items for delete using (true);

-- Milestones table
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  title text not null default 'New Milestone',
  date date not null,
  created_at timestamptz not null default now()
);

alter table public.milestones enable row level security;

create policy "milestones_select_all" on public.milestones for select using (true);
create policy "milestones_insert_all" on public.milestones for insert with check (true);
create policy "milestones_update_all" on public.milestones for update using (true);
create policy "milestones_delete_all" on public.milestones for delete using (true);
