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
 * Parent items are assigned to rows so overlapping ones don't collide.
 * Sub-items are placed directly below their parent bar.
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

  // Sort parents by start date
  const sorted = [...parentItems].sort((a, b) => {
    const diff = a.startDate.getTime() - b.startDate.getTime()
    if (diff !== 0) return diff
    return (
      b.endDate.getTime() -
      b.startDate.getTime() -
      (a.endDate.getTime() - a.startDate.getTime())
    )
  })

  // Greedy row assignment: each row tracks the rightmost pixel edge used
  const rowEnds: number[] = []
  const parentRowAssignment = new Map<string, number>()

  for (const parent of sorted) {
    const left = dateToPixel(parent.startDate, timelineStart, zoom)
    const right = dateToPixel(parent.endDate, timelineStart, zoom)
    const width = Math.max(right - left, 20)

    let assignedRow = -1
    for (let r = 0; r < rowEnds.length; r++) {
      if (left >= rowEnds[r] + 4) {
        assignedRow = r
        break
      }
    }
    if (assignedRow === -1) {
      assignedRow = rowEnds.length
      rowEnds.push(0)
    }
    rowEnds[assignedRow] = left + width
    parentRowAssignment.set(parent.id, assignedRow)
  }

  // Now compute the vertical offset for each row.
  // Each row's height = ITEM_HEIGHT + max sub-item band height for any item in that row.
  const rowCount = rowEnds.length
  const rowHeights: number[] = new Array(rowCount).fill(ITEM_HEIGHT)

  for (const parent of sorted) {
    const row = parentRowAssignment.get(parent.id)!
    const subs = subItemsByParent.get(parent.id) ?? []
    const subBandHeight =
      subs.length > 0 ? SUB_ITEM_GAP + SUB_ITEM_HEIGHT : 0
    const totalItemHeight = ITEM_HEIGHT + subBandHeight
    if (totalItemHeight > rowHeights[row]) {
      rowHeights[row] = totalItemHeight
    }
  }

  // Compute cumulative row offsets
  const rowTops: number[] = []
  let acc = LANE_PADDING_TOP
  for (let r = 0; r < rowCount; r++) {
    rowTops.push(acc)
    acc += rowHeights[r] + ITEM_GAP
  }

  // Build layout items
  const layoutItems: LayoutItem[] = []

  for (const parent of sorted) {
    const row = parentRowAssignment.get(parent.id)!
    const left = dateToPixel(parent.startDate, timelineStart, zoom)
    const right = dateToPixel(parent.endDate, timelineStart, zoom)
    const width = Math.max(right - left, 20)
    const top = rowTops[row]

    layoutItems.push({
      item: parent,
      left,
      width,
      top,
      height: ITEM_HEIGHT,
      isSubItem: false,
    })

    // Place sub-items below parent
    const subs = subItemsByParent.get(parent.id) ?? []
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

  // Total lane height
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
