"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { ExternalLink, Rss, RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { RiskScoreBadge } from "@/components/risk-score-badge"
import { Button } from "@/components/ui/button"

interface ThreatItem {
  id: string
  title: string
  summary: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  indicatorKind: string
  indicator: string
  source: string
  reference?: string
  publishedAt: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

// Custom hook to get current time safely (avoids prerender issues in Next.js 16)
function useNow() {
  const [now, setNow] = useState<number | null>(null)
  
  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])
  
  return now
}

function formatRelative(dateInput: string | Date, now: number | null) {
  if (now === null) return "..."
  const then = new Date(dateInput).getTime()
  const diff = Math.max(0, now - then)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days >= 1) return `${days}d ago`
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours >= 1) return `${hours}h ago`
  const mins = Math.floor(diff / (1000 * 60))
  if (mins >= 1) return `${mins}m ago`
  return "just now"
}

const indicatorLabel: Record<string, string> = {
  oauth_client_id: "OAuth",
  oauth_client: "OAuth",
  domain: "Domain",
  package: "npm",
  npm: "npm",
  hash: "Hash",
  cve: "CVE",
}

export function IocFeed() {
  const now = useNow()
  
  // Always fetch from live API - no seeded fallback
  const { data, error, isLoading, mutate } = useSWR<{ 
    items: ThreatItem[]
    sources?: string[]
    fetchedAt?: string
    message?: string 
  }>(
    '/api/threat-feed',
    fetcher,
    { 
      refreshInterval: 60000, // Auto-refresh every minute
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  const items = data?.items || []
  const isLive = items.length > 0 && !error

  return (
    <aside
      id="feed"
      className="flex h-full flex-col rounded-lg border border-border bg-card overflow-hidden"
      aria-label="Live threat feed"
    >
      <div className="flex items-center justify-between border-b border-border px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2">
          <Rss className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
          <h2 className="text-sm font-semibold tracking-tight">Threat Feed</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            title="Refresh feed"
            className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Refresh threat feed"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground hover:text-foreground ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[10px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">
              <Wifi className="h-3 w-3" />
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
              <WifiOff className="h-3 w-3" />
              {isLoading ? 'CONNECTING' : 'OFFLINE'}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 bg-destructive/10 border-b border-border flex items-center gap-2 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>Unable to fetch live data - APIs may be rate-limited</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Fetching Live Threats</p>
              <p className="text-xs text-muted-foreground mt-1">Connecting to NVD, OSV, GitHub Security...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            <div>
              <p className="text-sm font-medium">No Live Data Available</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                {data?.message || "External APIs may be rate-limited. Click refresh to try again."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => mutate()} className="mt-2">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {items.map((ioc) => (
              <li key={ioc.id} className="px-3 sm:px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <RiskScoreBadge level={ioc.severity} />
                  <time className="font-mono text-[10px] sm:text-[11px] text-muted-foreground flex-shrink-0">
                    {formatRelative(ioc.publishedAt, now)}
                  </time>
                </div>
                <h3 className="text-xs sm:text-sm font-medium leading-snug line-clamp-2">{ioc.title}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
                  {ioc.summary}
                </p>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <code className="block truncate max-w-full rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] text-muted-foreground">
                    <span className="text-foreground/80">
                      {indicatorLabel[ioc.indicatorKind] || ioc.indicatorKind}:
                    </span>{" "}
                    {ioc.indicator}
                  </code>
                  <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground truncate">
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
                    View Details
                    <ExternalLink className="h-3 w-3 flex-shrink-0" aria-hidden />
                  </a>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {data?.fetchedAt && (
        <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground shrink-0">
          <div className="flex items-center justify-between">
            <span>Updated: {formatRelative(data.fetchedAt, now)}</span>
            {data.sources && (
              <span className="text-muted-foreground/70">
                {data.sources.join(' + ')}
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
