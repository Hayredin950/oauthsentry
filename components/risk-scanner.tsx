"use client"

import { useCallback, useRef, useState } from "react"
import { ListChecks, Loader2, Play, RotateCcw, Sparkles, TriangleAlert, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { seedInventoryText } from "@/lib/seed-data"
import { demoFindings } from "@/lib/demo-findings"
import { parseInventory } from "@/lib/parse-inventory"
import type { RiskFinding, StackAsset } from "@/lib/types"
import { RiskResultsTable } from "@/components/risk-results-table"
import { IocFeed } from "@/components/ioc-feed"
import { MetricsDashboard } from "@/components/metrics-dashboard"

type ScanState = "idle" | "scanning" | "done" | "error"

export function RiskScanner() {
  const [inventory, setInventory] = useState(seedInventoryText)
  const [state, setState] = useState<ScanState>("idle")
  const [findings, setFindings] = useState<RiskFinding[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeAssetName, setActiveAssetName] = useState<string | null>(null)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const runScan = useCallback(async () => {
    const assets = parseInventory(inventory)
    if (assets.length === 0) {
      setErrorMsg("No valid assets parsed. Use format: kind: name (identifier)")
      setState("error")
      return
    }

    setState("scanning")
    setFindings([])
    setErrorMsg(null)
    setProgress({ done: 0, total: assets.length })
    setActiveAssetName(assets[0]?.name ?? null)
    setIsDemo(false)

    const ac = new AbortController()
    abortRef.current = ac

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets }),
        signal: ac.signal,
      })

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "")
        throw new Error(`Scan failed (${res.status}): ${txt || res.statusText}`)
      }

      // Parse NDJSON stream: one JSON object per line.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let queueIndex = 0

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          let evt: unknown
          try {
            evt = JSON.parse(trimmed)
          } catch {
            continue
          }
          handleEvent(evt as ScanEvent, assets, () => {
            queueIndex += 1
            setActiveAssetName(assets[queueIndex]?.name ?? null)
          })
        }
      }
      // flush any trailing line
      const tail = buffer.trim()
      if (tail) {
        try {
          handleEvent(JSON.parse(tail) as ScanEvent, assets, () => {})
        } catch {
          /* ignore */
        }
      }

      setState("done")
      setActiveAssetName(null)
      setLastScanTime(new Date())
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      console.log("[v0] scan error", (err as Error).message)
      setErrorMsg((err as Error).message)
      setState("error")
    }

    function handleEvent(evt: ScanEvent, all: StackAsset[], onAdvance: () => void) {
      if (evt.type === "finding") {
        setFindings((prev) => [...prev, evt.finding])
        setProgress((p) => ({ ...p, done: p.done + 1 }))
        onAdvance()
      } else if (evt.type === "error") {
        // Surface a placeholder finding so the asset isn't silently dropped.
        const errorAsset = all.find((a) => a.id === evt.assetId)
        const fallback: RiskFinding = {
          assetId: evt.assetId,
          asset: errorAsset ?? { id: evt.assetId, kind: "oauth_app", name: evt.assetName, identifier: "" },
          score: 0,
          level: "info",
          headline: "Could not analyze",
          reasoning: `The agent encountered an error: ${evt.error}`,
          factors: [{ label: "Analysis error", detail: evt.error }],
          iocMatches: [],
          recommendation: "Retry the scan, or analyze this asset manually.",
          ticketStatus: "none",
          alertStatus: "none",
        }
        setFindings((prev) => [...prev, fallback])
        setProgress((p) => ({ ...p, done: p.done + 1 }))
        onAdvance()
      }
    }
  }, [inventory])

  const runDemo = useCallback(async () => {
    setState("scanning")
    setFindings([])
    setErrorMsg(null)
    setIsDemo(true)
    setLastScanTime(null)
    
    // Simulate streaming demo findings with staggered delay
    const demoResults = demoFindings
    let accumulated: RiskFinding[] = []
    
    for (let i = 0; i < demoResults.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400))
      accumulated = [...accumulated, demoResults[i]]
      setFindings(accumulated)
      setProgress({ done: i + 1, total: demoResults.length })
      setActiveAssetName(demoResults[i].asset.name)
    }
    
    setState("done")
    setActiveAssetName(null)
    setLastScanTime(new Date())
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setState("idle")
    setActiveAssetName(null)
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState("idle")
    setFindings([])
    setErrorMsg(null)
    setProgress({ done: 0, total: 0 })
    setActiveAssetName(null)
  }, [])

  const updateStatus = useCallback(
    (
      assetId: string,
      key: "ticketStatus" | "alertStatus",
      from: "filing" | "sending",
      to: "filed" | "sent",
    ) => {
      setFindings((prev) => prev.map((f) => (f.assetId === assetId ? { ...f, [key]: from } : f)))
      setTimeout(() => {
        setFindings((prev) => prev.map((f) => (f.assetId === assetId ? { ...f, [key]: to } : f)))
      }, 900)
    },
    [],
  )

  const handleFileTicket = useCallback(
    async (assetId: string) => {
      const finding = findings.find((f) => f.assetId === assetId)
      if (!finding) return

      updateStatus(assetId, "ticketStatus", "filing", "filed")

      try {
        const res = await fetch('/api/actions/file-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ finding }),
        })
        const data = await res.json()
        if (!data.success) {
          console.error('[v0] file ticket error:', data.error)
        }
      } catch (err) {
        console.error('[v0] file ticket fetch error:', err)
      }
    },
    [findings, updateStatus],
  )

  const handleSendAlert = useCallback(
    async (assetId: string) => {
      const finding = findings.find((f) => f.assetId === assetId)
      if (!finding) return

      updateStatus(assetId, "alertStatus", "sending", "sent")

      try {
        const res = await fetch('/api/actions/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ finding }),
        })
        const data = await res.json()
        if (!data.success) {
          console.error('[v0] send alert error:', data.error)
        }
      } catch (err) {
        console.error('[v0] send alert fetch error:', err)
      }
    },
    [findings, updateStatus],
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

  const inventoryItemCount = inventory.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length

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
            Paste your inventory of OAuth apps, npm packages, and SaaS tools. The agent calls
            tools to match against IOCs, looks up vendor advisories, and ranks findings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state !== "idle" && (
            <Button onClick={reset} variant="ghost" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </Button>
          )}
          <Button onClick={runDemo} disabled={state === "scanning"} variant="outline" size="sm" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Demo Mode
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {(findings.length > 0 || lastScanTime) && (
        <MetricsDashboard 
          findings={findings} 
          assetsScanned={inventoryItemCount}
          lastUpdated={lastScanTime}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px] overflow-hidden">
        <div className="space-y-4 min-w-0">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden />
                <h3 className="text-sm font-semibold tracking-tight">Inventory</h3>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {inventoryItemCount} items
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
                {state === "scanning" ? (
                  <Button onClick={cancel} variant="outline" size="sm">
                    Cancel
                  </Button>
                ) : null}
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
                  {state === "scanning" ? "Analyzing\u2026" : "Run scan"}
                </Button>
              </div>
            </div>
          </div>

          {state === "error" && errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-[var(--chart-1)]/40 bg-[var(--chart-1)]/5 px-4 py-3"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chart-1)]" aria-hidden />
              <div className="text-sm">
                <p className="font-medium">Scan failed</p>
                <p className="mt-0.5 text-muted-foreground">{errorMsg}</p>
              </div>
            </div>
          )}

          {(state === "scanning" || state === "done") && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {state === "scanning" ? "Live" : "Findings"}
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold">{progress.done}</span>
                  <span className="text-muted-foreground">/{progress.total}</span>{" "}
                  <span className="text-muted-foreground">analyzed</span>
                </span>
                {counts.critical > 0 && (
                  <span className="tabular-nums">
                    <span className="font-semibold text-[var(--chart-1)]">{counts.critical}</span>{" "}
                    <span className="text-muted-foreground">critical</span>
                  </span>
                )}
                {counts.high > 0 && (
                  <span className="tabular-nums">
                    <span className="font-semibold text-[var(--chart-2)]">{counts.high}</span>{" "}
                    <span className="text-muted-foreground">high</span>
                  </span>
                )}
                {state === "scanning" && activeAssetName && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Sparkles className="h-3 w-3 animate-pulse text-primary" aria-hidden />
                    <span className="truncate">{`analyzing ${activeAssetName}\u2026`}</span>
                  </span>
                )}
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

        <div className="lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-20 min-w-0 overflow-hidden">
          <IocFeed />
        </div>
      </div>
    </section>
  )
}

// === Stream event types =====================================================

type ScanEvent =
  | { type: "start"; count: number }
  | { type: "finding"; finding: RiskFinding; analyzed: number; total: number }
  | { type: "error"; assetId: string; assetName: string; error: string }
  | { type: "done"; analyzed: number }
