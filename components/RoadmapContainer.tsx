"use client"

import { useState, useCallback, useRef } from "react"
import type {
  Roadmap,
  RoadmapItem,
  Milestone,
  Swimlane,
  ZoomLevel,
} from "@/types/roadmap"
import { createInitialData } from "@/lib/initialData"
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
      items: prev.items.filter((i) => i.id !== id),
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
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onClose={handleDeselectAll}
          />
        )}
      </div>
    </div>
  )
}
