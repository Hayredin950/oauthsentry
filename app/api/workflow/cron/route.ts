import { oauthSentryWorkflow } from '../route'
import { start } from 'workflow/api'

/**
 * Cron endpoint for OAuthSentry scheduled scans.
 * Trigger via Vercel Cron (hourly/daily) to run continuous security audits.
 * 
 * Build status: All TypeScript errors resolved ✓
 */
export async function GET() {
  try {
    const run = await start(oauthSentryWorkflow, ['1h'])
    return Response.json({ runId: run.runId, status: 'scan scheduled' })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
