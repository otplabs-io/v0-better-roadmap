"use client"

import { useEffect } from "react"
import type { RoadmapItem, Milestone, Swimlane, ItemStatus } from "@/types/roadmap"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, X } from "lucide-react"
import { format } from "date-fns"

const STATUSES: ItemStatus[] = ["Idea", "Planned", "In Progress", "Blocked", "Done"]

const ITEM_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Sky", value: "#0ea5e9" },
  { label: "Orange", value: "#f97316" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Teal", value: "#14b8a6" },
]

interface RightPanelProps {
  item: RoadmapItem | null
  milestone: Milestone | null
  swimlanes: Swimlane[]
  onUpdateItem: (item: RoadmapItem) => void
  onDeleteItem: (id: string) => void
  onUpdateMilestone: (milestone: Milestone) => void
  onDeleteMilestone: (id: string) => void
  onClose: () => void
}

export function RightPanel({
  item,
  milestone,
  swimlanes,
  onUpdateItem,
  onDeleteItem,
  onUpdateMilestone,
  onDeleteMilestone,
  onClose,
}: RightPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          {item ? "Edit Item" : "Edit Milestone"}
        </h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {item && (
          <ItemEditor
            item={item}
            swimlanes={swimlanes}
            onUpdate={onUpdateItem}
            onDelete={() => onDeleteItem(item.id)}
          />
        )}
        {milestone && (
          <MilestoneEditor
            milestone={milestone}
            onUpdate={onUpdateMilestone}
            onDelete={() => onDeleteMilestone(milestone.id)}
          />
        )}
      </div>
    </div>
  )
}

function ItemEditor({
  item,
  swimlanes,
  onUpdate,
  onDelete,
}: {
  item: RoadmapItem
  swimlanes: Swimlane[]
  onUpdate: (item: RoadmapItem) => void
  onDelete: () => void
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-title" className="text-xs text-muted-foreground">
          Title
        </Label>
        <Input
          id="item-title"
          value={item.title}
          onChange={(e) => onUpdate({ ...item, title: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-desc" className="text-xs text-muted-foreground">
          Description
        </Label>
        <Textarea
          id="item-desc"
          value={item.description}
          onChange={(e) => onUpdate({ ...item, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-owner" className="text-xs text-muted-foreground">
          Owner
        </Label>
        <Input
          id="item-owner"
          value={item.owner}
          onChange={(e) => onUpdate({ ...item, owner: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={item.status}
          onValueChange={(v) => onUpdate({ ...item, status: v as ItemStatus })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Swimlane</Label>
        <Select
          value={item.swimlaneId}
          onValueChange={(v) => onUpdate({ ...item, swimlaneId: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {swimlanes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-start" className="text-xs text-muted-foreground">
            Start Date
          </Label>
          <Input
            id="item-start"
            type="date"
            value={format(item.startDate, "yyyy-MM-dd")}
            onChange={(e) => {
              const d = new Date(e.target.value)
              if (!isNaN(d.getTime())) onUpdate({ ...item, startDate: d })
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-end" className="text-xs text-muted-foreground">
            End Date
          </Label>
          <Input
            id="item-end"
            type="date"
            value={format(item.endDate, "yyyy-MM-dd")}
            onChange={(e) => {
              const d = new Date(e.target.value)
              if (!isNaN(d.getTime())) onUpdate({ ...item, endDate: d })
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Color</Label>
        <div className="flex flex-wrap gap-2">
          {ITEM_COLORS.map((c) => (
            <button
              key={c.value}
              className={`h-7 w-7 rounded-md border-2 transition-transform hover:scale-110 ${
                item.color === c.value
                  ? "border-foreground"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: c.value }}
              onClick={() => onUpdate({ ...item, color: c.value })}
              aria-label={c.label}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="w-full gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Item
        </Button>
      </div>
    </>
  )
}

function MilestoneEditor({
  milestone,
  onUpdate,
  onDelete,
}: {
  milestone: Milestone
  onUpdate: (m: Milestone) => void
  onDelete: () => void
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ms-title" className="text-xs text-muted-foreground">
          Title
        </Label>
        <Input
          id="ms-title"
          value={milestone.title}
          onChange={(e) => onUpdate({ ...milestone, title: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ms-date" className="text-xs text-muted-foreground">
          Date
        </Label>
        <Input
          id="ms-date"
          type="date"
          value={format(milestone.date, "yyyy-MM-dd")}
          onChange={(e) => {
            const d = new Date(e.target.value)
            if (!isNaN(d.getTime())) onUpdate({ ...milestone, date: d })
          }}
        />
      </div>

      <div className="border-t border-border pt-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="w-full gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Milestone
        </Button>
      </div>
    </>
  )
}
