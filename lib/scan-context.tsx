"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { RiskFinding, StackAsset } from "@/lib/types"
import { seedIOCs, seedInventoryText } from "@/lib/seed-data"
import { parseInventory } from "@/lib/parse-inventory"

interface ScanStats {
  iocSources: number
  assetsMonitored: number
  criticalFindings: number
  highFindings: number
  mediumFindings: number
  lowFindings: number
  lastSweep: Date | null
  isScanning: boolean
}

interface ScanContextType {
  stats: ScanStats
  findings: RiskFinding[]
  updateStats: (assets: StackAsset[], findings: RiskFinding[], lastSweep: Date | null, isScanning?: boolean) => void
  setScanning: (isScanning: boolean) => void
}

// Initialize with actual inventory count
const initialAssets = parseInventory(seedInventoryText)

const defaultStats: ScanStats = {
  iocSources: seedIOCs.length,
  assetsMonitored: initialAssets.length,
  criticalFindings: 0,
  highFindings: 0,
  mediumFindings: 0,
  lowFindings: 0,
  lastSweep: null,
  isScanning: false,
}

const ScanContext = createContext<ScanContextType | null>(null)

export function ScanProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<ScanStats>(defaultStats)
  const [findings, setFindings] = useState<RiskFinding[]>([])

  const updateStats = useCallback((assets: StackAsset[], newFindings: RiskFinding[], lastSweep: Date | null, isScanning = false) => {
    setFindings(newFindings)
    setStats({
      iocSources: seedIOCs.length,
      assetsMonitored: assets.length,
      criticalFindings: newFindings.filter(f => f.level === "critical").length,
      highFindings: newFindings.filter(f => f.level === "high").length,
      mediumFindings: newFindings.filter(f => f.level === "medium").length,
      lowFindings: newFindings.filter(f => f.level === "low").length,
      lastSweep,
      isScanning,
    })
  }, [])

  const setScanning = useCallback((isScanning: boolean) => {
    setStats(prev => ({ ...prev, isScanning }))
  }, [])

  return (
    <ScanContext.Provider value={{ stats, findings, updateStats, setScanning }}>
      {children}
    </ScanContext.Provider>
  )
}

export function useScanStats() {
  const context = useContext(ScanContext)
  if (!context) {
    throw new Error("useScanStats must be used within a ScanProvider")
  }
  return context
}
