"use client"

import { useState } from "react"
import { Calendar, Clock, Mail, Save, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScheduleConfig {
  frequency: "daily" | "weekly" | "monthly"
  time: string
  dayOfWeek?: number
  dayOfMonth?: number
  recipients: string[]
  includeCharts: boolean
  includeRecommendations: boolean
}

export function ScheduledScans() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<ScheduleConfig>({
    frequency: "weekly",
    time: "09:00",
    dayOfWeek: 1,
    recipients: ["security@example.com"],
    includeCharts: true,
    includeRecommendations: true,
  })

  const [savedSchedules, setSavedSchedules] = useState<ScheduleConfig[]>([
    {
      frequency: "weekly",
      time: "09:00",
      dayOfWeek: 1,
      recipients: ["security-team@company.com"],
      includeCharts: true,
      includeRecommendations: true,
    },
    {
      frequency: "monthly",
      time: "08:00",
      dayOfMonth: 1,
      recipients: ["ciso@company.com"],
      includeCharts: true,
      includeRecommendations: false,
    },
  ])

  const handleDelete = (index: number) => {
    setSavedSchedules(savedSchedules.filter((_, i) => i !== index))
  }

  const handleEdit = (index: number) => {
    setConfig(savedSchedules[index])
    setSavedSchedules(savedSchedules.filter((_, i) => i !== index))
    setIsOpen(true)
  }

  const handleSave = () => {
    setSavedSchedules([...savedSchedules, config])
    setConfig({
      frequency: "weekly",
      time: "09:00",
      dayOfWeek: 1,
      recipients: [""],
      includeCharts: true,
      includeRecommendations: true,
    })
  }

  const getNextRunDate = (schedule: ScheduleConfig): string => {
    const now = new Date()
    const [hours, minutes] = schedule.time.split(":").map(Number)

    let nextRun = new Date(now)
    nextRun.setHours(hours, minutes, 0, 0)

    if (schedule.frequency === "daily") {
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
    } else if (schedule.frequency === "weekly" && schedule.dayOfWeek) {
      const daysUntil = (schedule.dayOfWeek - now.getDay() + 7) % 7
      nextRun.setDate(nextRun.getDate() + (daysUntil === 0 && nextRun <= now ? 7 : daysUntil))
    } else if (schedule.frequency === "monthly" && schedule.dayOfMonth) {
      nextRun.setDate(schedule.dayOfMonth)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
    }

    return nextRun.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
          Scheduled Scan Reports
        </h3>
      </div>

      {/* Active Schedules */}
      {savedSchedules.length > 0 && (
        <div className="space-y-2">
          {savedSchedules.map((schedule, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} scan at {schedule.time}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Next run: {getNextRunDate(schedule)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(i)}
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                    title="Edit schedule"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                    title="Delete schedule"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-1 text-[10px]">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground">
                  <Mail className="h-3 w-3" />
                  {schedule.recipients.length} recipients
                </span>
                {schedule.includeCharts && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground">
                    <Calendar className="h-3 w-3" />
                    With charts
                  </span>
                )}
                {schedule.includeRecommendations && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground">
                    <Clock className="h-3 w-3" />
                    With recommendations
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Schedule */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="w-full justify-start text-xs"
      >
        <Calendar className="h-3.5 w-3.5 mr-2" />
        {isOpen ? "Cancel" : "Add New Schedule"}
      </Button>

      {isOpen && (
        <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-3">
          {/* Frequency */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Frequency
            </label>
            <select
              value={config.frequency}
              onChange={(e) =>
                setConfig({ ...config, frequency: e.target.value as "daily" | "weekly" | "monthly" })
              }
              className="w-full mt-1 rounded bg-muted px-2 py-1.5 text-xs border border-border/60"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Time */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Time
            </label>
            <input
              type="time"
              value={config.time}
              onChange={(e) => setConfig({ ...config, time: e.target.value })}
              className="w-full mt-1 rounded bg-muted px-2 py-1.5 text-xs border border-border/60"
            />
          </div>

          {/* Day Selection */}
          {config.frequency === "weekly" && (
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Day of Week
              </label>
              <select
                value={config.dayOfWeek || 0}
                onChange={(e) => setConfig({ ...config, dayOfWeek: Number(e.target.value) })}
                className="w-full mt-1 rounded bg-muted px-2 py-1.5 text-xs border border-border/60"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          )}

          {/* Recipients */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Recipients
            </label>
            <input
              type="text"
              value={config.recipients[0] || ""}
              onChange={(e) => setConfig({ ...config, recipients: [e.target.value] })}
              placeholder="email@example.com"
              className="w-full mt-1 rounded bg-muted px-2 py-1.5 text-xs border border-border/60"
            />
          </div>

          {/* Options */}
          <div className="space-y-1.5 border-t border-border/40 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={config.includeCharts}
                onChange={(e) => setConfig({ ...config, includeCharts: e.target.checked })}
                className="w-3 h-3 rounded"
              />
              Include visualizations
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={config.includeRecommendations}
                onChange={(e) => setConfig({ ...config, includeRecommendations: e.target.checked })}
                className="w-3 h-3 rounded"
              />
              Include recommendations
            </label>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full" size="sm">
            <Save className="h-3.5 w-3.5 mr-2" />
            Save Schedule
          </Button>
        </div>
      )}
    </div>
  )
}
