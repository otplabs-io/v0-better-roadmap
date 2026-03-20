import { createClient } from "@/lib/supabase/client"
import type { Roadmap, RoadmapItem, Milestone, Swimlane } from "@/types/roadmap"

// Helper to parse date strings from DB
function toDate(d: string | Date): Date {
  return typeof d === "string" ? new Date(d + "T00:00:00") : d
}

/**
 * Load a full roadmap (with swimlanes, items, milestones) by its ID.
 */
export async function loadRoadmap(roadmapId: string): Promise<Roadmap | null> {
  const supabase = createClient()

  const { data: rm, error: rmErr } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", roadmapId)
    .single()

  if (rmErr || !rm) return null

  const [swRes, itRes, msRes] = await Promise.all([
    supabase
      .from("swimlanes")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("items")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("created_at", { ascending: true }),
    supabase
      .from("milestones")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("date", { ascending: true }),
  ])

  const swimlanes: Swimlane[] = (swRes.data ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    color: s.color,
  }))

  const items: RoadmapItem[] = (itRes.data ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    owner: i.owner,
    status: i.status as RoadmapItem["status"],
    startDate: toDate(i.start_date),
    endDate: toDate(i.end_date),
    swimlaneId: i.swimlane_id,
    color: i.color,
    percentComplete: i.percent_complete,
    parentId: i.parent_id ?? null,
  }))

  const milestones: Milestone[] = (msRes.data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    date: toDate(m.date),
  }))

  return {
    id: rm.id,
    title: rm.title,
    startDate: toDate(rm.start_date),
    endDate: toDate(rm.end_date),
    swimlanes,
    items,
    milestones,
  }
}

/**
 * List all roadmaps (summary only -- no children).
 */
export async function listRoadmaps(): Promise<
  { id: string; title: string; startDate: Date; endDate: Date; createdAt: Date }[]
> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("roadmaps")
    .select("id, title, start_date, end_date, created_at")
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    startDate: toDate(r.start_date),
    endDate: toDate(r.end_date),
    createdAt: new Date(r.created_at),
  }))
}

/**
 * Create a new empty roadmap with default swimlanes.
 */
export async function createRoadmap(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const year = new Date().getFullYear()

  const { data: rm, error } = await supabase
    .from("roadmaps")
    .insert({
      user_id: user.id,
      title: "Untitled Roadmap",
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
    })
    .select("id")
    .single()

  if (error || !rm) return null

  const defaultSwimlanes = [
    { roadmap_id: rm.id, label: "Frontend", color: "#eff6ff", sort_order: 0 },
    { roadmap_id: rm.id, label: "Backend", color: "#ecfdf5", sort_order: 1 },
    { roadmap_id: rm.id, label: "Design", color: "#fffbeb", sort_order: 2 },
    { roadmap_id: rm.id, label: "Infrastructure", color: "#fff1f2", sort_order: 3 },
  ]

  await supabase.from("swimlanes").insert(defaultSwimlanes)
  return rm.id
}

/**
 * Delete a roadmap (cascades to swimlanes, items, milestones).
 */
export async function deleteRoadmap(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("roadmaps").delete().eq("id", id)
  return !error
}

// --- Per-entity update/create/delete helpers ---

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export async function updateRoadmapTitle(id: string, title: string) {
  const supabase = createClient()
  await supabase.from("roadmaps").update({ title, updated_at: new Date().toISOString() }).eq("id", id)
}

// Swimlane CRUD
export async function createSwimlane(
  roadmapId: string,
  label: string,
  color: string,
  sortOrder: number
): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("swimlanes")
    .insert({ roadmap_id: roadmapId, label, color, sort_order: sortOrder })
    .select("id")
    .single()
  if (error || !data) return null
  return data.id
}

export async function updateSwimlane(sw: Swimlane) {
  const supabase = createClient()
  await supabase.from("swimlanes").update({ label: sw.label, color: sw.color }).eq("id", sw.id)
}

export async function deleteSwimlane(id: string) {
  const supabase = createClient()
  await supabase.from("swimlanes").delete().eq("id", id)
}

// Item CRUD
export async function createItem(
  roadmapId: string,
  item: RoadmapItem
): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("items")
    .insert({
      roadmap_id: roadmapId,
      swimlane_id: item.swimlaneId,
      parent_id: item.parentId || null,
      title: item.title,
      description: item.description,
      owner: item.owner,
      status: item.status,
      start_date: fmtDate(item.startDate),
      end_date: fmtDate(item.endDate),
      color: item.color,
      percent_complete: item.percentComplete,
    })
    .select("id")
    .single()
  if (error || !data) return null
  return data.id
}

export async function updateItem(item: RoadmapItem) {
  const supabase = createClient()
  await supabase
    .from("items")
    .update({
      swimlane_id: item.swimlaneId,
      parent_id: item.parentId || null,
      title: item.title,
      description: item.description,
      owner: item.owner,
      status: item.status,
      start_date: fmtDate(item.startDate),
      end_date: fmtDate(item.endDate),
      color: item.color,
      percent_complete: item.percentComplete,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id)
}

export async function deleteItem(id: string) {
  const supabase = createClient()
  await supabase.from("items").delete().eq("id", id)
}

// Milestone CRUD
export async function createMilestone(
  roadmapId: string,
  ms: Milestone
): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("milestones")
    .insert({
      roadmap_id: roadmapId,
      title: ms.title,
      date: fmtDate(ms.date),
    })
    .select("id")
    .single()
  if (error || !data) return null
  return data.id
}

export async function updateMilestone(ms: Milestone) {
  const supabase = createClient()
  await supabase
    .from("milestones")
    .update({ title: ms.title, date: fmtDate(ms.date) })
    .eq("id", ms.id)
}

export async function deleteMilestone(id: string) {
  const supabase = createClient()
  await supabase.from("milestones").delete().eq("id", id)
}
