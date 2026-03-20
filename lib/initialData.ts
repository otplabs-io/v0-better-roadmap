import type { Roadmap } from "@/types/roadmap"

const ITEM_COLORS = {
  blue: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  orange: "#f97316",
}

const SWIMLANE_COLORS = {
  blue: "#eff6ff",
  emerald: "#ecfdf5",
  amber: "#fffbeb",
  rose: "#fff1f2",
}

export function createInitialData(): Roadmap {
  const now = new Date()
  const year = now.getFullYear()

  return {
    id: "roadmap-1",
    title: "Product Roadmap 2026",
    startDate: new Date(year, 0, 1),
    endDate: new Date(year, 11, 31),
    swimlanes: [
      { id: "sw-1", label: "Frontend", color: SWIMLANE_COLORS.blue },
      { id: "sw-2", label: "Backend", color: SWIMLANE_COLORS.emerald },
      { id: "sw-3", label: "Design", color: SWIMLANE_COLORS.amber },
      { id: "sw-4", label: "Infrastructure", color: SWIMLANE_COLORS.rose },
    ],
    items: [
      {
        id: "item-1",
        title: "Auth System Redesign",
        description: "Rebuild authentication flow with SSO support",
        owner: "Alice",
        status: "Done",
        startDate: new Date(year, 0, 6),
        endDate: new Date(year, 1, 14),
        swimlaneId: "sw-1",
        color: ITEM_COLORS.blue,
      },
      {
        id: "item-2",
        title: "API v2 Migration",
        description: "Migrate all endpoints to v2 REST API",
        owner: "Bob",
        status: "In Progress",
        startDate: new Date(year, 1, 1),
        endDate: new Date(year, 3, 30),
        swimlaneId: "sw-2",
        color: ITEM_COLORS.emerald,
      },
      {
        id: "item-3",
        title: "Design System v3",
        description: "Create comprehensive component library",
        owner: "Carol",
        status: "In Progress",
        startDate: new Date(year, 0, 15),
        endDate: new Date(year, 2, 31),
        swimlaneId: "sw-3",
        color: ITEM_COLORS.amber,
      },
      {
        id: "item-4",
        title: "K8s Migration",
        description: "Move from VMs to Kubernetes",
        owner: "Dave",
        status: "Planned",
        startDate: new Date(year, 2, 1),
        endDate: new Date(year, 5, 30),
        swimlaneId: "sw-4",
        color: ITEM_COLORS.rose,
      },
      {
        id: "item-5",
        title: "Dashboard Revamp",
        description: "New analytics dashboard with real-time data",
        owner: "Eve",
        status: "Planned",
        startDate: new Date(year, 3, 1),
        endDate: new Date(year, 5, 15),
        swimlaneId: "sw-1",
        color: ITEM_COLORS.sky,
      },
      {
        id: "item-6",
        title: "GraphQL Gateway",
        description: "Implement GraphQL layer for frontend consumption",
        owner: "Frank",
        status: "Idea",
        startDate: new Date(year, 5, 1),
        endDate: new Date(year, 8, 30),
        swimlaneId: "sw-2",
        color: ITEM_COLORS.orange,
      },
      {
        id: "item-7",
        title: "Mobile App Design",
        description: "Design mobile companion app",
        owner: "Carol",
        status: "Idea",
        startDate: new Date(year, 4, 1),
        endDate: new Date(year, 6, 31),
        swimlaneId: "sw-3",
        color: ITEM_COLORS.amber,
      },
      {
        id: "item-8",
        title: "CI/CD Pipeline Overhaul",
        description: "Rebuild deployment pipeline with GitHub Actions",
        owner: "Dave",
        status: "Idea",
        startDate: new Date(year, 7, 1),
        endDate: new Date(year, 9, 31),
        swimlaneId: "sw-4",
        color: ITEM_COLORS.rose,
      },
    ],
    milestones: [
      { id: "ms-1", title: "Q1 Review", date: new Date(year, 2, 31) },
      { id: "ms-2", title: "Beta Launch", date: new Date(year, 5, 15) },
      { id: "ms-3", title: "GA Release", date: new Date(year, 8, 1) },
    ],
  }
}
