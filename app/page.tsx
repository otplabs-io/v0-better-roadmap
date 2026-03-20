import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Map, ArrowRight, BarChart3, Layers, Download } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Map className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Better Roadmap</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Plan your product roadmap visually
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
            Better Roadmap gives product managers a drag-and-drop timeline to organize
            features, track progress, and share plans with stakeholders -- all in
            one place.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up" className="gap-2">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                Swimlanes
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Organize work by team, theme, or category with customizable
                swimlanes that keep your roadmap clear.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                Track progress
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Set status, assign owners, and track percent completion for every
                item and sub-task on your roadmap.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                Export to PNG
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Share your roadmap with anyone by exporting a polished PNG image
                at the click of a button.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Better Roadmap
      </footer>
    </div>
  )
}
