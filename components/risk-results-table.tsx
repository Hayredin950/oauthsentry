"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Loader2,
  MessageSquareWarning,
  Package,
  ShieldCheck,
  Ticket,
  Webhook,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { RiskFinding, AssetKind } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { RiskScoreBadge } from "@/components/risk-score-badge"
import { RiskTimelineComponent } from "@/components/risk-timeline"
import { TeamCollaboration } from "@/components/team-collaboration"

const kindIcon: Record<AssetKind, typeof Package> = {
  oauth_app: ShieldCheck,
  npm_package: Package,
  saas_tool: Webhook,
}

const kindLabel: Record<AssetKind, string> = {
  oauth_app: "OAuth app",
  npm_package: "npm",
  saas_tool: "SaaS",
}

type Tab = "overview" | "analysis" | "actions"

function FindingDetail({
  f,
  onFileTicket,
  onSendAlert,
}: {
  f: RiskFinding
  onFileTicket: (id: string) => void
  onSendAlert: (id: string) => void
}) {
  const [tab, setTab] = useState<Tab>("overview")
  const [remediationStatus, setRemediationStatus] = useState(f.remediationStatus ?? "open")
  const [remediationDate, setRemediationDate] = useState("")

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "analysis", label: "Analysis" },
    { id: "actions", label: "Actions" },
  ]

  return (
    <div className="border-t border-border bg-background/40">
      {/* Tab bar */}
      <div className="flex border-b border-border px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Left: identifier + reasoning + recommendation */}
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Identifier</p>
                <code className="block break-all rounded bg-muted px-2 py-1.5 font-mono text-xs">
                  {f.asset.identifier}
                </code>
              </div>
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Reasoning</p>
                <p className="text-xs leading-relaxed text-foreground/90">{f.reasoning}</p>
              </div>
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Recommendation</p>
                <p className="text-xs leading-relaxed text-foreground/90">{f.recommendation}</p>
              </div>
            </div>

            {/* Right: risk factors + scopes + threat intel */}
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Risk Factors</p>
                <ul className="space-y-1">
                  {f.factors.map((factor, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>
                        <span className="font-medium">{factor.label}</span>
                        <span className="block text-muted-foreground">{factor.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {f.asset.scopes && f.asset.scopes.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Scopes</p>
                  <div className="flex flex-wrap gap-1">
                    {f.asset.scopes.map((s) => (
                      <code key={s} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{s}</code>
                    ))}
                  </div>
                </div>
              )}

              {f.cveReferences && f.cveReferences.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Threat Intelligence</p>
                  <div className="space-y-1">
                    {f.cveReferences.map((ref, i) => (
                      <div key={i} className="flex items-center gap-2 rounded bg-muted/60 px-2 py-1.5">
                        <code className="font-mono text-xs font-semibold text-blue-600">{ref.id}</code>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 font-medium">
                          CVSS {ref.score}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-1">{ref.source}</span>
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${ref.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-[10px] flex items-center gap-0.5"
                        >
                          View <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYSIS TAB */}
        {tab === "analysis" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Remediation steps */}
            {f.remediationRecommendations && f.remediationRecommendations.length > 0 && (
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Remediation Steps</p>
                <ul className="space-y-1.5">
                  {f.remediationRecommendations.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 font-bold text-[10px]">
                        {i + 1}
                      </span>
                      <span className="text-foreground/90">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              {/* Risk Timeline */}
              <RiskTimelineComponent timeline={f.timeline} detectedAt={f.detectedAt} />

              {/* Scoring Breakdown */}
              {f.riskFactorBreakdown && f.riskFactorBreakdown.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Scoring Breakdown</p>
                  <div className="space-y-1.5">
                    {f.riskFactorBreakdown.map((item, i) => {
                      const pct = Math.round((item.points / Math.max(f.score, 1)) * 100)
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-32 text-[11px] text-muted-foreground truncate">{item.factor}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-amber-500/80" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold w-6 text-right">{item.points}</span>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-[11px] font-mono text-muted-foreground">Total Score</span>
                      <span className="text-xs font-bold">{f.score}/100</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIONS TAB */}
        {tab === "actions" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              {(f.level === "critical" || f.level === "high") && (
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    status={f.ticketStatus ?? "none"}
                    icon={Ticket}
                    doneLabel="Ticket filed"
                    label="File Linear ticket"
                    onClick={() => onFileTicket(f.assetId)}
                  />
                  <ActionButton
                    status={f.alertStatus ?? "none"}
                    icon={MessageSquareWarning}
                    doneLabel="Slack sent"
                    label="Send Slack alert"
                    onClick={() => onSendAlert(f.assetId)}
                  />
                </div>
              )}

              {/* False Positive */}
              <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={f.isFalsePositive || false}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  <span className="text-xs font-medium">Mark as false positive</span>
                </label>
              </div>

              {/* Linked ticket */}
              {f.linkedTicketUrl && (
                <a
                  href={f.linkedTicketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Linear
                </a>
              )}
            </div>

            <div className="space-y-3">
              {/* Remediation Status */}
              <div className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Remediation Status</p>
                  <select
                    value={remediationStatus}
                    onChange={(e) => setRemediationStatus(e.target.value as "open" | "in-progress" | "resolved")}
                    className="rounded bg-muted px-2 py-1 text-xs font-medium border border-border/60 cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                {(remediationStatus === "in-progress" || remediationStatus === "resolved") && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="date"
                        value={remediationDate}
                        onChange={(e) => setRemediationDate(e.target.value)}
                        className="rounded bg-muted px-2 py-1 text-xs border border-border/60"
                      />
                    </div>
                    {remediationStatus === "resolved" && (
                      <p className="flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Marked as resolved
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Team Collaboration */}
              {(f.level === "critical" || f.level === "high") && (
                <TeamCollaboration findingId={f.assetId} linkedTicketUrl={f.linkedTicketUrl} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function RiskResultsTable({
  findings,
  onFileTicket,
  onSendAlert,
}: {
  findings: RiskFinding[]
  onFileTicket: (assetId: string) => void
  onSendAlert: (assetId: string) => void
}) {
  const [open, setOpen] = useState<string | null>(findings[0]?.assetId ?? null)

  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
        <ShieldCheck className="h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">No scan yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Paste an inventory and run a scan to see findings ranked by risk.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        <div>Asset</div>
        <div className="hidden sm:block">Risk</div>
        <div className="text-right">Actions</div>
      </div>

      <ul className="divide-y divide-border">
        {findings.map((f) => {
          const Icon = kindIcon[f.asset.kind]
          const isOpen = open === f.assetId
          return (
            <li key={f.assetId}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : f.assetId)}
                className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-left transition hover:bg-muted/40"
                aria-expanded={isOpen}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{f.asset.name}</span>
                      <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
                        {kindLabel[f.asset.kind]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{f.headline}</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <RiskScoreBadge level={f.level} score={f.score} />
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="sm:hidden">
                    <RiskScoreBadge level={f.level} />
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  )}
                </div>
              </button>

              {isOpen && (
                <FindingDetail
                  f={f}
                  onFileTicket={onFileTicket}
                  onSendAlert={onSendAlert}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ActionButton({
  status,
  icon: Icon,
  label,
  doneLabel,
  onClick,
}: {
  status: "none" | "filing" | "filed" | "sending" | "sent"
  icon: typeof Ticket
  label: string
  doneLabel: string
  onClick: () => void
}) {
  const isPending = status === "filing" || status === "sending"
  const isDone = status === "filed" || status === "sent"

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isPending || isDone}
      size="sm"
      variant={isDone ? "secondary" : "outline"}
      className={cn("gap-1.5", isDone && "text-[var(--chart-4)]")}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : isDone ? (
        <CircleCheck className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Icon className="h-3.5 w-3.5" aria-hidden />
      )}
      <span>{isDone ? doneLabel : isPending ? "Working\u2026" : label}</span>
    </Button>
  )
}
