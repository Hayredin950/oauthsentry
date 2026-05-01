"use client"

import type { RiskFinding } from "@/lib/types"
import { AlertTriangle, CheckCircle2, Clock, Database } from "lucide-react"

interface MetricsDashboardProps {
  findings: RiskFinding[]
  assetsScanned: number
  lastUpdated: Date | null
}

// Metrics dashboard component showing security posture at a glance
export function MetricsDashboard({ findings, assetsScanned, lastUpdated }: MetricsDashboardProps) {
  const critical = findings.filter((f) => f.level === "critical").length
  const high = findings.filter((f) => f.level === "high").length
  const medium = findings.filter((f) => f.level === "medium").length
  const low = findings.filter((f) => f.level === "low").length
  const total = findings.length

  const metrics = [
    {
      label: "Assets Monitored",
      value: assetsScanned,
      icon: Database,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Critical Findings",
      value: critical,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: "High Findings",
      value: high,
      icon: AlertTriangle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Total Findings",
      value: total,
      icon: CheckCircle2,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ]

  const formatTime = (date: Date | null) => {
    if (!date) return "Never"
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="mb-8 space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className={`rounded-lg p-2.5 ${metric.bgColor}`}>
                <Icon className={`h-5 w-5 ${metric.color}`} aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{metric.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Risk Breakdown Bar */}
      {total > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Risk Breakdown
          </p>
          <div className="flex h-8 overflow-hidden rounded-full bg-background">
            {critical > 0 && (
              <div
                className="flex items-center justify-center bg-red-500/80 text-white text-[11px] font-semibold"
                style={{ width: `${(critical / total) * 100}%` }}
              >
                {critical > 1 ? `${critical}` : ""}
              </div>
            )}
            {high > 0 && (
              <div
                className="flex items-center justify-center bg-orange-500/80 text-white text-[11px] font-semibold"
                style={{ width: `${(high / total) * 100}%` }}
              >
                {high > 1 ? `${high}` : ""}
              </div>
            )}
            {medium > 0 && (
              <div
                className="flex items-center justify-center bg-yellow-500/80 text-white text-[11px] font-semibold"
                style={{ width: `${(medium / total) * 100}%` }}
              >
                {medium > 1 ? `${medium}` : ""}
              </div>
            )}
            {low > 0 && (
              <div
                className="flex items-center justify-center bg-blue-500/80 text-white text-[11px] font-semibold"
                style={{ width: `${(low / total) * 100}%` }}
              >
                {low > 1 ? `${low}` : ""}
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-red-500/80 align-middle mr-1.5" />
              Critical: {critical}
            </span>
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-orange-500/80 align-middle mr-1.5" />
              High: {high}
            </span>
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-500/80 align-middle mr-1.5" />
              Medium: {medium}
            </span>
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500/80 align-middle mr-1.5" />
              Low: {low}
            </span>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-4 py-2.5">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <p className="text-xs text-muted-foreground">
          Last updated: <span className="font-medium text-foreground">{formatTime(lastUpdated)}</span>
        </p>
      </div>
    </div>
  )
}
