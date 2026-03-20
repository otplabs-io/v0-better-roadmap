"use client"

import { useState } from "react"
import type { Swimlane } from "@/types/roadmap"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LeftSidebarProps {
  swimlanes: Swimlane[]
  swimlaneHeights: number[]
  onAddSwimlane: () => void
  onAddItem: (swimlaneId: string) => void
  onUpdateSwimlane: (swimlane: Swimlane) => void
  onDeleteSwimlane: (id: string) => void
}

export function LeftSidebar({
  swimlanes,
  swimlaneHeights,
  onAddSwimlane,
  onAddItem,
  onUpdateSwimlane,
  onDeleteSwimlane,
}: LeftSidebarProps) {
  return (
    <div className="flex w-52 flex-shrink-0 flex-col border-r border-border bg-card">
      {/* Header spacer to align with timeline grid header */}
      <div className="flex h-10 items-center justify-between border-b border-border px-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Lanes
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onAddSwimlane}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only">Add swimlane</span>
        </Button>
      </div>

      {/* Swimlane labels */}
      <div className="flex-1 overflow-y-auto">
        {swimlanes.map((swimlane, index) => (
          <SwimlaneLabel
            key={swimlane.id}
            swimlane={swimlane}
            height={swimlaneHeights[index] ?? 60}
            onAddItem={() => onAddItem(swimlane.id)}
            onUpdate={onUpdateSwimlane}
            onDelete={() => onDeleteSwimlane(swimlane.id)}
          />
        ))}
      </div>
    </div>
  )
}

function SwimlaneLabel({
  swimlane,
  height,
  onAddItem,
  onUpdate,
  onDelete,
}: {
  swimlane: Swimlane
  height: number
  onAddItem: () => void
  onUpdate: (s: Swimlane) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(swimlane.label)

  return (
    <div
      className="group flex items-center justify-between border-b border-border px-3"
      style={{ height, backgroundColor: swimlane.color }}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {isEditing ? (
          <input
            className="w-full rounded border border-input bg-background px-1.5 py-0.5 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-ring"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              onUpdate({ ...swimlane, label: editValue })
              setIsEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdate({ ...swimlane, label: editValue })
                setIsEditing(false)
              }
            }}
            autoFocus
          />
        ) : (
          <span className="truncate text-sm font-medium text-foreground">
            {swimlane.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onAddItem}
        >
          <Plus className="h-3 w-3" />
          <span className="sr-only">Add item</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3 w-3" />
              <span className="sr-only">Swimlane options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={() => {
                setEditValue(swimlane.label)
                setIsEditing(true)
              }}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
