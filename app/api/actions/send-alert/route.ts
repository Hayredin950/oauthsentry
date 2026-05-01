import { z } from 'zod'

const RequestSchema = z.object({
  finding: z.object({
    asset: z.object({ name: z.string() }),
    headline: z.string(),
    level: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    score: z.number(),
    reasoning: z.string(),
  }),
})

export async function POST(req: Request) {
  try {
    if (!process.env.SLACK_WEBHOOK_URL) {
      return Response.json(
        { success: false, error: 'SLACK_WEBHOOK_URL not configured' },
        { status: 500 },
      )
    }

    const body = RequestSchema.parse(await req.json())

    const res = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 OAuthSentry Alert\n*${body.finding.asset.name}* — ${body.finding.level.toUpperCase()}\n${body.finding.headline}\nScore: ${body.finding.score}/100`,
      }),
    })

    if (!res.ok) {
      return Response.json(
        { success: false, error: `Slack API error: ${res.status}` },
        { status: 500 },
      )
    }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    )
  }
}
