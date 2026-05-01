import { Radar } from "lucide-react"
import { SettingsDialog } from "@/components/settings-dialog"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 ring-1 ring-inset ring-primary/30">
            <Radar className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <span className="text-sm font-semibold tracking-tight">OAuthSentry</span>
          <span className="ml-2 hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            beta
          </span>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="/" className="transition hover:text-foreground">
            Scanner
          </a>
          <a href="/" className="transition hover:text-foreground">
            Threat feed
          </a>
          <a
            href="https://vercel.com/kb"
            className="transition hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            Bulletin
          </a>
          <a href="/api-docs" className="transition hover:text-foreground">
            API Docs
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <SettingsDialog />
          <span className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1 text-xs">
            <span className="radar-pulse h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <span className="text-muted-foreground">Live</span>
          </span>
        </div>
      </div>
    </header>
  )
}
