import {
  differenceInCalendarDays,
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  format,
  isAfter,
  isBefore,
  addQuarters,
} from "date-fns"
import type { ZoomLevel } from "@/types/roadmap"

export const ZOOM_CONFIG: Record<
  ZoomLevel,
  { dayWidth: number; label: string }
> = {
  weekly: { dayWidth: 40, label: "Weekly" },
  monthly: { dayWidth: 16, label: "Monthly" },
  quarterly: { dayWidth: 5, label: "Quarterly" },
}

export function getTimelineWidth(
  startDate: Date,
  endDate: Date,
  zoom: ZoomLevel
): number {
  const days = differenceInCalendarDays(endDate, startDate)
  return days * ZOOM_CONFIG[zoom].dayWidth
}

export function dateToPixel(
  date: Date,
  timelineStart: Date,
  zoom: ZoomLevel
): number {
  const days = differenceInCalendarDays(date, timelineStart)
  return days * ZOOM_CONFIG[zoom].dayWidth
}

export function pixelToDate(
  px: number,
  timelineStart: Date,
  zoom: ZoomLevel
): Date {
  const days = Math.round(px / ZOOM_CONFIG[zoom].dayWidth)
  return addDays(timelineStart, days)
}

export interface GridLine {
  x: number
  label: string
  isMajor: boolean
}

export function getGridLines(
  startDate: Date,
  endDate: Date,
  zoom: ZoomLevel
): GridLine[] {
  const lines: GridLine[] = []

  if (zoom === "weekly") {
    let current = startOfWeek(startDate, { weekStartsOn: 1 })
    if (isBefore(current, startDate)) current = addWeeks(current, 1)
    let monthTracker = -1

    while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
      const x = dateToPixel(current, startDate, zoom)
      const currentMonth = current.getMonth()
      const isMajor = currentMonth !== monthTracker
      monthTracker = currentMonth

      lines.push({
        x,
        label: isMajor
          ? format(current, "MMM d")
          : format(current, "d"),
        isMajor,
      })
      current = addWeeks(current, 1)
    }
  } else if (zoom === "monthly") {
    let current = startOfMonth(startDate)
    if (isBefore(current, startDate)) current = addMonths(current, 1)

    while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
      const x = dateToPixel(current, startDate, zoom)
      const isMajor = current.getMonth() === 0

      lines.push({
        x,
        label: isMajor
          ? format(current, "MMM yyyy")
          : format(current, "MMM"),
        isMajor,
      })
      current = addMonths(current, 1)
    }
  } else {
    let current = startOfQuarter(startDate)
    if (isBefore(current, startDate)) current = addQuarters(current, 1)

    while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
      const x = dateToPixel(current, startDate, zoom)
      const isMajor = current.getMonth() === 0

      lines.push({
        x,
        label: `Q${Math.floor(current.getMonth() / 3) + 1} ${format(current, "yyyy")}`,
        isMajor,
      })
      current = addQuarters(current, 1)
    }
  }

  return lines
}

export function snapToGrid(
  date: Date,
  zoom: ZoomLevel
): Date {
  if (zoom === "weekly") {
    return date
  } else if (zoom === "monthly") {
    return date
  }
  return date
}

export function clampDate(date: Date, min: Date, max: Date): Date {
  if (isBefore(date, min)) return min
  if (isAfter(date, max)) return max
  return date
}
