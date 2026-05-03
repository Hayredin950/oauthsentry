import { z } from 'zod'

const RequestSchema = z.object({
  finding: z.object({
    asset: z.object({ name: z.string(), identifier: z.string(), kind: z.string() }),
    assetId: z.string(),
    headline: z.string(),
    level: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    score: z.number(),
    reasoning: z.string(),
    recommendation: z.string().optional(),
    cveReferences: z.array(z.object({ id: z.string(), score: z.number() })).optional(),
  }),
  slackWebhookUrl: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = RequestSchema.parse(await req.json())
    
    // Use webhook URL from request body (localStorage) or fall back to env var
    const webhookUrl = body.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL
    if (!webhookUrl) {
      return Response.json(
        { success: false, error: 'Slack Webhook URL not configured. Please add it in Settings.' },
        { status: 400 },
      )
    }
    const finding = body.finding

    // Use NEXT_PUBLIC_APP_URL if set, otherwise use VERCEL_URL, otherwise use the production URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'https://oauthsentry-phi.vercel.app'
    
    // Get severity emoji and color
    const severityConfig = {
      critical: { emoji: '🔴', color: 'danger' },
      high: { emoji: '🟠', color: 'warning' },
      medium: { emoji: '🟡', color: '#ff9900' },
      low: { emoji: '🟢', color: 'good' },
      info: { emoji: '🔵', color: '#0099ff' },
    }
    const severity = severityConfig[finding.level]

    // Parse remediation steps (first 3 lines)
    const remediationSteps = finding.recommendation
      ? finding.recommendation
          .split('\n')
          .filter((line) => line.trim())
          .slice(0, 3)
          .map((step) => `• ${step.trim()}`)
          .join('\n')
      : 'See OAuthSentry for detailed remediation steps'

    // Format CVE references
    const cveText = finding.cveReferences && finding.cveReferences.length > 0
      ? finding.cveReferences.map((ref) => `${ref.id} (CVSS ${ref.score})`).join(' • ')
      : null

    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${severity.emoji} OAuthSentry Security Alert`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Asset:*\n${finding.asset.name}`,
            },
            {
              type: 'mrkdwn',
              text: `*Severity:*\n${severity.emoji} ${finding.level.toUpperCase()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Risk Score:*\n${finding.score}/100`,
            },
            {
              type: 'mrkdwn',
              text: `*Type:*\n${finding.asset.kind}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Finding:*\n${finding.headline}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Context:*\n${finding.reasoning}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Remediation Steps:*\n${remediationSteps}`,
          },
        },
        ...(cveText
          ? [
              {
                type: 'section' as const,
                text: {
                  type: 'mrkdwn' as const,
                  text: `*Threat Intelligence:*\n${cveText}`,
                },
              },
            ]
          : []),
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View in OAuthSentry',
                emoji: true,
              },
              url: `${appUrl}/#scan`,
              style: 'primary',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Full Details',
                emoji: true,
              },
              url: `${appUrl}/?finding=${finding.assetId}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_OAuthSentry Alert • ${new Date().toLocaleString()} • Asset: ${finding.asset.identifier}_`,
            },
          ],
        },
      ],
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
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
