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
    const { default: html2canvas } = await import("html2canvas")

    // html2canvas doesn't support oklch/lab CSS color functions.
    // We use onclone to replace all CSS custom properties with resolved hex
    // equivalents before the snapshot is taken.
    const hexVars: Record<string, string> = {
      "--background": "#faf8f5",
      "--foreground": "#1a1a1a",
      "--card": "#ffffff",
      "--card-foreground": "#1a1a1a",
      "--border": "#e2ddd8",
      "--muted": "#f2ede8",
      "--muted-foreground": "#6b6460",
      "--primary": "#f96302",
      "--primary-foreground": "#ffffff",
      "--secondary": "#f2ede8",
      "--secondary-foreground": "#1a1a1a",
      "--accent": "#fde8d5",
      "--accent-foreground": "#1a1a1a",
    }

    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      onclone: (_doc, el) => {
        // Apply plain hex vars to the cloned root so html2canvas sees no oklch
        const root = el.ownerDocument.documentElement
        Object.entries(hexVars).forEach(([k, v]) => {
          root.style.setProperty(k, v)
        })
      },
    })

    const link = document.createElement("a")
    link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-roadmap.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
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
