import { Redis } from '@upstash/redis'
import { z } from 'zod'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const SCHEDULES_KEY = 'oauthsentry:scheduled-scans'

const ScheduleConfigSchema = z.object({
  id: z.string(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  time: z.string(),
  dayOfWeek: z.number().optional(),
  dayOfMonth: z.number().optional(),
  recipients: z.array(z.string()),
  includeCharts: z.boolean(),
  includeRecommendations: z.boolean(),
  inventory: z.string().optional(),
  createdAt: z.string(),
  lastRun: z.string().optional(),
  nextRun: z.string(),
  enabled: z.boolean().default(true),
})

type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>

// Calculate next run date
function calculateNextRun(schedule: Omit<ScheduleConfig, 'id' | 'createdAt' | 'nextRun'>): string {
  const now = new Date()
  const [hours, minutes] = schedule.time.split(':').map(Number)

  const nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)

  if (schedule.frequency === 'daily') {
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
  } else if (schedule.frequency === 'weekly' && schedule.dayOfWeek !== undefined) {
    const daysUntil = (schedule.dayOfWeek - now.getDay() + 7) % 7
    nextRun.setDate(nextRun.getDate() + (daysUntil === 0 && nextRun <= now ? 7 : daysUntil))
  } else if (schedule.frequency === 'monthly' && schedule.dayOfMonth !== undefined) {
    nextRun.setDate(schedule.dayOfMonth)
    if (nextRun <= now) {
      nextRun.setMonth(nextRun.getMonth() + 1)
    }
  }

  return nextRun.toISOString()
}

// GET - Fetch all scheduled scans
export async function GET() {
  try {
    const schedules = await redis.get<ScheduleConfig[]>(SCHEDULES_KEY) || []
    return Response.json({ schedules, success: true })
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    return Response.json(
      { success: false, error: 'Failed to fetch schedules', schedules: [] },
      { status: 500 }
    )
  }
}

// POST - Create a new scheduled scan
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const newSchedule: ScheduleConfig = {
      id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      frequency: body.frequency,
      time: body.time,
      dayOfWeek: body.dayOfWeek,
      dayOfMonth: body.dayOfMonth,
      recipients: body.recipients || [],
      includeCharts: body.includeCharts ?? true,
      includeRecommendations: body.includeRecommendations ?? true,
      inventory: body.inventory,
      createdAt: new Date().toISOString(),
      nextRun: calculateNextRun(body),
      enabled: true,
    }

    const existingSchedules = await redis.get<ScheduleConfig[]>(SCHEDULES_KEY) || []
    const updatedSchedules = [...existingSchedules, newSchedule]
    
    await redis.set(SCHEDULES_KEY, updatedSchedules)

    return Response.json({ success: true, schedule: newSchedule })
  } catch (error) {
    console.error('Failed to create schedule:', error)
    return Response.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing scheduled scan
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return Response.json(
        { success: false, error: 'Schedule ID required' },
        { status: 400 }
      )
    }

    const schedules = await redis.get<ScheduleConfig[]>(SCHEDULES_KEY) || []
    const index = schedules.findIndex(s => s.id === id)

    if (index === -1) {
      return Response.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    const updatedSchedule = {
      ...schedules[index],
      ...updates,
      nextRun: calculateNextRun({ ...schedules[index], ...updates }),
    }

    schedules[index] = updatedSchedule
    await redis.set(SCHEDULES_KEY, schedules)

    return Response.json({ success: true, schedule: updatedSchedule })
  } catch (error) {
    console.error('Failed to update schedule:', error)
    return Response.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a scheduled scan
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json(
        { success: false, error: 'Schedule ID required' },
        { status: 400 }
      )
    }

    const schedules = await redis.get<ScheduleConfig[]>(SCHEDULES_KEY) || []
    const filteredSchedules = schedules.filter(s => s.id !== id)

    if (schedules.length === filteredSchedules.length) {
      return Response.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    await redis.set(SCHEDULES_KEY, filteredSchedules)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete schedule:', error)
    return Response.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
