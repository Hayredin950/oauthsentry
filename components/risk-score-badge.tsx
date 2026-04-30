import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/types"

const styles: Record<RiskLevel, { dot: string; text: string; ring: string; label: string }> = {
  critical: {
    dot: "bg-[var(--chart-1)]",
    text: "text-[var(--chart-1)]",
    ring: "ring-[var(--chart-1)]/30",
    label: "Critical",
  },
  high: {
    dot: "bg-[var(--chart-2)]",
    text: "text-[var(--chart-2)]",
    ring: "ring-[var(--chart-2)]/30",
    label: "High",
  },
  medium: {
    dot: "bg-[var(--chart-3)]",
    text: "text-[var(--chart-3)]",
    ring: "ring-[var(--chart-3)]/30",
    label: "Medium",
  },
  low: {
    dot: "bg-[var(--chart-4)]",
    text: "text-[var(--chart-4)]",
    ring: "ring-[var(--chart-4)]/30",
    label: "Low",
  },
  info: {
    dot: "bg-[var(--chart-5)]",
    text: "text-[var(--chart-5)]",
    ring: "ring-[var(--chart-5)]/30",
    label: "Info",
  },
}

export function RiskScoreBadge({
  level,
  score,
  className,
}: {
  level: RiskLevel
  score?: number
  className?: string
}) {
  const s = styles[level]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md bg-card px-2 py-1 text-xs font-medium ring-1 ring-inset",
        s.ring,
        s.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      <span>{s.label}</span>
      {typeof score === "number" && (
        <span className="font-mono text-muted-foreground">{score}</span>
      )}
    </span>
  )
}
