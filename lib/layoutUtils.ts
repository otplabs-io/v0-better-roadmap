import type { RoadmapItem, ZoomLevel } from "@/types/roadmap"
import { dateToPixel } from "./timelineUtils"

const ITEM_HEIGHT = 36
const ITEM_GAP = 4
const SUB_ITEM_HEIGHT = 22
const SUB_ITEM_GAP = 2
const LANE_PADDING_TOP = 8
const LANE_PADDING_BOTTOM = 8

export interface LayoutItem {
  item: RoadmapItem
  left: number
  width: number
  top: number
  height: number
  isSubItem: boolean
}

export interface SwimlaneLayout {
  swimlaneId: string
  height: number
  items: LayoutItem[]
}

/**
 * Compute stacked vertical positions for items in a given swimlane.
 * Parent items are stacked so overlapping ones don't collide.
 * Sub-items are placed inside their parent's vertical band but below the parent bar.
 */
export function computeSwimlaneLayout(
  allItems: RoadmapItem[],
  swimlaneId: string,
  timelineStart: Date,
  zoom: ZoomLevel
): SwimlaneLayout {
  const laneItems = allItems.filter((i) => i.swimlaneId === swimlaneId)
  const parentItems = laneItems.filter((i) => !i.parentId)
  const subItemsByParent = new Map<string, RoadmapItem[]>()

  for (const item of laneItems) {
    if (item.parentId) {
      const arr = subItemsByParent.get(item.parentId) ?? []
      arr.push(item)
      subItemsByParent.set(item.parentId, arr)
    }
  }

  // Sort parents by start date, then by duration (longer first)
  const sorted = [...parentItems].sort((a, b) => {
    const diff = a.startDate.getTime() - b.startDate.getTime()
    if (diff !== 0) return diff
    return (b.endDate.getTime() - b.startDate.getTime()) - (a.endDate.getTime() - a.startDate.getTime())
  })

  // Greedy row assignment for parents: each "row" tracks the rightmost pixel used
  const rows: number[] = [] // each entry is the right-edge pixel of the last item placed in that row
  const parentRow: Map<string, number> = new Map()
  const layoutItems: LayoutItem[] = []

  for (const parent of sorted) {
    const left = dateToPixel(parent.startDate, timelineStart, zoom)
    const right = dateToPixel(parent.endDate, timelineStart, zoom)
    const width = Math.max(right - left, 20)

    // Find first row where this item doesn't overlap
    let assignedRow = -1
    for (let r = 0; r < rows.length; r++) {
      if (left >= rows[r] + 4) {
        assignedRow = r
        break
      }
    }
    if (assignedRow === -1) {
      assignedRow = rows.length
      rows.push(0)
    }
    rows[assignedRow] = left + width

    // Calculate how many sub-items this parent has
    const subs = subItemsByParent.get(parent.id) ?? []
    const subRows = subs.length > 0 ? 1 : 0 // sub-items in a single sub-row for now

    parentRow.set(parent.id, assignedRow)

    // Parent top position
    // Each parent "slot" height = ITEM_HEIGHT + (subRows * (SUB_ITEM_HEIGHT + SUB_ITEM_GAP))
    const slotsBefore = computeSlotOffset(sorted, parentRow, subItemsByParent, assignedRow, parent.id)
    const top = LANE_PADDING_TOP + slotsBefore

    layoutItems.push({
      item: parent,
      left,
      width,
      top,
      height: ITEM_HEIGHT,
      isSubItem: false,
    })

    // Place sub-items below parent within the same horizontal span
    if (subs.length > 0) {
      const sortedSubs = [...subs].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      )
      const subTop = top + ITEM_HEIGHT + SUB_ITEM_GAP
      for (const sub of sortedSubs) {
        const subLeft = dateToPixel(sub.startDate, timelineStart, zoom)
        const subRight = dateToPixel(sub.endDate, timelineStart, zoom)
        const subWidth = Math.max(subRight - subLeft, 16)
        layoutItems.push({
          item: sub,
          left: subLeft,
          width: subWidth,
          top: subTop,
          height: SUB_ITEM_HEIGHT,
          isSubItem: true,
        })
      }
    }
  }

  // Compute total swimlane height
  let maxBottom = 0
  for (const li of layoutItems) {
    const bottom = li.top + li.height
    if (bottom > maxBottom) maxBottom = bottom
  }
  const totalHeight = Math.max(maxBottom + LANE_PADDING_BOTTOM, 60)

  return {
    swimlaneId,
    height: totalHeight,
    items: layoutItems,
  }
}

/**
 * Compute the vertical pixel offset for items stacked before the given item
 * in the same row.
 */
function computeSlotOffset(
  sorted: RoadmapItem[],
  parentRow: Map<string, number>,
  subItemsByParent: Map<string, RoadmapItem[]>,
  targetRow: number,
  stopAtId: string
): number {
  let offset = 0
  for (const item of sorted) {
    if (item.id === stopAtId) break
    const row = parentRow.get(item.id)
    if (row === targetRow) {
      const subs = subItemsByParent.get(item.id) ?? []
      const subHeight = subs.length > 0 ? SUB_ITEM_HEIGHT + SUB_ITEM_GAP : 0
      offset += ITEM_HEIGHT + subHeight + ITEM_GAP
    }
  }
  return offset
}
