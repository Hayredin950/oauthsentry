/**
 * Linear API client wrapper for OAuthSentry.
 * Files critical findings as issues in a Linear team.
 */

const LINEAR_API_URL = 'https://api.linear.app/graphql'

interface LinearIssueInput {
  teamId: string
  title: string
  description: string
  priority: number // 1-4: urgent, high, medium, low
  assigneeId?: string
  labels?: string[]
}

export async function createLinearIssue(issue: LinearIssueInput): Promise<{ issueId: string; url: string }> {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    throw new Error('LINEAR_API_KEY not set')
  }

  const teamId = process.env.LINEAR_TEAM_ID || issue.teamId
  if (!teamId) {
    throw new Error('LINEAR_TEAM_ID not set')
  }

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `

  const variables = {
    input: {
      teamId,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      assigneeId: issue.assigneeId,
      labelIds: issue.labels || [],
    },
  }

  const res = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query: mutation, variables }),
  })

  if (!res.ok) {
    throw new Error(`Linear API error: ${res.status}`)
  }

  const data = await res.json()
  if (data.errors) {
    throw new Error(`Linear GraphQL error: ${data.errors[0].message}`)
  }

  const createdIssue = data.data.issueCreate.issue
  return { issueId: createdIssue.id, url: createdIssue.url }
}

export async function fileTicketForFinding(
  riskFinding: any,
): Promise<{ success: boolean; issueId?: string; url?: string; error?: string }> {
  try {
    const priority = riskFinding.level === 'critical' ? 1 : riskFinding.level === 'high' ? 2 : 3

    const issue = await createLinearIssue({
      teamId: process.env.LINEAR_TEAM_ID!,
      title: `[${riskFinding.level.toUpperCase()}] ${riskFinding.headline}`,
      description:
        `Asset: ${riskFinding.asset.name} (${riskFinding.asset.kind})\n` +
        `Identifier: ${riskFinding.asset.identifier}\n` +
        `Risk Score: ${riskFinding.score}/100\n\n` +
        `**Reasoning**\n` +
        `${riskFinding.reasoning}\n\n` +
        `**Factors**\n` +
        riskFinding.factors.map((f: any) => `- ${f.label}: ${f.detail}`).join('\n') +
        `\n\n**Recommendation**\n` +
        `${riskFinding.recommendation}`,
      priority,
      labels: [riskFinding.level, riskFinding.asset.kind],
    })

    return { success: true, issueId: issue.issueId, url: issue.url }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
