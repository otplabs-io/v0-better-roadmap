"use client"

import { useCallback, useRef, useState } from "react"
import type { RoadmapItem, Swimlane, ZoomLevel } from "@/types/roadmap"
import { pixelToDate, ZOOM_CONFIG } from "@/lib/timelineUtils"
import { cn } from "@/lib/utils"

const ITEM_PADDING_TOP = 8
const ITEM_HEIGHT = 36

interface RoadmapItemBarProps {
  item: RoadmapItem
  left: number
  width: number
  isSelected: boolean
  onSelect: () => void
  onUpdate: (item: RoadmapItem) => void
  timelineStart: Date
  timelineEnd: Date
  zoom: ZoomLevel
  swimlanes: Swimlane[]
  swimlaneIndex: number
  swimlaneHeight: number
}

type DragMode = "move" | "resize-left" | "resize-right" | null

export function RoadmapItemBar({
  item,
  left,
  width,
  isSelected,
  onSelect,
  onUpdate,
  timelineStart,
  zoom,
  swimlanes,
  swimlaneIndex,
  swimlaneHeight,
}: RoadmapItemBarProps) {
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    origLeft: 0,
    origWidth: 0,
    origSwimlaneIndex: 0,
  })

  const statusDot = getStatusColor(item.status)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      e.stopPropagation()
      e.preventDefault()
      onSelect()

      setDragMode(mode)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origLeft: left,
        origWidth: width,
        origSwimlaneIndex: swimlaneIndex,
      }

      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
    },
    [left, width, swimlaneIndex, onSelect]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragMode) return

      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const dayWidth = ZOOM_CONFIG[zoom].dayWidth

      if (dragMode === "move") {
        const newLeft = dragRef.current.origLeft + dx
        const newStartDate = pixelToDate(newLeft, timelineStart, zoom)
        const durationDays = Math.round(
          dragRef.current.origWidth / dayWidth
        )
        const newEndDate = new Date(newStartDate)
        newEndDate.setDate(newEndDate.getDate() + durationDays)

        // Calculate swimlane change
        const laneDelta = Math.round(dy / swimlaneHeight)
        const newLaneIndex = Math.max(
          0,
          Math.min(
            swimlanes.length - 1,
            dragRef.current.origSwimlaneIndex + laneDelta
          )
        )
        const newSwimlaneId = swimlanes[newLaneIndex].id

        onUpdate({
          ...item,
          startDate: newStartDate,
          endDate: newEndDate,
          swimlaneId: newSwimlaneId,
        })
      } else if (dragMode === "resize-left") {
        const newLeft = dragRef.current.origLeft + dx
        const newStartDate = pixelToDate(newLeft, timelineStart, zoom)
        if (newStartDate < item.endDate) {
          onUpdate({ ...item, startDate: newStartDate })
        }
      } else if (dragMode === "resize-right") {
        const newWidth = Math.max(dayWidth, dragRef.current.origWidth + dx)
        const newEndDate = pixelToDate(
          dragRef.current.origLeft + newWidth,
          timelineStart,
          zoom
        )
        if (newEndDate > item.startDate) {
          onUpdate({ ...item, endDate: newEndDate })
        }
      }
    },
    [dragMode, zoom, timelineStart, swimlaneHeight, swimlanes, item, onUpdate]
  )

  const handlePointerUp = useCallback(() => {
    setDragMode(null)
  }, [])

  return (
    <div
      className={cn(
        "absolute flex cursor-grab items-center gap-1.5 rounded-md px-2 text-xs font-medium shadow-sm transition-shadow select-none",
        isSelected
          ? "ring-2 ring-primary ring-offset-1 ring-offset-background shadow-md"
          : "hover:shadow-md",
        dragMode === "move" && "cursor-grabbing opacity-90 shadow-lg"
      )}
      style={{
        left,
        top: ITEM_PADDING_TOP,
        width,
        height: ITEM_HEIGHT,
        backgroundColor: item.color,
        color: getContrastText(item.color),
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerDown={(e) => handlePointerDown(e, "move")}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={`${item.title}, ${item.status}`}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 z-10 h-full w-2 cursor-col-resize rounded-l-md opacity-0 transition-opacity hover:opacity-100"
        style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
        onPointerDown={(e) => {
          e.stopPropagation()
          handlePointerDown(e, "resize-left")
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Content */}
      <span
        className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: statusDot }}
      />
      <span className="truncate">{item.title}</span>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 z-10 h-full w-2 cursor-col-resize rounded-r-md opacity-0 transition-opacity hover:opacity-100"
        style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
        onPointerDown={(e) => {
          e.stopPropagation()
          handlePointerDown(e, "resize-right")
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case "Done":
      return "#22c55e"
    case "In Progress":
      return "#eab308"
    case "Planned":
      return "#3b82f6"
    case "Blocked":
      return "#ef4444"
    case "Idea":
    default:
      return "#94a3b8"
  }
}

function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#1e293b" : "#ffffff"
}
