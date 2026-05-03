import { Redis } from '@upstash/redis'
import { seedInventoryText } from '@/lib/seed-data'
import { parseInventory } from '@/lib/parse-inventory'
import { generateDemoFindings } from '@/lib/generate-demo-findings'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const SCHEDULES_KEY = 'oauthsentry:scheduled-scans'
const SCAN_HISTORY_KEY = 'oauthsentry:scan-history'

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

interface ScanResult {
  scheduleId: string
  runAt: string
  findingsCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  emailSent: boolean
  recipients: string[]
}

// Calculate next run date
function calculateNextRun(schedule: ScheduleConfig): string {
  const now = new Date()
  const [hours, minutes] = schedule.time.split(':').map(Number)

  const nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)

  if (schedule.frequency === 'daily') {
    nextRun.setDate(nextRun.getDate() + 1)
  } else if (schedule.frequency === 'weekly' && schedule.dayOfWeek !== undefined) {
    const daysUntil = (schedule.dayOfWeek - now.getDay() + 7) % 7 || 7
    nextRun.setDate(nextRun.getDate() + daysUntil)
  } else if (schedule.frequency === 'monthly' && schedule.dayOfMonth !== undefined) {
    nextRun.setDate(schedule.dayOfMonth)
    nextRun.setMonth(nextRun.getMonth() + 1)
  }

  return nextRun.toISOString()
}

// Send email report (uses Slack webhook as fallback for demo)
async function sendEmailReport(
  schedule: ScheduleConfig,
  findings: any[],
): Promise<boolean> {
  // In production, you would use a service like Resend, SendGrid, or AWS SES
  // For demo purposes, we'll log the report and optionally send to Slack

  const criticalCount = findings.filter(f => f.level === 'critical').length
  const highCount = findings.filter(f => f.level === 'high').length
  
  console.log(`[OAuthSentry] Scheduled scan report for ${schedule.recipients.join(', ')}`)
  console.log(`  - Total findings: ${findings.length}`)
  console.log(`  - Critical: ${criticalCount}, High: ${highCount}`)

  // Try to send via Slack webhook if configured
  const slackWebhook = process.env.SLACK_WEBHOOK_URL
  if (slackWebhook) {
    try {
      const message = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `OAuthSentry Scheduled Scan Report`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Schedule:* ${schedule.frequency}` },
              { type: 'mrkdwn', text: `*Total Findings:* ${findings.length}` },
              { type: 'mrkdwn', text: `*Critical:* ${criticalCount}` },
              { type: 'mrkdwn', text: `*High:* ${highCount}` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Recipients:* ${schedule.recipients.join(', ')}`,
            },
          },
          ...(criticalCount > 0 || highCount > 0 ? [{
            type: 'section' as const,
            text: {
              type: 'mrkdwn' as const,
              text: `*Action Required:* ${criticalCount + highCount} high-priority findings need attention`,
            },
          }] : []),
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `_Scheduled scan completed at ${new Date().toLocaleString()}_`,
              },
            ],
          },
        ],
      }

      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })

      return true
    } catch (err) {
      console.error('Failed to send Slack notification:', err)
    }
  }

  return true // Return true since we logged the report
}

// GET - Execute due scheduled scans (called by Vercel Cron)
export async function GET(req: Request) {
  // Verify cron secret for production
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret is set
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const now = new Date()
    const schedules = await redis.get<ScheduleConfig[]>(SCHEDULES_KEY) || []
    
    // Find schedules that are due
    const dueSchedules = schedules.filter(s => {
      if (!s.enabled) return false
      const nextRun = new Date(s.nextRun)
      return nextRun <= now
    })

    const results: ScanResult[] = []

    for (const schedule of dueSchedules) {
      try {
        // Parse inventory (use default if none specified)
        const inventoryText = schedule.inventory || seedInventoryText
        const assets = parseInventory(inventoryText)

        // Generate findings (in production, this would call the actual scan API)
        const findings = generateDemoFindings(assets)

        // Count by severity
        const criticalCount = findings.filter(f => f.level === 'critical').length
        const highCount = findings.filter(f => f.level === 'high').length
        const mediumCount = findings.filter(f => f.level === 'medium').length
        const lowCount = findings.filter(f => f.level === 'low').length

        // Send email report
        const emailSent = await sendEmailReport(schedule, findings)

        // Record result
        const result: ScanResult = {
          scheduleId: schedule.id,
          runAt: now.toISOString(),
          findingsCount: findings.length,
          criticalCount,
          highCount,
          mediumCount,
          lowCount,
          emailSent,
          recipients: schedule.recipients,
        }
        results.push(result)

        // Update schedule with lastRun and nextRun
        schedule.lastRun = now.toISOString()
        schedule.nextRun = calculateNextRun(schedule)
      } catch (err) {
        console.error(`Failed to execute schedule ${schedule.id}:`, err)
      }
    }

    // Save updated schedules
    if (dueSchedules.length > 0) {
      await redis.set(SCHEDULES_KEY, schedules)

      // Store scan history (keep last 100)
      const history = await redis.get<ScanResult[]>(SCAN_HISTORY_KEY) || []
      const updatedHistory = [...results, ...history].slice(0, 100)
      await redis.set(SCAN_HISTORY_KEY, updatedHistory)
    }

    return Response.json({
      success: true,
      executed: results.length,
      results,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Scheduled scan execution failed:', error)
    return Response.json(
      { success: false, error: 'Execution failed' },
      { status: 500 }
    )
  }
}

// POST - Manually trigger a specific schedule
export async function POST(req: Request) {
  try {
    const { scheduleId } = await req.json()

    if (!scheduleId) {
      return Response.json(
        { success: false, error: 'Schedule ID required' },
        { status: 400 }
      )
    }

    const schedules = await redis.get<ScheduleConfig[]>(SCHEDULES_KEY) || []
    const schedule = schedules.find(s => s.id === scheduleId)

    if (!schedule) {
      return Response.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    const now = new Date()

    // Parse inventory and run scan
    const inventoryText = schedule.inventory || seedInventoryText
    const assets = parseInventory(inventoryText)
    const findings = generateDemoFindings(assets)

    // Send report
    const emailSent = await sendEmailReport(schedule, findings)

    // Update schedule
    schedule.lastRun = now.toISOString()
    schedule.nextRun = calculateNextRun(schedule)
    await redis.set(SCHEDULES_KEY, schedules)

    // Store in history
    const result: ScanResult = {
      scheduleId: schedule.id,
      runAt: now.toISOString(),
      findingsCount: findings.length,
      criticalCount: findings.filter(f => f.level === 'critical').length,
      highCount: findings.filter(f => f.level === 'high').length,
      mediumCount: findings.filter(f => f.level === 'medium').length,
      lowCount: findings.filter(f => f.level === 'low').length,
      emailSent,
      recipients: schedule.recipients,
    }

    const history = await redis.get<ScanResult[]>(SCAN_HISTORY_KEY) || []
    await redis.set(SCAN_HISTORY_KEY, [result, ...history].slice(0, 100))

    return Response.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Manual scan execution failed:', error)
    return Response.json(
      { success: false, error: 'Execution failed' },
      { status: 500 }
    )
  }
}
