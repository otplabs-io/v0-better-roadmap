"use client"

import { useState, useCallback, useRef, useMemo, useEffect } from "react"
import type {
  Roadmap,
  RoadmapItem,
  Milestone,
  Swimlane,
  ZoomLevel,
} from "@/types/roadmap"
import { computeSwimlaneLayout } from "@/lib/layoutUtils"
import { TimelineHeader } from "./TimelineHeader"
import { LeftSidebar } from "./LeftSidebar"
import { MainCanvas } from "./MainCanvas"
import { RightPanel } from "./RightPanel"
import {
  loadRoadmap,
  updateRoadmapTitle,
  createSwimlane,
  updateSwimlane as updateSwimlaneDb,
  deleteSwimlane as deleteSwimlaneDb,
  createItem,
  updateItem as updateItemDb,
  deleteItem as deleteItemDb,
  createMilestone,
  updateMilestone as updateMilestoneDb,
  deleteMilestone as deleteMilestoneDb,
} from "@/lib/roadmapDb"

interface RoadmapContainerProps {
  roadmapId: string
}

export function RoadmapContainer({ roadmapId }: RoadmapContainerProps) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState<ZoomLevel>("monthly")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Load roadmap data from Supabase on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadRoadmap(roadmapId).then((data) => {
      if (!cancelled) {
        setRoadmap(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [roadmapId])

  const selectedItem = roadmap?.items.find((i) => i.id === selectedItemId) ?? null
  const selectedMilestone = roadmap?.milestones.find((m) => m.id === selectedMilestoneId) ?? null

  const swimlaneHeights = useMemo(() => {
    if (!roadmap) return []
    return roadmap.swimlanes.map((sw) => {
      const layout = computeSwimlaneLayout(roadmap.items, sw.id, roadmap.startDate, zoom)
      return layout.height
    })
  }, [roadmap, zoom])

  const handleSelectItem = useCallback((id: string | null) => {
    setSelectedItemId(id)
    setSelectedMilestoneId(null)
  }, [])

  const handleSelectMilestone = useCallback((id: string | null) => {
    setSelectedMilestoneId(id)
    setSelectedItemId(null)
  }, [])

  const handleDeselectAll = useCallback(() => {
    setSelectedItemId(null)
    setSelectedMilestoneId(null)
  }, [])

  const handleUpdateItem = useCallback((updated: RoadmapItem) => {
    setRoadmap((prev) => {
      if (!prev) return prev
      return { ...prev, items: prev.items.map((i) => (i.id === updated.id ? updated : i)) }
    })
    updateItemDb(updated)
  }, [])

  const handleDeleteItem = useCallback((id: string) => {
    setRoadmap((prev) => {
      if (!prev) return prev
      return { ...prev, items: prev.items.filter((i) => i.id !== id && i.parentId !== id) }
    })
    setSelectedItemId(null)
    deleteItemDb(id)
  }, [])

  const handleUpdateMilestone = useCallback((updated: Milestone) => {
    setRoadmap((prev) => {
      if (!prev) return prev
      return { ...prev, milestones: prev.milestones.map((m) => m.id === updated.id ? updated : m) }
    })
    updateMilestoneDb(updated)
  }, [])

  const handleDeleteMilestone = useCallback((id: string) => {
    setRoadmap((prev) => {
      if (!prev) return prev
      return { ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }
    })
    setSelectedMilestoneId(null)
    deleteMilestoneDb(id)
  }, [])

  const handleAddItem = useCallback(
    (swimlaneId: string) => {
      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + 30)

      const newItem: RoadmapItem = {
        id: `temp-${Date.now()}`,
        title: "New Item",
        description: "",
        owner: "",
        status: "Idea",
        startDate: now,
        endDate,
        swimlaneId,
        color: "#3b82f6",
        percentComplete: 0,
        parentId: null,
      }

      // Optimistically add with temp ID, then replace with real ID from DB
      setRoadmap((prev) => {
        if (!prev) return prev
        return { ...prev, items: [...prev.items, newItem] }
      })
      setSelectedItemId(newItem.id)
      setSelectedMilestoneId(null)

      createItem(roadmapId, newItem).then((realId) => {
        if (realId) {
          setRoadmap((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              items: prev.items.map((i) => i.id === newItem.id ? { ...i, id: realId } : i),
            }
          })
          setSelectedItemId(realId)
        }
      })
    },
    [roadmapId]
  )

  const handleAddSubItem = useCallback(
    (parentId: string) => {
      setRoadmap((prev) => {
        if (!prev) return prev
        const parent = prev.items.find((i) => i.id === parentId)
        if (!parent) return prev

        const parentDuration = parent.endDate.getTime() - parent.startDate.getTime()
        const subEnd = new Date(parent.startDate.getTime() + parentDuration / 3)

        const newSubItem: RoadmapItem = {
          id: `temp-sub-${Date.now()}`,
          title: "New Phase",
          description: "",
          owner: parent.owner,
          status: "Planned",
          startDate: new Date(parent.startDate),
          endDate: subEnd,
          swimlaneId: parent.swimlaneId,
          color: lightenColor(parent.color),
          percentComplete: 0,
          parentId,
        }

        createItem(roadmapId, newSubItem).then((realId) => {
          if (realId) {
            setRoadmap((p) => {
              if (!p) return p
              return {
                ...p,
                items: p.items.map((i) => i.id === newSubItem.id ? { ...i, id: realId } : i),
              }
            })
          }
        })

        return { ...prev, items: [...prev.items, newSubItem] }
      })
    },
    [roadmapId]
  )

  const handleAddSwimlane = useCallback(() => {
    const colors = ["#eff6ff", "#ecfdf5", "#fffbeb", "#fff1f2", "#f0f9ff", "#fdf2f8"]
    const sortOrder = roadmap?.swimlanes.length ?? 0
    const newSwimlane: Swimlane = {
      id: `temp-sw-${Date.now()}`,
      label: "New Lane",
      color: colors[sortOrder % colors.length],
    }

    setRoadmap((prev) => {
      if (!prev) return prev
      return { ...prev, swimlanes: [...prev.swimlanes, newSwimlane] }
    })

    createSwimlane(roadmapId, newSwimlane.label, newSwimlane.color, sortOrder).then((realId) => {
      if (realId) {
        setRoadmap((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            swimlanes: prev.swimlanes.map((s) => s.id === newSwimlane.id ? { ...s, id: realId } : s),
          }
        })
      }
    })
  }, [roadmapId, roadmap?.swimlanes.length])

  const handleUpdateSwimlane = useCallback((updated: Swimlane) => {
    setRoadmap((prev) => {
      if (!prev) return prev
      return { ...prev, swimlanes: prev.swimlanes.map((s) => s.id === updated.id ? updated : s) }
    })
    updateSwimlaneDb(updated)
  }, [])

  const handleDeleteSwimlane = useCallback((id: string) => {
    setRoadmap((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        swimlanes: prev.swimlanes.filter((s) => s.id !== id),
        items: prev.items.filter((i) => i.swimlaneId !== id),
      }
    })
    deleteSwimlaneDb(id)
  }, [])

  const handleAddMilestone = useCallback(() => {
    const now = new Date()
    const newMs: Milestone = {
      id: `temp-ms-${Date.now()}`,
      title: "New Milestone",
      date: now,
    }

    setRoadmap((prev) => {
      if (!prev) return prev
      return { ...prev, milestones: [...prev.milestones, newMs] }
    })
    setSelectedMilestoneId(newMs.id)
    setSelectedItemId(null)

    createMilestone(roadmapId, newMs).then((realId) => {
      if (realId) {
        setRoadmap((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            milestones: prev.milestones.map((m) => m.id === newMs.id ? { ...m, id: realId } : m),
          }
        })
        setSelectedMilestoneId(realId)
      }
    })
  }, [roadmapId])

  const handleUpdateTitle = useCallback((title: string) => {
    setRoadmap((prev) => {
      if (!prev) return prev
      return { ...prev, title }
    })
    updateRoadmapTitle(roadmapId, title)
  }, [roadmapId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading roadmap...</p>
        </div>
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-semibold text-foreground">Roadmap not found</p>
          <p className="text-sm text-muted-foreground">
            This roadmap may have been deleted or doesn{"'"}t exist.
          </p>
          <a href="/" className="text-sm font-medium text-primary hover:underline">
            Back to dashboard
          </a>
        </div>
      </div>
    )
  }

  const showRightPanel = selectedItem !== null || selectedMilestone !== null

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TimelineHeader
        title={roadmap.title}
        onTitleChange={handleUpdateTitle}
        zoom={zoom}
        onZoomChange={setZoom}
        onAddMilestone={handleAddMilestone}
        canvasRef={canvasRef}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          swimlanes={roadmap.swimlanes}
          swimlaneHeights={swimlaneHeights}
          onAddSwimlane={handleAddSwimlane}
          onAddItem={handleAddItem}
          onUpdateSwimlane={handleUpdateSwimlane}
          onDeleteSwimlane={handleDeleteSwimlane}
        />
        <MainCanvas
          ref={canvasRef}
          roadmap={roadmap}
          zoom={zoom}
          selectedItemId={selectedItemId}
          selectedMilestoneId={selectedMilestoneId}
          onSelectItem={handleSelectItem}
          onSelectMilestone={handleSelectMilestone}
          onDeselectAll={handleDeselectAll}
          onUpdateItem={handleUpdateItem}
        />
        {showRightPanel && (
          <RightPanel
            item={selectedItem}
            milestone={selectedMilestone}
            swimlanes={roadmap.swimlanes}
            allItems={roadmap.items}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onAddSubItem={handleAddSubItem}
            onClose={handleDeselectAll}
          />
        )}
      </div>
    </div>
  )
}

function lightenColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lighten = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.35))
  return `#${lighten(r).toString(16).padStart(2, "0")}${lighten(g).toString(16).padStart(2, "0")}${lighten(b).toString(16).padStart(2, "0")}`
}
