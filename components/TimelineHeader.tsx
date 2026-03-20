"use client"

import { useState, type RefObject } from "react"
import type { ZoomLevel } from "@/types/roadmap"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Plus, Download, Flag } from "lucide-react"
import { ZOOM_CONFIG } from "@/lib/timelineUtils"
import { UserMenu } from "@/components/UserMenu"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface TimelineHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  zoom: ZoomLevel
  onZoomChange: (zoom: ZoomLevel) => void
  onAddMilestone: () => void
  canvasRef: RefObject<HTMLDivElement | null>
}

const ZOOM_ORDER: ZoomLevel[] = ["quarterly", "monthly", "weekly"]

export function TimelineHeader({
  title,
  onTitleChange,
  zoom,
  onZoomChange,
  onAddMilestone,
  canvasRef,
}: TimelineHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)

  const currentIndex = ZOOM_ORDER.indexOf(zoom)

  const handleZoomIn = () => {
    if (currentIndex < ZOOM_ORDER.length - 1) {
      onZoomChange(ZOOM_ORDER[currentIndex + 1])
    }
  }

  const handleZoomOut = () => {
    if (currentIndex > 0) {
      onZoomChange(ZOOM_ORDER[currentIndex - 1])
    }
  }

  const handleExport = async () => {
    const node = canvasRef.current
    if (!node) return
    try {
      // Neither html2canvas nor dom-to-image-more can handle oklab/oklch from
      // Tailwind v4. We bypass all CSS-parsing libraries entirely and render
      // using the browser's native foreignObject SVG → canvas pipeline.
      // Before serializing we walk every element and inline all computed color
      // properties as plain rgb() so no library ever sees oklab.

      const COLOR_PROPS = [
        "color", "background-color", "border-color", "border-top-color",
        "border-right-color", "border-bottom-color", "border-left-color",
        "outline-color", "text-decoration-color", "fill", "stroke",
      ]

      // Use a 1×1 canvas to convert any color string → sRGB rgb(r,g,b)
      const cvs = document.createElement("canvas")
      cvs.width = cvs.height = 1
      const ctx = cvs.getContext("2d")!

      function toRgb(color: string): string {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = color
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
        return a < 255 ? `rgba(${r},${g},${b},${(a / 255).toFixed(3)})` : `rgb(${r},${g},${b})`
      }

      // Deep clone the target node
      const clone = node.cloneNode(true) as HTMLElement
      clone.style.position = "fixed"
      clone.style.top = "-9999px"
      clone.style.left = "-9999px"
      document.body.appendChild(clone)

      // Walk every element in the clone, mirror computed styles from the
      // original, and convert color values to rgb().
      const origEls = Array.from(node.querySelectorAll("*")) as HTMLElement[]
      const cloneEls = Array.from(clone.querySelectorAll("*")) as HTMLElement[]

      origEls.forEach((orig, i) => {
        const cl = cloneEls[i]
        if (!cl) return
        const cs = getComputedStyle(orig)
        // Copy all computed styles as inline
        cl.setAttribute("style", cs.cssText)
        // Now overwrite every color property with a safe rgb() value
        for (const prop of COLOR_PROPS) {
          const val = cs.getPropertyValue(prop).trim()
          if (val && val !== "none" && val !== "transparent") {
            try { cl.style.setProperty(prop, toRgb(val)) } catch { /* skip */ }
          }
        }
        // Also fix background shorthand
        const bg = cs.getPropertyValue("background-color").trim()
        if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
          cl.style.backgroundColor = toRgb(bg)
        }
      })

      // Serialize to SVG foreignObject and draw onto a canvas
      const { width, height } = node.getBoundingClientRect()
      const scale = 2
      const xml = new XMLSerializer().serializeToString(clone)
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">${xml}</div>
          </foreignObject>
        </svg>`

      document.body.removeChild(clone)

      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        const out = document.createElement("canvas")
        out.width = width * scale
        out.height = height * scale
        const outCtx = out.getContext("2d")!
        outCtx.scale(scale, scale)
        outCtx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        const link = document.createElement("a")
        link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-roadmap.png`
        link.href = out.toDataURL("image/png")
        link.click()
      }
      img.onerror = (e) => { URL.revokeObjectURL(url); console.error("[v0] SVG load error", e) }
      img.src = url
    } catch (err) {
      console.error("[v0] Export PNG failed:", err)
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to dashboard</span>
          </Link>
        </Button>
        <div className="h-5 w-px bg-border" />
        {isEditing ? (
          <input
            className="rounded-md border border-input bg-background px-2 py-1 text-lg font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              onTitleChange(editValue)
              setIsEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onTitleChange(editValue)
                setIsEditing(false)
              }
            }}
            autoFocus
          />
        ) : (
          <h1
            className="cursor-pointer text-lg font-semibold text-foreground transition-colors hover:text-primary"
            onClick={() => {
              setEditValue(title)
              setIsEditing(true)
            }}
          >
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddMilestone}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Milestone
        </Button>

        <div className="mx-2 h-5 w-px bg-border" />

        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomOut}
            disabled={currentIndex === 0}
          >
            <ZoomOut className="h-3.5 w-3.5" />
            <span className="sr-only">Zoom out</span>
          </Button>
          <span className="min-w-[70px] text-center text-xs font-medium text-muted-foreground">
            {ZOOM_CONFIG[zoom].label}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomIn}
            disabled={currentIndex === ZOOM_ORDER.length - 1}
          >
            <ZoomIn className="h-3.5 w-3.5" />
            <span className="sr-only">Zoom in</span>
          </Button>
        </div>

        <div className="mx-2 h-5 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Export PNG
        </Button>

        <div className="mx-2 h-5 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  )
}
