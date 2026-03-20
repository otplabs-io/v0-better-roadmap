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
    if (!canvasRef.current) return
    try {
      const { default: html2canvas } = await import("html2canvas")

      // html2canvas can't parse modern CSS color functions (oklch, lab, etc).
      // Snapshot computed colors from the live DOM first, then override via onclone.
      const liveRoot = document.documentElement
      const cssVarNames = [
        "--background", "--foreground", "--card", "--card-foreground",
        "--border", "--muted", "--muted-foreground", "--primary",
        "--primary-foreground", "--secondary", "--secondary-foreground",
        "--accent", "--accent-foreground", "--ring",
      ]

      // Resolve each var to its computed value as a plain sRGB hex using canvas
      const resolvedVars: Record<string, string> = {}
      const tmpCanvas = document.createElement("canvas")
      tmpCanvas.width = 1; tmpCanvas.height = 1
      const ctx = tmpCanvas.getContext("2d")!
      for (const v of cssVarNames) {
        const raw = getComputedStyle(liveRoot).getPropertyValue(v).trim()
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = raw
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
        resolvedVars[v] = `rgb(${r},${g},${b})`
        console.log("[v0] resolved", v, raw, "->", resolvedVars[v])
      }

      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: resolvedVars["--background"] ?? "#ffffff",
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc) => {
          const root = clonedDoc.documentElement
          for (const [k, v] of Object.entries(resolvedVars)) {
            root.style.setProperty(k, v)
          }
        },
      })

      const link = document.createElement("a")
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-roadmap.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
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
