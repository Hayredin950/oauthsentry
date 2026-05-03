"use client"

import { useState, useEffect } from "react"
import type { RiskFinding } from "@/lib/types"
import { BarChart3, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RiskScoreBadge } from "@/components/risk-score-badge"

interface RiskComparisonProps {
  findings: RiskFinding[]
}

export function RiskComparison({ findings }: RiskComparisonProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Auto-select first 5 findings for immediate visualization
  useEffect(() => {
    if (findings.length > 0) {
      const topFindings = findings.slice(0, 5).map(f => f.assetId)
      setSelectedAssets(topFindings)
    }
  }, [findings])

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    )
  }

  const comparisons = selectedAssets
    .map((id) => findings.find((f) => f.assetId === id))
    .filter(Boolean) as RiskFinding[]

  const maxScore = Math.max(...comparisons.map((f) => f.score), 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Risk Comparison
        </h4>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs"
        >
          {selectedAssets.length === 0
            ? "Select assets to compare..."
            : `Comparing ${selectedAssets.length} assets`}
        </Button>

        {isOpen && (
          <div className="rounded-lg border border-border/60 bg-background/60 p-2 max-h-40 overflow-y-auto">
            {findings.map((f) => (
              <label
                key={f.assetId}
                className="flex items-center gap-2 p-2 hover:bg-muted/40 rounded cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedAssets.includes(f.assetId)}
                  onChange={() => handleSelectAsset(f.assetId)}
                  className="w-4 h-4 rounded border-border cursor-pointer"
                />
                <span className="flex-1">{f.asset.name}</span>
                <span className="font-semibold text-foreground">{f.score}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {comparisons.length > 1 && (
        <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-3">
          {/* Horizontal Bar Chart */}
          <div className="space-y-2">
            {comparisons
              .sort((a, b) => b.score - a.score)
              .map((f) => (
                <div key={f.assetId} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{f.asset.name}</span>
                    <RiskScoreBadge level={f.level} score={f.score} />
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        f.level === "critical"
                          ? "bg-red-500/80"
                          : f.level === "high"
                            ? "bg-orange-500/80"
                            : f.level === "medium"
                              ? "bg-yellow-500/80"
                              : "bg-blue-500/80"
                      }`}
                      style={{ width: `${(f.score / maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Comparison Insights */}
          <div className="border-t border-border/40 pt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Highest Risk:</span>
              <span className="font-semibold">
                {comparisons.reduce((max, f) => (f.score > max.score ? f : max)).asset.name} (
                {comparisons.reduce((max, f) => (f.score > max.score ? f : max)).score})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lowest Risk:</span>
              <span className="font-semibold">
                {comparisons.reduce((min, f) => (f.score < min.score ? f : min)).asset.name} (
                {comparisons.reduce((min, f) => (f.score < min.score ? f : min)).score})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Score:</span>
              <span className="font-semibold">
                {Math.round(comparisons.reduce((sum, f) => sum + f.score, 0) / comparisons.length)}/100
              </span>
            </div>
          </div>

          {/* Clear Selection */}
          {selectedAssets.length > 0 && (
            <Button
              onClick={() => setSelectedAssets([])}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear Selection
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
