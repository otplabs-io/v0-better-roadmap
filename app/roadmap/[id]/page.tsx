"use client"

import dynamic from "next/dynamic"
import { Component, type ReactNode, use } from "react"

const RoadmapContainer = dynamic(
  () =>
    import("@/components/RoadmapContainer").then((mod) => ({
      default: mod.RoadmapContainer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading roadmap...</p>
        </div>
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
        <div className="flex h-screen items-center justify-center bg-background p-10">
          <div className="max-w-md text-center">
            <h1 className="text-lg font-semibold text-destructive">Something went wrong</h1>
            <pre className="mt-4 whitespace-pre-wrap text-left text-xs text-muted-foreground">
              {this.state.error?.message}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <ErrorBoundary>
      <RoadmapContainer roadmapId={id} />
    </ErrorBoundary>
  )
}
