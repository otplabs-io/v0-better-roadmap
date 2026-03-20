/**
 * exportCanvas.ts
 *
 * Renders the roadmap directly onto an HTMLCanvasElement using the Canvas 2D
 * API. Avoids all third-party screenshot libraries and cross-origin font
 * references, which cause "tainted canvas" SecurityErrors.
 *
 * All measurements mirror the live UI layout constants.
 */

import type { Roadmap, ZoomLevel } from "@/types/roadmap"
import { computeSwimlaneLayout } from "./layoutUtils"
import { getGridLines, dateToPixel, getTimelineWidth } from "./timelineUtils"

// ── Layout constants (must match MainCanvas / LeftSidebar) ──────────────────
const SIDEBAR_WIDTH = 200
const HEADER_HEIGHT = 40      // timeline column-header row
const LANE_LABEL_FONT = "bold 13px system-ui, Arial, sans-serif"
const ITEM_FONT       = "600 11px system-ui, Arial, sans-serif"
const GRID_FONT       = "11px system-ui, Arial, sans-serif"
const MILESTONE_FONT  = "bold 10px system-ui, Arial, sans-serif"
const SCALE = 2               // retina / @2x

// ── Theme palette (hex, safe for canvas) ────────────────────────────────────
const C = {
  bg:            "#faf8f5",
  card:          "#ffffff",
  border:        "#e2ddd8",
  muted:         "#f2ede8",
  mutedFg:       "#6b6460",
  fg:            "#1a1a1a",
  primary:       "#f96302",
  primaryFg:     "#ffffff",
  gridMajor:     "#c8c2bb",
  gridMinor:     "#e8e3de",
  milestone:     "#ef4444",
  laneAltBg:     "#f5f0ea",
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let lo = 0, hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (ctx.measureText(text.slice(0, mid) + "…").width <= maxWidth) lo = mid
    else hi = mid - 1
  }
  return lo === 0 ? "" : text.slice(0, lo) + "…"
}

// Resolve any CSS color string (including oklch/oklab) to a safe hex by
// briefly setting it on a throwaway element's style and reading it back via
// a 1×1 canvas. Falls back to `fallback` if the browser can't parse it.
const colorCache = new Map<string, string>()
const resolverCtx = (() => {
  const c = document.createElement("canvas")
  c.width = c.height = 1
  return c.getContext("2d")!
})()

function safeColor(color: string, fallback: string): string {
  if (!color || color === "none" || color === "transparent") return fallback
  const cached = colorCache.get(color)
  if (cached) return cached

  try {
    resolverCtx.clearRect(0, 0, 1, 1)
    resolverCtx.fillStyle = "#000" // reset
    resolverCtx.fillStyle = color
    // If the assignment silently failed, fillStyle stays as the previous value.
    // A failed parse in strict-mode browsers throws — caught below.
    resolverCtx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = resolverCtx.getImageData(0, 0, 1, 1).data
    const result = a < 128
      ? fallback
      : `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`
    colorCache.set(color, result)
    return result
  } catch {
    colorCache.set(color, fallback)
    return fallback
  }
}

export function exportRoadmapToCanvas(
  roadmap: Roadmap,
  zoom: ZoomLevel
): HTMLCanvasElement {
  // ── 1. Compute all swimlane layouts ──────────────────────────────────────
  const layouts = roadmap.swimlanes.map((sw) =>
    computeSwimlaneLayout(roadmap.items, sw.id, roadmap.startDate, zoom)
  )

  const timelineWidth = getTimelineWidth(roadmap.startDate, roadmap.endDate, zoom)
  const totalWidth    = SIDEBAR_WIDTH + timelineWidth

  let totalHeight = HEADER_HEIGHT
  const laneOffsets: number[] = []
  for (const layout of layouts) {
    laneOffsets.push(totalHeight)
    totalHeight += layout.height
  }

  // ── 2. Create canvas ─────────────────────────────────────────────────────
  const canvas = document.createElement("canvas")
  canvas.width  = totalWidth  * SCALE
  canvas.height = totalHeight * SCALE
  canvas.style.width  = `${totalWidth}px`
  canvas.style.height = `${totalHeight}px`

  const ctx = canvas.getContext("2d")!
  ctx.scale(SCALE, SCALE)

  // ── 3. Background ─────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, totalWidth, totalHeight)

  // ── 4. Grid lines & timeline header ──────────────────────────────────────
  const gridLines = getGridLines(roadmap.startDate, roadmap.endDate, zoom)

  // Header background
  ctx.fillStyle = C.card
  ctx.fillRect(0, 0, totalWidth, HEADER_HEIGHT)
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, HEADER_HEIGHT)
  ctx.lineTo(totalWidth, HEADER_HEIGHT)
  ctx.stroke()

  // Vertical grid lines + labels
  for (const gl of gridLines) {
    const x = SIDEBAR_WIDTH + gl.x
    ctx.strokeStyle = gl.isMajor ? C.gridMajor : C.gridMinor
    ctx.lineWidth = gl.isMajor ? 1 : 0.5
    ctx.beginPath()
    ctx.moveTo(x, HEADER_HEIGHT)
    ctx.lineTo(x, totalHeight)
    ctx.stroke()

    ctx.font = GRID_FONT
    ctx.fillStyle = gl.isMajor ? C.fg : C.mutedFg
    ctx.textAlign = "left"
    ctx.fillText(gl.label, x + 4, HEADER_HEIGHT - 8)
  }

  // ── 5. Sidebar label header ───────────────────────────────────────────────
  ctx.fillStyle = C.card
  ctx.fillRect(0, 0, SIDEBAR_WIDTH, HEADER_HEIGHT)
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(SIDEBAR_WIDTH, 0)
  ctx.lineTo(SIDEBAR_WIDTH, totalHeight)
  ctx.stroke()

  // Roadmap title in header
  ctx.font = "bold 13px system-ui, Arial, sans-serif"
  ctx.fillStyle = C.fg
  ctx.textAlign = "left"
  ctx.fillText(truncate(ctx, roadmap.title, SIDEBAR_WIDTH - 16), 12, HEADER_HEIGHT / 2 + 5)

  // ── 6. Swimlanes ──────────────────────────────────────────────────────────
  for (let li = 0; li < roadmap.swimlanes.length; li++) {
    const sw     = roadmap.swimlanes[li]
    const layout = layouts[li]
    const laneY  = laneOffsets[li]
    const laneH  = layout.height

    // Lane background (alternating)
    ctx.fillStyle = li % 2 === 0 ? C.muted : C.laneAltBg
    ctx.fillRect(SIDEBAR_WIDTH, laneY, timelineWidth, laneH)

    // Sidebar lane cell
    const laneColor = safeColor(sw.color, li % 2 === 0 ? C.muted : C.laneAltBg)
    ctx.fillStyle = laneColor
    ctx.fillRect(0, laneY, SIDEBAR_WIDTH, laneH)

    // Lane label
    ctx.font = LANE_LABEL_FONT
    ctx.fillStyle = C.fg
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(truncate(ctx, sw.label, SIDEBAR_WIDTH - 24), 12, laneY + laneH / 2)

    // Bottom border
    ctx.strokeStyle = C.border
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, laneY + laneH)
    ctx.lineTo(totalWidth, laneY + laneH)
    ctx.stroke()

    // ── Items ────────────────────────────────────────────────────────────
    for (const li2 of layout.items) {
      const itemX = SIDEBAR_WIDTH + li2.left
      const itemY = laneY + li2.top
      const itemW = li2.width
      const itemH = li2.height
      const radius = li2.isSubItem ? 3 : 5

      // Bar background
      ctx.fillStyle = safeColor(li2.item.color ?? C.primary, C.primary)
      roundRect(ctx, itemX, itemY, itemW, itemH, radius)
      ctx.fill()

      // Progress overlay
      if (li2.item.percentComplete > 0 && !li2.isSubItem) {
        const progW = Math.max(0, (itemW * li2.item.percentComplete) / 100)
        ctx.save()
        roundRect(ctx, itemX, itemY, itemW, itemH, radius)
        ctx.clip()
        ctx.fillStyle = "rgba(0,0,0,0.18)"
        ctx.fillRect(itemX + progW, itemY, itemW - progW, itemH)
        ctx.restore()
      }

      // Item label
      if (itemW > 24) {
        ctx.font = ITEM_FONT
        ctx.fillStyle = C.primaryFg
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"
        const label = truncate(ctx, li2.item.title, itemW - 10)
        ctx.fillText(label, itemX + 6, itemY + itemH / 2)
      }
    }
  }

  // ── 7. Milestones ─────────────────────────────────────────────────────────
  for (const ms of roadmap.milestones) {
    const x = SIDEBAR_WIDTH + dateToPixel(ms.date, roadmap.startDate, zoom)
    ctx.strokeStyle = C.milestone
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(x, HEADER_HEIGHT)
    ctx.lineTo(x, totalHeight)
    ctx.stroke()
    ctx.setLineDash([])

    // Diamond marker
    ctx.fillStyle = C.milestone
    ctx.beginPath()
    ctx.moveTo(x, HEADER_HEIGHT - 2)
    ctx.lineTo(x + 5, HEADER_HEIGHT + 5)
    ctx.lineTo(x, HEADER_HEIGHT + 12)
    ctx.lineTo(x - 5, HEADER_HEIGHT + 5)
    ctx.closePath()
    ctx.fill()

    // Label
    ctx.font = MILESTONE_FONT
    ctx.fillStyle = C.milestone
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(ms.title, x + 7, HEADER_HEIGHT + 2)
  }

  // ── 8. Outer border ───────────────────────────────────────────────────────
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, totalWidth, totalHeight)

  return canvas
}
