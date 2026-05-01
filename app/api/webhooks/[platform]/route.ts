import { bot } from '@/lib/bot'
import { after } from 'next/server'

/**
 * Webhook route handler for Chat SDK (Slack events).
 * Vercel Sandbox automatically detects the port and routes webhooks here.
 */
type Platform = keyof typeof bot.webhooks

export async function POST(
  request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const { platform } = await context.params
  const handler = bot.webhooks[platform as Platform]

  if (!handler) {
    return new Response(`Unknown platform: ${platform}`, { status: 404 })
  }

  // Use `after` to ensure message processing completes after HTTP response
  return handler(request, {
    waitUntil: (task: Promise<any>) => after(() => task),
  })
}
