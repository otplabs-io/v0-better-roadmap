"use client"

import { forwardRef, useCallback } from "react"
import type { Roadmap, RoadmapItem, ZoomLevel } from "@/types/roadmap"
import { getTimelineWidth, getGridLines, dateToPixel } from "@/lib/timelineUtils"
import { RoadmapItemBar } from "./RoadmapItemBar"
import { MilestoneLine } from "./MilestoneLine"

const SWIMLANE_HEIGHT = 100
const HEADER_HEIGHT = 40

interface MainCanvasProps {
  roadmap: Roadmap
  zoom: ZoomLevel
  selectedItemId: string | null
  selectedMilestoneId: string | null
  onSelectItem: (id: string | null) => void
  onSelectMilestone: (id: string | null) => void
  onDeselectAll: () => void
  onUpdateItem: (item: RoadmapItem) => void
}

export const MainCanvas = forwardRef<HTMLDivElement, MainCanvasProps>(
  function MainCanvas(
    {
      roadmap,
      zoom,
      selectedItemId,
      selectedMilestoneId,
      onSelectItem,
      onSelectMilestone,
      onDeselectAll,
      onUpdateItem,
    },
    ref
  ) {
    const timelineWidth = getTimelineWidth(roadmap.startDate, roadmap.endDate, zoom)
    const gridLines = getGridLines(roadmap.startDate, roadmap.endDate, zoom)
    const totalHeight = roadmap.swimlanes.length * SWIMLANE_HEIGHT

    const handleBackgroundClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onDeselectAll()
        }
      },
      [onDeselectAll]
    )

    return (
      <div className="flex-1 overflow-auto bg-background" onClick={handleBackgroundClick}>
        <div ref={ref} className="relative" style={{ width: timelineWidth, minHeight: totalHeight + HEADER_HEIGHT }}>
          {/* Grid header with date labels */}
          <div
            className="sticky top-0 z-20 border-b border-border bg-card"
            style={{ height: HEADER_HEIGHT }}
          >
            {gridLines.map((line, i) => (
              <div
                key={i}
                className="absolute top-0 flex items-end pb-1.5"
                style={{ left: line.x, height: HEADER_HEIGHT }}
              >
                <span
                  className={`whitespace-nowrap text-[10px] ${
                    line.isMajor
                      ? "font-semibold text-foreground"
                      : "font-normal text-muted-foreground"
                  }`}
                  style={{ transform: "translateX(-50%)" }}
                >
                  {line.label}
                </span>
              </div>
            ))}
          </div>

          {/* Grid body */}
          <div className="relative" style={{ height: totalHeight }}>
            {/* Vertical grid lines */}
            {gridLines.map((line, i) => (
              <div
                key={`line-${i}`}
                className={`absolute top-0 ${
                  line.isMajor ? "border-l border-border" : "border-l border-border/40"
                }`}
                style={{
                  left: line.x,
                  height: totalHeight,
                }}
              />
            ))}

            {/* Swimlane rows */}
            {roadmap.swimlanes.map((swimlane, index) => {
              const items = roadmap.items.filter(
                (item) => item.swimlaneId === swimlane.id
              )
              return (
                <div
                  key={swimlane.id}
                  className="absolute left-0 right-0 border-b border-border"
                  style={{
                    top: index * SWIMLANE_HEIGHT,
                    height: SWIMLANE_HEIGHT,
                    backgroundColor: swimlane.color,
                  }}
                  onClick={handleBackgroundClick}
                >
                  {items.map((item) => {
                    const left = dateToPixel(item.startDate, roadmap.startDate, zoom)
                    const right = dateToPixel(item.endDate, roadmap.startDate, zoom)
                    const width = Math.max(right - left, 20)

                    return (
                      <RoadmapItemBar
                        key={item.id}
                        item={item}
                        left={left}
                        width={width}
                        isSelected={item.id === selectedItemId}
                        onSelect={() => onSelectItem(item.id)}
                        onUpdate={onUpdateItem}
                        timelineStart={roadmap.startDate}
                        timelineEnd={roadmap.endDate}
                        zoom={zoom}
                        swimlanes={roadmap.swimlanes}
                        swimlaneIndex={index}
                        swimlaneHeight={SWIMLANE_HEIGHT}
                      />
                    )
                  })}
                </div>
              )
            })}

            {/* Milestone lines */}
            {roadmap.milestones.map((milestone) => {
              const x = dateToPixel(milestone.date, roadmap.startDate, zoom)
              return (
                <MilestoneLine
                  key={milestone.id}
                  milestone={milestone}
                  x={x}
                  height={totalHeight}
                  isSelected={milestone.id === selectedMilestoneId}
                  onSelect={() => onSelectMilestone(milestone.id)}
                />
              )
            })}

            {/* Today marker */}
            <TodayMarker
              timelineStart={roadmap.startDate}
              timelineEnd={roadmap.endDate}
              zoom={zoom}
              height={totalHeight}
            />
          </div>
        </div>
      </div>
    )
  }
)

function TodayMarker({
  timelineStart,
  timelineEnd,
  zoom,
  height,
}: {
  timelineStart: Date
  timelineEnd: Date
  zoom: ZoomLevel
  height: number
}) {
  const today = new Date()
  if (today < timelineStart || today > timelineEnd) return null

  const x = dateToPixel(today, timelineStart, zoom)

  return (
    <div
      className="absolute top-0 z-10 w-0.5 bg-primary"
      style={{ left: x, height }}
    >
      <div className="absolute -left-1.5 -top-1 h-3 w-3 rounded-full bg-primary" />
    </div>
  )
}
