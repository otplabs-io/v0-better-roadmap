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
import { Trash2, X, Plus } from "lucide-react"
import { format } from "date-fns"
import { Slider } from "@/components/ui/slider"

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
  allItems: RoadmapItem[]
  onUpdateItem: (item: RoadmapItem) => void
  onDeleteItem: (id: string) => void
  onUpdateMilestone: (milestone: Milestone) => void
  onDeleteMilestone: (id: string) => void
  onAddSubItem: (parentId: string) => void
  onClose: () => void
}

export function RightPanel({
  item,
  milestone,
  swimlanes,
  allItems,
  onUpdateItem,
  onDeleteItem,
  onUpdateMilestone,
  onDeleteMilestone,
  onAddSubItem,
  onClose,
}: RightPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const isSubItem = item?.parentId != null
  const subItems = item ? allItems.filter((i) => i.parentId === item.id) : []
  const parentItem = item?.parentId ? allItems.find((i) => i.id === item.parentId) : null

  return (
    <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          {item
            ? isSubItem
              ? "Edit Sub-Item"
              : "Edit Item"
            : "Edit Milestone"}
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
            subItems={subItems}
            parentItem={parentItem ?? null}
            isSubItem={isSubItem}
            onUpdate={onUpdateItem}
            onDelete={() => onDeleteItem(item.id)}
            onAddSubItem={() => onAddSubItem(item.id)}
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
  subItems,
  parentItem,
  isSubItem,
  onUpdate,
  onDelete,
  onAddSubItem,
}: {
  item: RoadmapItem
  swimlanes: Swimlane[]
  subItems: RoadmapItem[]
  parentItem: RoadmapItem | null
  isSubItem: boolean
  onUpdate: (item: RoadmapItem) => void
  onDelete: () => void
  onAddSubItem: () => void
}) {
  return (
    <>
      {parentItem && (
        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Sub-item of <span className="font-medium text-foreground">{parentItem.title}</span>
        </div>
      )}

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
        <Label className="text-xs text-muted-foreground">
          % Complete: {item.percentComplete}%
        </Label>
        <Slider
          value={[item.percentComplete]}
          onValueChange={([v]) => onUpdate({ ...item, percentComplete: v })}
          max={100}
          min={0}
          step={5}
        />
      </div>

      {!isSubItem && (
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
      )}

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

      {/* Sub-items section (only for parent items) */}
      {!isSubItem && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Sub-Items (Phases)</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={onAddSubItem}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>
          {subItems.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">
              No sub-items yet. Add phases to break this item into parts.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {subItems.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs"
                >
                  <span
                    className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span className="flex-1 truncate font-medium text-foreground">{sub.title}</span>
                  <span className="flex-shrink-0 text-muted-foreground">
                    {sub.percentComplete}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border pt-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="w-full gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete {isSubItem ? "Sub-Item" : "Item"}
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
