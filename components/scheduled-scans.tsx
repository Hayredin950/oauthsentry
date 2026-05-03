"use client"

import { useState } from "react"
import useSWR from "swr"
import { Calendar, Clock, Mail, Save, Trash2, Edit, Loader2, Power, PowerOff, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScheduleConfig {
  id: string
  frequency: "daily" | "weekly" | "monthly"
  time: string
  dayOfWeek?: number
  dayOfMonth?: number
  recipients: string[]
  includeCharts: boolean
  includeRecommendations: boolean
  inventory?: string
  createdAt: string
  lastRun?: string
  nextRun: string
  enabled: boolean
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function ScheduledScans() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [config, setConfig] = useState<Omit<ScheduleConfig, 'id' | 'createdAt' | 'nextRun' | 'enabled'>>({
    frequency: "weekly",
    time: "09:00",
    dayOfWeek: 1,
    recipients: [""],
    includeCharts: true,
    includeRecommendations: true,
  })

  const { data, error, isLoading, mutate } = useSWR<{ schedules: ScheduleConfig[], success: boolean }>(
    '/api/scheduled-scans',
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )

  const schedules = data?.schedules || []

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/scheduled-scans?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        mutate()
      }
    } catch (err) {
      console.error('Failed to delete schedule:', err)
    }
  }

  const handleEdit = (schedule: ScheduleConfig) => {
    setEditingId(schedule.id)
    setConfig({
      frequency: schedule.frequency,
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      recipients: schedule.recipients.length > 0 ? schedule.recipients : [""],
      includeCharts: schedule.includeCharts,
      includeRecommendations: schedule.includeRecommendations,
      inventory: schedule.inventory,
    })
    setIsOpen(true)
  }

  const handleToggleEnabled = async (schedule: ScheduleConfig) => {
    try {
      const res = await fetch('/api/scheduled-scans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schedule.id, enabled: !schedule.enabled }),
      })
      if (res.ok) {
        mutate()
      }
    } catch (err) {
      console.error('Failed to toggle schedule:', err)
    }
  }

  const handleRunNow = async (scheduleId: string) => {
    setRunningId(scheduleId)
    try {
      const res = await fetch('/api/scheduled-scans/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      })
      const data = await res.json()
      if (data.success) {
        mutate()
        alert(`Scan completed! Found ${data.result.findingsCount} findings (${data.result.criticalCount} critical, ${data.result.highCount} high)`)
      } else {
        alert(data.error || 'Failed to run scan')
      }
    } catch (err) {
      console.error('Failed to run scan:', err)
      alert('Failed to run scan')
    } finally {
      setRunningId(null)
    }
  }

  const handleSave = async () => {
    // Validate email
    const validRecipients = config.recipients.filter(r => r.includes('@'))
    if (validRecipients.length === 0) {
      alert('Please enter at least one valid email address')
      return
    }

    setIsSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...config, recipients: validRecipients } : { ...config, recipients: validRecipients }
      
      const res = await fetch('/api/scheduled-scans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        mutate()
        setIsOpen(false)
        setEditingId(null)
        setConfig({
          frequency: "weekly",
          time: "09:00",
          dayOfWeek: 1,
          recipients: [""],
          includeCharts: true,
          includeRecommendations: true,
        })
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save schedule')
      }
    } catch (err) {
      console.error('Failed to save schedule:', err)
      alert('Failed to save schedule')
    } finally {
      setIsSaving(false)
    }
  }

  const formatNextRun = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatLastRun = (dateStr: string | undefined): string => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Scheduled Scan Reports
        </h3>
        {isLoading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Active Schedules */}
      {schedules.length > 0 && (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div 
              key={schedule.id} 
              className={`rounded-lg border bg-background/60 p-3 space-y-2 transition-colors ${
                schedule.enabled ? 'border-border/60' : 'border-border/30 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEnabled(schedule)}
                    className={`p-1 rounded transition-colors ${
                      schedule.enabled 
                        ? 'text-green-600 hover:bg-green-500/10' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                    title={schedule.enabled ? 'Disable schedule' : 'Enable schedule'}
                  >
                    {schedule.enabled ? (
                      <Power className="h-3.5 w-3.5" />
                    ) : (
                      <PowerOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} at {schedule.time}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Next: {formatNextRun(schedule.nextRun)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleRunNow(schedule.id)}
                    disabled={runningId === schedule.id}
                    className="text-xs text-green-600 hover:text-green-700 inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-green-500/10 transition-colors disabled:opacity-50"
                    title="Run scan now"
                  >
                    {runningId === schedule.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    {runningId === schedule.id ? 'Running...' : 'Run Now'}
                  </button>
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-500/10 transition-colors"
                    title="Edit schedule"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                    title="Delete schedule"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-1.5 text-[10px]">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground">
                  <Mail className="h-3 w-3" />
                  {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}
                </span>
                {schedule.includeCharts && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700">
                    Charts
                  </span>
                )}
                {schedule.includeRecommendations && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700">
                    Recommendations
                  </span>
                )}
                <span className="ml-auto text-muted-foreground">
                  Last run: {formatLastRun(schedule.lastRun)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && schedules.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center">
          <Calendar className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs font-medium">No scheduled scans</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Create a schedule to automatically run scans and receive reports
          </p>
        </div>
      )}

      {/* Add New Schedule Button */}
      <Button
        onClick={() => {
          setEditingId(null)
          setConfig({
            frequency: "weekly",
            time: "09:00",
            dayOfWeek: 1,
            recipients: [""],
            includeCharts: true,
            includeRecommendations: true,
          })
          setIsOpen(!isOpen)
        }}
        variant="outline"
        size="sm"
        className="w-full justify-start text-xs"
      >
        <Calendar className="h-3.5 w-3.5 mr-2" />
        {isOpen ? "Cancel" : editingId ? "Editing Schedule..." : "Add New Schedule"}
      </Button>

      {/* Schedule Form */}
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
              Time (UTC)
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

          {config.frequency === "monthly" && (
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Day of Month
              </label>
              <select
                value={config.dayOfMonth || 1}
                onChange={(e) => setConfig({ ...config, dayOfMonth: Number(e.target.value) })}
                className="w-full mt-1 rounded bg-muted px-2 py-1.5 text-xs border border-border/60"
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          )}

          {/* Recipients */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Email Recipients
            </label>
            <input
              type="email"
              value={config.recipients[0] || ""}
              onChange={(e) => setConfig({ ...config, recipients: [e.target.value] })}
              placeholder="security@company.com"
              className="w-full mt-1 rounded bg-muted px-2 py-1.5 text-xs border border-border/60"
            />
            <p className="text-[9px] text-muted-foreground mt-1">
              Reports will be sent to this email when the scan completes
            </p>
          </div>

          {/* Options */}
          <div className="space-y-1.5 border-t border-border/40 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={config.includeCharts}
                onChange={(e) => setConfig({ ...config, includeCharts: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-border"
              />
              Include visualizations in report
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={config.includeRecommendations}
                onChange={(e) => setConfig({ ...config, includeRecommendations: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-border"
              />
              Include remediation recommendations
            </label>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full" 
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-2" />
                {editingId ? 'Update Schedule' : 'Save Schedule'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
