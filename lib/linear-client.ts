/**
 * Linear API client wrapper for OAuthSentry.
 * Files critical findings as issues in a Linear team.
 * Auto-discovers team ID from workspace - no configuration needed.
 */
const LINEAR_API_URL = 'https://api.linear.app/graphql'

interface LinearIssueInput {
  teamId?: string
  title: string
  description: string
  priority: number // 1-4: urgent, high, medium, low
  assigneeId?: string
  labels?: string[]
}

/**
 * Fetch user's first team ID if not provided
 */
async function fetchTeamId(apiKey: string, providedTeamId?: string): Promise<string> {
  if (providedTeamId) return providedTeamId

  const query = `
    query GetTeams {
      teams(first: 1) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `

  const res = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query }),
  })

  const data = await res.json()
  if (data.errors) {
    throw new Error(`Linear API error: ${data.errors[0].message}`)
  }

  const teamId = data.data?.teams?.edges?.[0]?.node?.id
  if (!teamId) {
    throw new Error('No teams found in Linear workspace')
  }

  return teamId
}

export async function createLinearIssue(issue: LinearIssueInput): Promise<{ issueId: string; url: string }> {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    throw new Error('LINEAR_API_KEY not set')
  }

  const teamId = await fetchTeamId(apiKey, issue.teamId || process.env.LINEAR_TEAM_ID)

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

    console.log('[OAuthSentry] Linear ticket created:', issue.issueId, issue.url)
    return { success: true, issueId: issue.issueId, url: issue.url }
  } catch (err) {
    const error = err as Error
    console.error('[OAuthSentry] Failed to file Linear ticket:', error.message)
    return { success: false, error: error.message }
  }
}
