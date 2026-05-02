"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { ExternalLink, Rss, RefreshCw, AlertCircle } from "lucide-react"
import { seedIOCs } from "@/lib/seed-data"
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

function formatRelative(dateInput: string | Date) {
  const then = new Date(dateInput).getTime()
  const now = Date.now()
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
  oauth_client_id: "OAuth client",
  oauth_client: "OAuth client",
  domain: "Domain",
  package: "npm",
  npm: "npm",
  hash: "Hash",
  cve: "CVE",
}

export function IocFeed() {
  const [useLive, setUseLive] = useState(true)
  const { data, error, isLoading, mutate } = useSWR<{ items: ThreatItem[], fetchedAt?: string }>(
    useLive ? '/api/threat-feed' : null,
    fetcher,
    { 
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  )

  // Use live data if available, otherwise fall back to seed data
  const items: ThreatItem[] = useLive && data?.items?.length 
    ? data.items 
    : seedIOCs.map(ioc => ({
        ...ioc,
        publishedAt: ioc.publishedAt,
      }))

  const isLive = useLive && data?.items?.length && !error

  return (
    <aside
      id="feed"
      className="flex h-full flex-col rounded-lg border border-border bg-card overflow-hidden"
      aria-label="Live threat feed"
    >
      <div className="flex items-center justify-between border-b border-border px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2">
          <Rss className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
          <h2 className="text-sm font-semibold tracking-tight">Threat feed</h2>
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
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-shrink-0">
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'radar-pulse bg-primary' : 'bg-muted-foreground'}`} aria-hidden />
            {isLive ? 'Live' : 'Demo'}
          </span>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 bg-destructive/10 border-b border-border flex items-center gap-2 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>Using cached data - API unavailable</span>
          <button 
            onClick={() => setUseLive(false)}
            className="ml-auto underline hover:no-underline"
          >
            Use demo
          </button>
        </div>
      )}

      <ol className="flex-1 divide-y divide-border overflow-y-auto overflow-x-hidden">
        {items.map((ioc) => (
          <li key={ioc.id} className="px-3 sm:px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <RiskScoreBadge level={ioc.severity} />
              <time className="font-mono text-[10px] sm:text-[11px] text-muted-foreground flex-shrink-0">
                {formatRelative(ioc.publishedAt)}
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
                Source
                <ExternalLink className="h-3 w-3 flex-shrink-0" aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ol>

      {data?.fetchedAt && (
        <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          Last updated: {formatRelative(data.fetchedAt)} from NVD, OSV, GitHub
        </div>
      )}
    </aside>
  )
}
