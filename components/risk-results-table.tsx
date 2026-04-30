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
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { RiskFinding, AssetKind } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { RiskScoreBadge } from "@/components/risk-score-badge"

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
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {f.headline}
                    </p>
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
                <div className="border-t border-border bg-background/40 px-4 py-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          Identifier
                        </h4>
                        <code className="mt-1 block break-all rounded bg-muted px-2 py-1.5 font-mono text-xs">
                          {f.asset.identifier}
                        </code>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          Reasoning
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                          {f.reasoning}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          Recommendation
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                          {f.recommendation}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          Risk factors
                        </h4>
                        <ul className="mt-1.5 space-y-1.5">
                          {f.factors.map((factor, i) => (
                            <li key={i} className="flex gap-2 text-xs">
                              <span
                                aria-hidden
                                className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary"
                              />
                              <span>
                                <span className="font-medium">{factor.label}</span>
                                <span className="block text-muted-foreground">
                                  {factor.detail}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {f.asset.scopes && f.asset.scopes.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                            Scopes
                          </h4>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {f.asset.scopes.map((s) => (
                              <code
                                key={s}
                                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
                              >
                                {s}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}

                      {(f.level === "critical" || f.level === "high") && (
                        <div className="flex flex-wrap gap-2 pt-1">
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
                    </div>
                  </div>
                </div>
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
