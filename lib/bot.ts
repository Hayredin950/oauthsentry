import { Chat } from 'chat'
import { createSlackAdapter } from '@chat-adapter/slack'
import { createMemoryState } from '@chat-adapter/state-memory'
import { start } from 'workflow/api'
import { oauthSentryWorkflow } from '@/app/api/workflow/route'

// Initialize Chat SDK with Slack adapter and in-memory state (dev) or Redis (prod)
export const bot = new Chat({
  userName: 'oauthsentry-bot',
  adapters: {
    slack: createSlackAdapter({
      botToken: process.env.SLACK_BOT_TOKEN!,
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
    }),
  },
  state: createMemoryState(),
})

/**
 * Handle slash command: /oauthsentry scan
 * Triggers a manual scan and posts a status message.
 */
bot.onSlashCommand('/oauthsentry', async (event) => {
  const { thread } = event

  // Acknowledge immediately
  await thread.post('OAuthSentry: Starting security scan... please wait.')

  try {
    // Trigger the WDK workflow
    const run = await start(oauthSentryWorkflow, [])

    // Post status with run ID (users can check progress later)
    await thread.post(
      `Scan initiated (Run ID: ${run.runId}). ` +
      `Critical findings will be posted here when the scan completes. ` +
      `Check back in a few minutes.`,
    )
  } catch (err) {
    await thread.post(`Error starting scan: ${(err as Error).message}`)
  }
})

/**
 * Handle app mentions (e.g. @oauthsentry status?)
 */
bot.onNewMention(async (thread, message) => {
  await thread.subscribe()

  const text = message.text.toLowerCase()

  if (text.includes('status') || text.includes('help')) {
    await thread.post(
      'OAuthSentry: AI-powered OAuth & third-party risk agent.\n' +
      'Commands:\n' +
      '• `/oauthsentry scan` — Start a security scan\n' +
      '• `@oauthsentry status?` — Check latest scan status\n\n' +
      'I monitor your Google Workspace OAuth apps, GitHub Apps, npm dependencies, and SaaS integrations against live IOC feeds and security advisories.',
    )
  } else {
    await thread.post(
      'OAuthSentry: Type `/oauthsentry scan` to start a security scan, or `@oauthsentry help` for more info.',
    )
  }
})

/**
 * Auto-alert: when critical findings are detected (called from WDK workflow).
 * Posts a card-based alert to a designated channel or thread.
 */
export async function postCriticalAlert(
  channel: string,
  findings: Array<{ asset: { name: string }; headline: string; level: string; score: number }>,
) {
  try {
    const thread = bot.getThread({
      adapter: 'slack',
      channelId: channel,
      threadId: '',
    })

    const message =
      `🚨 OAuthSentry Alert: ${findings.length} critical finding(s)\n\n` +
      findings.map((f) => `• ${f.asset.name}: ${f.headline} (${f.level}, score ${f.score})`).join('\n')

    await thread.post(message)
  } catch (err) {
    console.error('[OAuthSentry] Failed to post critical alert:', err)
  }
}
