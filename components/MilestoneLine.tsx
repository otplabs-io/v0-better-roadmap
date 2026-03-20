"use client"

import type { Milestone } from "@/types/roadmap"
import { cn } from "@/lib/utils"
import { Diamond } from "lucide-react"

interface MilestoneLineProps {
  milestone: Milestone
  x: number
  height: number
  isSelected: boolean
  onSelect: () => void
}

export function MilestoneLine({
  milestone,
  x,
  height,
  isSelected,
  onSelect,
}: MilestoneLineProps) {
  return (
    <div
      className="absolute top-0 z-10"
      style={{ left: x, height }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Vertical dashed line */}
      <div
        className={cn(
          "absolute left-0 top-0 w-px",
          isSelected ? "bg-primary" : "bg-destructive/60"
        )}
        style={{
          height,
          borderLeft: `1.5px dashed ${isSelected ? "var(--primary)" : "hsl(0 72% 51% / 0.6)"}`,
          background: "transparent",
        }}
      />

      {/* Label at top */}
      <div
        className={cn(
          "absolute -left-3 -top-0.5 flex cursor-pointer flex-col items-center",
          isSelected && "scale-110"
        )}
      >
        <Diamond
          className={cn(
            "h-3.5 w-3.5 fill-current",
            isSelected ? "text-primary" : "text-destructive/70"
          )}
        />
        <span
          className={cn(
            "mt-0.5 whitespace-nowrap rounded px-1 py-0.5 text-[9px] font-semibold",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {milestone.title}
        </span>
      </div>
    </div>
  )
}
