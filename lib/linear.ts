import "server-only"
import type { RiskFinding } from "./types"

// Minimal Linear GraphQL client. Avoids the @linear/sdk dependency to keep
// bundle small and dependencies legible for a hackathon submission.

const LINEAR_API = "https://api.linear.app/graphql"

function getApiKey(): string {
  const key = process.env.LINEAR_API_KEY
  if (!key) {
    throw new Error(
      "LINEAR_API_KEY is not set. Add it in your Vercel project settings.",
    )
  }
  return key
}

async function linearGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      // Linear personal API keys do NOT use the "Bearer " prefix.
      Authorization: getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  })
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] }
  if (!res.ok || json.errors?.length) {
    const msg = json.errors?.map((e) => e.message).join("; ") ?? `HTTP ${res.status}`
    throw new Error(`Linear API error: ${msg}`)
  }
  if (!json.data) throw new Error("Linear API returned no data.")
  return json.data
}

let cachedTeamId: string | null = null

async function resolveTeamId(): Promise<string> {
  if (process.env.LINEAR_TEAM_ID) return process.env.LINEAR_TEAM_ID
  if (cachedTeamId) return cachedTeamId
  const data = await linearGraphQL<{ teams: { nodes: { id: string; name: string }[] } }>(
    "query { teams(first: 1) { nodes { id name } } }",
    {},
  )
  const first = data.teams.nodes[0]
  if (!first) {
    throw new Error(
      "No Linear teams found for this API key. Set LINEAR_TEAM_ID explicitly.",
    )
  }
  cachedTeamId = first.id
  return first.id
}

function buildIssueDescription(finding: RiskFinding): string {
  const factors = finding.factors
    .map((f) => `- **${f.label}** — ${f.detail}`)
    .join("\n")
  const iocs = finding.iocMatches.length
    ? finding.iocMatches.map((id) => `\`${id}\``).join(", ")
    : "_none_"
  return [
    `**Risk Radar finding** — score ${finding.score}/100 (${finding.level})`,
    "",
    `**Asset:** \`${finding.asset.name}\` — \`${finding.asset.identifier}\``,
    `**Kind:** ${finding.asset.kind}`,
    finding.asset.scopes?.length
      ? `**Scopes:** ${finding.asset.scopes.join(", ")}`
      : "",
    finding.asset.owner ? `**Owner:** ${finding.asset.owner}` : "",
    "",
    `### Reasoning`,
    finding.reasoning,
    "",
    `### Risk factors`,
    factors,
    "",
    `### Recommendation`,
    finding.recommendation,
    "",
    `### IOC matches`,
    iocs,
    "",
    "---",
    "_Filed automatically by [Risk Radar](https://risk-radar.example) — Zero to Agent submission._",
  ]
    .filter(Boolean)
    .join("\n")
}

export type CreatedIssue = {
  id: string
  identifier: string
  url: string
  title: string
}

export async function createRiskIssue(
  finding: RiskFinding,
): Promise<CreatedIssue> {
  const teamId = await resolveTeamId()
  const title = `[Risk Radar] ${finding.asset.name}: ${finding.headline}`
  const description = buildIssueDescription(finding)

  const data = await linearGraphQL<{
    issueCreate: { success: boolean; issue: CreatedIssue | null }
  }>(
    `mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url title }
      }
    }`,
    { input: { teamId, title, description } },
  )

  if (!data.issueCreate.success || !data.issueCreate.issue) {
    throw new Error("Linear issueCreate returned success=false.")
  }
  return data.issueCreate.issue
}
