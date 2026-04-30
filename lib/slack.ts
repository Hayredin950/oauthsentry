import "server-only"
import type { CreatedIssue } from "./linear"
import type { RiskFinding } from "./types"

const SEVERITY_EMOJI: Record<RiskFinding["level"], string> = {
  critical: ":rotating_light:",
  high: ":warning:",
  medium: ":large_yellow_circle:",
  low: ":information_source:",
  info: ":white_check_mark:",
}

function getWebhookUrl(): string {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) {
    throw new Error(
      "SLACK_WEBHOOK_URL is not set. Add it in your Vercel project settings.",
    )
  }
  return url
}

export async function sendRiskAlert(
  finding: RiskFinding,
  ticket?: CreatedIssue,
): Promise<{ ok: true }> {
  const url = getWebhookUrl()

  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${SEVERITY_EMOJI[finding.level]} Risk Radar — ${finding.level.toUpperCase()}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${finding.asset.name}*  \`${finding.asset.identifier}\`\n${finding.headline}`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Score*\n${finding.score}/100` },
        { type: "mrkdwn", text: `*Kind*\n\`${finding.asset.kind}\`` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Reasoning*\n${finding.reasoning}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Recommendation*\n${finding.recommendation}` },
    },
  ]

  if (ticket) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: `Open ${ticket.identifier}` },
          url: ticket.url,
        },
      ],
    })
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Filed automatically by Risk Radar \u2022 Zero to Agent`,
      },
    ],
  })

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `Risk Radar: ${finding.level.toUpperCase()} \u2014 ${finding.asset.name}: ${finding.headline}`,
      blocks,
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Slack webhook failed (${res.status}): ${txt}`)
  }

  return { ok: true }
}
