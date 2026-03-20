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
  isMonth?: boolean
}

export function getGridLines(
  startDate: Date,
  endDate: Date,
  zoom: ZoomLevel
): GridLine[] {
  const lines: GridLine[] = []

  if (zoom === "weekly") {
    // Show weeks as minor, months as major
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
        isMonth: isMajor,
      })
      current = addWeeks(current, 1)
    }
  } else if (zoom === "monthly") {
    // Show months as major and weeks (4 per month) as minor sub-divisions
    let currentMonth = startOfMonth(startDate)
    if (isBefore(currentMonth, startDate)) currentMonth = addMonths(currentMonth, 1)

    while (isBefore(currentMonth, endDate) || currentMonth.getTime() === endDate.getTime()) {
      const x = dateToPixel(currentMonth, startDate, zoom)
      const isMajor = currentMonth.getMonth() === 0

      lines.push({
        x,
        label: isMajor
          ? format(currentMonth, "MMM yyyy")
          : format(currentMonth, "MMM"),
        isMajor,
        isMonth: true,
      })

      // Add 3 week markers within this month (at ~7, ~14, ~21 days)
      const nextMonth = addMonths(currentMonth, 1)
      const daysInMonth = differenceInCalendarDays(nextMonth, currentMonth)
      const weekWidth = daysInMonth / 4
      for (let w = 1; w <= 3; w++) {
        const weekDate = addDays(currentMonth, Math.round(weekWidth * w))
        if (isBefore(weekDate, endDate)) {
          const wx = dateToPixel(weekDate, startDate, zoom)
          lines.push({
            x: wx,
            label: `W${w + 1}`,
            isMajor: false,
            isMonth: false,
          })
        }
      }

      currentMonth = nextMonth
    }
  } else {
    // Quarterly: show quarters as major, months as minor
    let current = startOfQuarter(startDate)
    if (isBefore(current, startDate)) current = addQuarters(current, 1)

    while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
      const x = dateToPixel(current, startDate, zoom)
      const isMajor = current.getMonth() === 0

      lines.push({
        x,
        label: `Q${Math.floor(current.getMonth() / 3) + 1} ${format(current, "yyyy")}`,
        isMajor,
        isMonth: true,
      })
      current = addQuarters(current, 1)
    }

    // Add monthly sub-lines within quarterly view
    let monthCursor = startOfMonth(startDate)
    if (isBefore(monthCursor, startDate)) monthCursor = addMonths(monthCursor, 1)
    while (isBefore(monthCursor, endDate)) {
      // Skip quarter starts (already drawn)
      if (monthCursor.getMonth() % 3 !== 0) {
        const mx = dateToPixel(monthCursor, startDate, zoom)
        lines.push({
          x: mx,
          label: format(monthCursor, "MMM"),
          isMajor: false,
          isMonth: true,
        })
      }
      monthCursor = addMonths(monthCursor, 1)
    }
  }

  return lines
}

export function clampDate(date: Date, min: Date, max: Date): Date {
  if (isBefore(date, min)) return min
  if (isAfter(date, max)) return max
  return date
}
