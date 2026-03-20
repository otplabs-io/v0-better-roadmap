"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import type {
  Roadmap,
  RoadmapItem,
  Milestone,
  Swimlane,
  ZoomLevel,
} from "@/types/roadmap"
import { createInitialData } from "@/lib/initialData"
import { computeSwimlaneLayout } from "@/lib/layoutUtils"
import { TimelineHeader } from "./TimelineHeader"
import { LeftSidebar } from "./LeftSidebar"
import { MainCanvas } from "./MainCanvas"
import { RightPanel } from "./RightPanel"

export function RoadmapContainer() {
  const [roadmap, setRoadmap] = useState<Roadmap>(createInitialData)
  const [zoom, setZoom] = useState<ZoomLevel>("monthly")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const selectedItem = roadmap.items.find((i) => i.id === selectedItemId) ?? null
  const selectedMilestone = roadmap.milestones.find((m) => m.id === selectedMilestoneId) ?? null

  // Compute swimlane heights for sidebar alignment
  const swimlaneHeights = useMemo(() => {
    return roadmap.swimlanes.map((sw) => {
      const layout = computeSwimlaneLayout(roadmap.items, sw.id, roadmap.startDate, zoom)
      return layout.height
    })
  }, [roadmap.swimlanes, roadmap.items, roadmap.startDate, zoom])

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
    setRoadmap((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === updated.id ? updated : i)),
    }))
  }, [])

  const handleDeleteItem = useCallback((id: string) => {
    setRoadmap((prev) => ({
      ...prev,
      // Also delete any sub-items of this item
      items: prev.items.filter((i) => i.id !== id && i.parentId !== id),
    }))
    setSelectedItemId(null)
  }, [])

  const handleUpdateMilestone = useCallback((updated: Milestone) => {
    setRoadmap((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === updated.id ? updated : m
      ),
    }))
  }, [])

  const handleDeleteMilestone = useCallback((id: string) => {
    setRoadmap((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== id),
    }))
    setSelectedMilestoneId(null)
  }, [])

  const handleAddItem = useCallback(
    (swimlaneId: string) => {
      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + 30)

      const newItem: RoadmapItem = {
        id: `item-${Date.now()}`,
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
      setRoadmap((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }))
      setSelectedItemId(newItem.id)
      setSelectedMilestoneId(null)
    },
    []
  )

  const handleAddSubItem = useCallback(
    (parentId: string) => {
      setRoadmap((prev) => {
        const parent = prev.items.find((i) => i.id === parentId)
        if (!parent) return prev

        // Sub-item spans the first third of the parent by default
        const parentDuration = parent.endDate.getTime() - parent.startDate.getTime()
        const subEnd = new Date(parent.startDate.getTime() + parentDuration / 3)

        const newSubItem: RoadmapItem = {
          id: `sub-${Date.now()}`,
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
        return {
          ...prev,
          items: [...prev.items, newSubItem],
        }
      })
    },
    []
  )

  const handleAddSwimlane = useCallback(() => {
    const colors = ["#eff6ff", "#ecfdf5", "#fffbeb", "#fff1f2", "#f0f9ff", "#fdf2f8"]
    const newSwimlane: Swimlane = {
      id: `sw-${Date.now()}`,
      label: "New Lane",
      color: colors[roadmap.swimlanes.length % colors.length],
    }
    setRoadmap((prev) => ({
      ...prev,
      swimlanes: [...prev.swimlanes, newSwimlane],
    }))
  }, [roadmap.swimlanes.length])

  const handleUpdateSwimlane = useCallback((updated: Swimlane) => {
    setRoadmap((prev) => ({
      ...prev,
      swimlanes: prev.swimlanes.map((s) =>
        s.id === updated.id ? updated : s
      ),
    }))
  }, [])

  const handleDeleteSwimlane = useCallback((id: string) => {
    setRoadmap((prev) => ({
      ...prev,
      swimlanes: prev.swimlanes.filter((s) => s.id !== id),
      items: prev.items.filter((i) => i.swimlaneId !== id),
    }))
  }, [])

  const handleAddMilestone = useCallback(() => {
    const now = new Date()
    const newMilestone: Milestone = {
      id: `ms-${Date.now()}`,
      title: "New Milestone",
      date: now,
    }
    setRoadmap((prev) => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone],
    }))
    setSelectedMilestoneId(newMilestone.id)
    setSelectedItemId(null)
  }, [])

  const handleUpdateTitle = useCallback((title: string) => {
    setRoadmap((prev) => ({ ...prev, title }))
  }, [])

  const showRightPanel = selectedItem !== null || selectedMilestone !== null

  console.log("[v0] RoadmapContainer rendering", {
    swimlanes: roadmap.swimlanes.length,
    items: roadmap.items.length,
    milestones: roadmap.milestones.length,
    swimlaneHeights,
    zoom,
    startDate: roadmap.startDate.toISOString(),
    endDate: roadmap.endDate.toISOString(),
  })

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

/**
 * Lighten a hex color slightly for sub-items
 */
function lightenColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lighten = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.35))
  return `#${lighten(r).toString(16).padStart(2, "0")}${lighten(g).toString(16).padStart(2, "0")}${lighten(b).toString(16).padStart(2, "0")}`
}
