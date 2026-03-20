"use client"

import dynamic from "next/dynamic"
import { Component, type ReactNode } from "react"

const RoadmapContainer = dynamic(
  () =>
    import("@/components/RoadmapContainer").then((mod) => ({
      default: mod.RoadmapContainer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading roadmap...</p>
      </div>
    ),
  }
)

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace" }}>
          <h1 style={{ color: "red" }}>Something went wrong</h1>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.7 }}>
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Home() {
  return (
    <ErrorBoundary>
      <RoadmapContainer />
    </ErrorBoundary>
  )
}
