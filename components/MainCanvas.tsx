"use client"

import { forwardRef, useCallback, useMemo } from "react"
import type { Roadmap, RoadmapItem, ZoomLevel } from "@/types/roadmap"
import { getTimelineWidth, getGridLines, dateToPixel } from "@/lib/timelineUtils"
import { computeSwimlaneLayout, type SwimlaneLayout } from "@/lib/layoutUtils"
import { RoadmapItemBar } from "./RoadmapItemBar"
import { MilestoneLine } from "./MilestoneLine"

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

    // Compute per-swimlane stacked layouts
    const swimlaneLayouts: SwimlaneLayout[] = useMemo(() => {
      return roadmap.swimlanes.map((sw) =>
        computeSwimlaneLayout(roadmap.items, sw.id, roadmap.startDate, zoom)
      )
    }, [roadmap.swimlanes, roadmap.items, roadmap.startDate, zoom])

    // Compute cumulative y-offsets for each swimlane
    const swimlaneOffsets = useMemo(() => {
      const offsets: number[] = []
      let acc = 0
      for (const layout of swimlaneLayouts) {
        offsets.push(acc)
        acc += layout.height
      }
      return offsets
    }, [swimlaneLayouts])

    const totalHeight = useMemo(() => {
      return swimlaneLayouts.reduce((sum, l) => sum + l.height, 0)
    }, [swimlaneLayouts])

    console.log("[v0] MainCanvas rendering", {
      timelineWidth,
      gridLinesCount: gridLines.length,
      swimlaneLayouts: swimlaneLayouts.map(l => ({ id: l.swimlaneId, height: l.height, itemCount: l.items.length })),
      totalHeight,
    })

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
                      : line.isMonth
                        ? "font-medium text-foreground/80"
                        : "font-normal text-muted-foreground/60"
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
                className="absolute top-0"
                style={{
                  left: line.x,
                  height: totalHeight,
                  borderLeft: line.isMajor
                    ? "2px solid var(--border)"
                    : line.isMonth
                      ? "1.5px solid var(--border)"
                      : "1px dashed color-mix(in oklch, var(--border) 50%, transparent)",
                }}
              />
            ))}

            {/* Swimlane rows with stacked items */}
            {roadmap.swimlanes.map((swimlane, index) => {
              const layout = swimlaneLayouts[index]
              const yOffset = swimlaneOffsets[index]

              return (
                <div
                  key={swimlane.id}
                  className="absolute left-0 right-0 border-b border-border"
                  style={{
                    top: yOffset,
                    height: layout.height,
                    backgroundColor: swimlane.color,
                  }}
                  onClick={handleBackgroundClick}
                >
                  {layout.items.map((layoutItem) => {
                    return (
                      <RoadmapItemBar
                        key={layoutItem.item.id}
                        item={layoutItem.item}
                        left={layoutItem.left}
                        width={layoutItem.width}
                        top={layoutItem.top}
                        height={layoutItem.height}
                        isSubItem={layoutItem.isSubItem}
                        isSelected={layoutItem.item.id === selectedItemId}
                        onSelect={() => onSelectItem(layoutItem.item.id)}
                        onUpdate={onUpdateItem}
                        timelineStart={roadmap.startDate}
                        timelineEnd={roadmap.endDate}
                        zoom={zoom}
                        swimlanes={roadmap.swimlanes}
                        swimlaneIndex={index}
                        swimlaneHeight={layout.height}
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
