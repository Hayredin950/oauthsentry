import { ExternalLink, Rss } from "lucide-react"
import { seedIOCs } from "@/lib/seed-data"
import { RiskScoreBadge } from "@/components/risk-score-badge"

function formatRelative(iso: string) {
  const then = new Date(iso).getTime()
  const now = new Date("2026-04-30T12:00:00Z").getTime() // pinned for demo determinism
  const diff = Math.max(0, now - then)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days >= 1) return `${days}d ago`
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours >= 1) return `${hours}h ago`
  return "just now"
}

const indicatorLabel: Record<string, string> = {
  oauth_client_id: "OAuth client",
  domain: "Domain",
  package: "npm",
  hash: "Hash",
}

export function IocFeed() {
  return (
    <aside
      id="feed"
      className="flex h-full flex-col rounded-lg border border-border bg-card"
      aria-label="Live threat feed"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Rss className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold tracking-tight">Threat feed</h2>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="radar-pulse h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          Live
        </span>
      </div>

      <ol className="flex-1 divide-y divide-border overflow-y-auto">
        {seedIOCs.map((ioc) => (
          <li key={ioc.id} className="px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <RiskScoreBadge level={ioc.severity} />
              <time className="font-mono text-[11px] text-muted-foreground">
                {formatRelative(ioc.publishedAt)}
              </time>
            </div>
            <h3 className="text-sm font-medium leading-snug">{ioc.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {ioc.summary}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="block truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                <span className="text-foreground/80">
                  {indicatorLabel[ioc.indicatorKind]}:
                </span>{" "}
                {ioc.indicator}
              </code>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {ioc.source}
              </span>
            </div>
            {ioc.reference && (
              <a
                href={ioc.reference}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                Source
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ol>
    </aside>
  )
}
