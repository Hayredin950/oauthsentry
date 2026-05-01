import { oauthSentryWorkflow } from '../route'
import { start } from 'workflow/api'

/**
 * Optional: scheduled trigger (cron integration on Vercel).
 * Call this endpoint hourly/daily to keep scans running.
 */
export async function GET() {
  try {
    const run = await start(oauthSentryWorkflow, ['1h'])
    return Response.json({ runId: run.runId, status: 'scan scheduled' })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
