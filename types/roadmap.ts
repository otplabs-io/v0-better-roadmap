export type ItemStatus = "Idea" | "Planned" | "In Progress" | "Blocked" | "Done"

export interface Swimlane {
  id: string
  label: string
  color: string
}

export interface RoadmapItem {
  id: string
  title: string
  description: string
  owner: string
  status: ItemStatus
  startDate: Date
  endDate: Date
  swimlaneId: string
  color: string
}

export interface Milestone {
  id: string
  title: string
  date: Date
}

export type ZoomLevel = "weekly" | "monthly" | "quarterly"

export interface Roadmap {
  id: string
  title: string
  startDate: Date
  endDate: Date
  swimlanes: Swimlane[]
  items: RoadmapItem[]
  milestones: Milestone[]
}
