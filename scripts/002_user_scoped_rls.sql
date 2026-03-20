-- Drop all permissive policies
drop policy if exists "roadmaps_select_all" on public.roadmaps;
drop policy if exists "roadmaps_insert_all" on public.roadmaps;
drop policy if exists "roadmaps_update_all" on public.roadmaps;
drop policy if exists "roadmaps_delete_all" on public.roadmaps;

drop policy if exists "swimlanes_select_all" on public.swimlanes;
drop policy if exists "swimlanes_insert_all" on public.swimlanes;
drop policy if exists "swimlanes_update_all" on public.swimlanes;
drop policy if exists "swimlanes_delete_all" on public.swimlanes;

drop policy if exists "items_select_all" on public.items;
drop policy if exists "items_insert_all" on public.items;
drop policy if exists "items_update_all" on public.items;
drop policy if exists "items_delete_all" on public.items;

drop policy if exists "milestones_select_all" on public.milestones;
drop policy if exists "milestones_insert_all" on public.milestones;
drop policy if exists "milestones_update_all" on public.milestones;
drop policy if exists "milestones_delete_all" on public.milestones;

-- Roadmaps: user can only CRUD their own
create policy "roadmaps_select_own" on public.roadmaps
  for select using (auth.uid() = user_id);
create policy "roadmaps_insert_own" on public.roadmaps
  for insert with check (auth.uid() = user_id);
create policy "roadmaps_update_own" on public.roadmaps
  for update using (auth.uid() = user_id);
create policy "roadmaps_delete_own" on public.roadmaps
  for delete using (auth.uid() = user_id);

-- Swimlanes: user can CRUD swimlanes belonging to their roadmaps
create policy "swimlanes_select_own" on public.swimlanes
  for select using (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
create policy "swimlanes_insert_own" on public.swimlanes
  for insert with check (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
create policy "swimlanes_update_own" on public.swimlanes
  for update using (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
create policy "swimlanes_delete_own" on public.swimlanes
  for delete using (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );

-- Items: user can CRUD items belonging to their roadmaps
create policy "items_select_own" on public.items
  for select using (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
create policy "items_insert_own" on public.items
  for insert with check (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
create policy "items_update_own" on public.items
  for update using (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
create policy "items_delete_own" on public.items
  for delete using (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );

-- Milestones: user can CRUD milestones belonging to their roadmaps
create policy "milestones_select_own" on public.milestones
  for select using (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
create policy "milestones_insert_own" on public.milestones
  for insert with check (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
create policy "milestones_update_own" on public.milestones
  for update using (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
create policy "milestones_delete_own" on public.milestones
  for delete using (
    exists (select 1 from public.roadmaps where id = roadmap_id and user_id = auth.uid())
  );
