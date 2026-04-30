"use client"

import { useCallback, useState } from "react"
import { ListChecks, Loader2, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { seedFindings, seedInventoryText } from "@/lib/seed-data"
import type { RiskFinding } from "@/lib/types"
import { RiskResultsTable } from "@/components/risk-results-table"
import { IocFeed } from "@/components/ioc-feed"

type ScanState = "idle" | "scanning" | "done"

export function RiskScanner() {
  const [inventory, setInventory] = useState(seedInventoryText)
  const [state, setState] = useState<ScanState>("idle")
  const [findings, setFindings] = useState<RiskFinding[]>([])

  const runScan = useCallback(async () => {
    setState("scanning")
    setFindings([])
    // Stream findings one at a time for a "live analysis" feel.
    // Day 2 will replace this with a real AI SDK 6 streaming agent.
    for (let i = 0; i < seedFindings.length; i++) {
      await new Promise((r) => setTimeout(r, 280 + Math.random() * 160))
      setFindings((prev) => [...prev, seedFindings[i]])
    }
    setState("done")
  }, [])

  const reset = useCallback(() => {
    setState("idle")
    setFindings([])
  }, [])

  const updateStatus = useCallback(
    (assetId: string, key: "ticketStatus" | "alertStatus", from: "filing" | "sending", to: "filed" | "sent") => {
      setFindings((prev) =>
        prev.map((f) => (f.assetId === assetId ? { ...f, [key]: from } : f)),
      )
      setTimeout(() => {
        setFindings((prev) =>
          prev.map((f) => (f.assetId === assetId ? { ...f, [key]: to } : f)),
        )
      }, 900)
    },
    [],
  )

  const handleFileTicket = useCallback(
    (assetId: string) => updateStatus(assetId, "ticketStatus", "filing", "filed"),
    [updateStatus],
  )
  const handleSendAlert = useCallback(
    (assetId: string) => updateStatus(assetId, "alertStatus", "sending", "sent"),
    [updateStatus],
  )

  const fileAllCriticalTickets = useCallback(() => {
    findings
      .filter((f) => (f.level === "critical" || f.level === "high") && f.ticketStatus !== "filed")
      .forEach((f, i) => {
        setTimeout(() => handleFileTicket(f.assetId), i * 250)
      })
  }, [findings, handleFileTicket])

  const counts = {
    total: findings.length,
    critical: findings.filter((f) => f.level === "critical").length,
    high: findings.filter((f) => f.level === "high").length,
  }

  return (
    <section
      id="scan"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6"
      aria-label="Stack scanner"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            01 — Scanner
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Audit your stack
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Paste your inventory of OAuth apps, npm packages, and SaaS tools. We{"\u2019"}ll
            cross-reference against live IOC sources and rank findings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state !== "idle" && (
            <Button onClick={reset} variant="ghost" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden />
                <h3 className="text-sm font-semibold tracking-tight">Inventory</h3>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {inventory.split("\n").filter(Boolean).length} items
              </span>
            </div>
            <Textarea
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
              spellCheck={false}
              rows={8}
              className="resize-none rounded-none border-0 bg-transparent font-mono text-xs leading-relaxed focus-visible:ring-0"
              placeholder="oauth: VendorName (client-id-or-domain)&#10;npm: package-name (package@version)&#10;saas: VendorName (vendor.com)"
              aria-label="Stack inventory"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                One asset per line. Format: <code className="font-mono">kind: name (identifier)</code>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={runScan}
                  disabled={state === "scanning" || inventory.trim().length === 0}
                  size="sm"
                  className="gap-1.5"
                >
                  {state === "scanning" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Play className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {state === "scanning" ? "Scanning\u2026" : "Run scan"}
                </Button>
              </div>
            </div>
          </div>

          {state !== "idle" && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Findings
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold">{counts.total}</span>{" "}
                  <span className="text-muted-foreground">analyzed</span>
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold text-[var(--chart-1)]">{counts.critical}</span>{" "}
                  <span className="text-muted-foreground">critical</span>
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold text-[var(--chart-2)]">{counts.high}</span>{" "}
                  <span className="text-muted-foreground">high</span>
                </span>
              </div>
              {state === "done" && counts.critical + counts.high > 0 && (
                <Button onClick={fileAllCriticalTickets} variant="outline" size="sm">
                  File tickets for high &amp; critical
                </Button>
              )}
            </div>
          )}

          <RiskResultsTable
            findings={findings}
            onFileTicket={handleFileTicket}
            onSendAlert={handleSendAlert}
          />
        </div>

        <div className="lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-20">
          <IocFeed />
        </div>
      </div>
    </section>
  )
}
