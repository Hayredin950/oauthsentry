"use client"

import type { RiskTimeline } from "@/lib/types"
import { Calendar, TrendingUp } from "lucide-react"

interface RiskTimelineProps {
  timeline: RiskTimeline[] | undefined
  detectedAt?: string
}

export function RiskTimelineComponent({ timeline, detectedAt }: RiskTimelineProps) {
  if (!timeline || timeline.length === 0) return null

  // Sort timeline by date
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const getLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-600 bg-red-500/10"
      case "high":
        return "text-orange-600 bg-orange-500/10"
      case "medium":
        return "text-yellow-600 bg-yellow-500/10"
      case "low":
        return "text-blue-600 bg-blue-500/10"
      default:
        return "text-gray-600 bg-gray-500/10"
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Risk Timeline
        </h4>
      </div>

      <div className="space-y-2">
        {sortedTimeline.map((event, idx) => {
          const date = new Date(event.date)
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
          })
          const formattedTime = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })

          return (
            <div key={idx} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`h-2 w-2 rounded-full ${getLevelColor(event.level)}`} />
                {idx < sortedTimeline.length - 1 && (
                  <div className="h-6 w-px bg-border" />
                )}
              </div>

              {/* Event details */}
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {formattedDate} {formattedTime}
                  </span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getLevelColor(event.level)}`}>
                    {event.level.toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Score: {event.score}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{event.event}</p>
              </div>
            </div>
          )
        })}
      </div>

      {detectedAt && (
        <div className="flex items-start gap-2 pt-1 text-xs">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-muted-foreground">
            First detected {new Date(detectedAt).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  )
}
