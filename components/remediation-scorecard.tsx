"use client"

import type { RiskFinding } from "@/lib/types"
import { Zap, Clock, CheckCircle2 } from "lucide-react"

interface RemediationScoreCardProps {
  findings: RiskFinding[]
}

export function RemediationScorecard({ findings }: RemediationScoreCardProps) {
  // Calculate remediation metrics
  const totalFindings = findings.length
  const resolvedFindings = findings.filter((f) => f.remediationStatus === "resolved").length
  const inProgressFindings = findings.filter((f) => f.remediationStatus === "in-progress").length
  const openFindings = findings.filter((f) => f.remediationStatus === "open" || !f.remediationStatus).length

  // Calculate average remediation time
  const remediedWithDates = findings.filter(
    (f) => f.remediationStatus === "resolved" && f.detectedAt && f.remediationDate
  )
  const avgRemediationDays =
    remediedWithDates.length > 0
      ? Math.round(
          remediedWithDates.reduce((sum, f) => {
            const detected = new Date(f.detectedAt!).getTime()
            const remediated = new Date(f.remediationDate!).getTime()
            return sum + (remediated - detected) / (1000 * 60 * 60 * 24)
          }, 0) / remediedWithDates.length
        )
      : 0

  // Find fastest/slowest remediation
  const remediationTimes = remediedWithDates
    .map((f) => ({
      name: f.asset.name,
      days: Math.round(
        (new Date(f.remediationDate!).getTime() - new Date(f.detectedAt!).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }))
    .sort((a, b) => a.days - b.days)

  const fastestRemediation = remediationTimes[0]
  const slowestRemediation = remediationTimes[remediationTimes.length - 1]

  // Calculate resolution rate
  const resolutionRate = totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : 0

  return (
    <div className="mt-6 space-y-4">
      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
          Remediation Scorecard
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Resolution Rate */}
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Resolved
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-semibold">{resolutionRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {resolvedFindings} of {totalFindings}
          </p>
        </div>

        {/* Average Remediation Time */}
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-600" />
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Avg Time
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-semibold">{avgRemediationDays}d</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {remediedWithDates.length} resolved
          </p>
        </div>

        {/* In Progress Count */}
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-orange-600" />
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              In Progress
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-semibold">{inProgressFindings}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {openFindings} open
          </p>
        </div>

        {/* Efficiency Score */}
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-amber-600/30 flex items-center justify-center">
              <span className="text-[9px] font-bold text-amber-600">+</span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Efficiency
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-semibold">
            {totalFindings > 0 ? Math.round(((inProgressFindings + resolvedFindings) / totalFindings) * 100) : 0}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Working on remediation
          </p>
        </div>
      </div>

      {/* Remediation Speed Insights */}
      {fastestRemediation && slowestRemediation && (
        <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Speed Insights
          </p>
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-muted-foreground">Fastest remediation</p>
              <p className="font-semibold">
                {fastestRemediation.name} ({fastestRemediation.days}d)
              </p>
            </div>
            {slowestRemediation && slowestRemediation.days !== fastestRemediation.days && (
              <div>
                <p className="text-muted-foreground">Slowest remediation</p>
                <p className="font-semibold">
                  {slowestRemediation.name} ({slowestRemediation.days}d)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
