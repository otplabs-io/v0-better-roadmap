"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { listRoadmaps, createRoadmap, deleteRoadmap } from "@/lib/roadmapDb"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Map, Calendar } from "lucide-react"
import { format } from "date-fns"

interface RoadmapSummary {
  id: string
  title: string
  startDate: Date
  endDate: Date
  createdAt: Date
}

export default function DashboardPage() {
  const router = useRouter()
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listRoadmaps().then((data) => {
      setRoadmaps(data)
      setLoading(false)
    })
  }, [])

  const handleCreate = useCallback(async () => {
    setCreating(true)
    const id = await createRoadmap()
    if (id) {
      router.push(`/roadmap/${id}`)
    }
    setCreating(false)
  }, [router])

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const confirmed = window.confirm("Are you sure you want to delete this roadmap?")
    if (!confirmed) return
    const ok = await deleteRoadmap(id)
    if (ok) {
      setRoadmaps((prev) => prev.filter((r) => r.id !== id))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Map className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Better Roadmap</h1>
              <p className="text-sm text-muted-foreground">Visual roadmap planner</p>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {creating ? "Creating..." : "New Roadmap"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading roadmaps...</p>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Map className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">No roadmaps yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first roadmap to get started.
            </p>
            <Button onClick={handleCreate} disabled={creating} className="mt-6 gap-1.5">
              <Plus className="h-4 w-4" />
              {creating ? "Creating..." : "Create Roadmap"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmaps.map((rm) => (
              <div
                key={rm.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/roadmap/${rm.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/roadmap/${rm.id}`) }}
                className="group relative flex cursor-pointer flex-col rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Map className="h-5 w-5 text-primary" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => handleDelete(e, rm.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete roadmap</span>
                  </Button>
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground">
                  {rm.title}
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(rm.startDate, "MMM yyyy")} - {format(rm.endDate, "MMM yyyy")}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground/60">
                  Created {format(rm.createdAt, "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
