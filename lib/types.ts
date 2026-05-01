export type AssetKind = "oauth_app" | "npm_package" | "saas_tool"

export type RiskLevel = "critical" | "high" | "medium" | "low" | "info"

export type RiskFactor = {
  label: string
  detail: string
}

export type StackAsset = {
  id: string
  kind: AssetKind
  name: string
  identifier: string // OAuth client ID, npm pkg id, vendor domain
  owner?: string
  installedBy?: string
  scopes?: string[]
}

export type RiskFinding = {
  assetId: string
  asset: StackAsset
  score: number // 0-100
  level: RiskLevel
  headline: string
  reasoning: string
  factors: RiskFactor[]
  iocMatches: string[] // IOC ids
  recommendation: string
  ticketStatus?: "none" | "filed" | "filing"
  alertStatus?: "none" | "sent" | "sending"
  remediationStatus?: "open" | "in-progress" | "resolved"
  remediationDate?: string // ISO timestamp when resolved
  linkedTicketUrl?: string // Link to Linear ticket
  cveReferences?: Array<{ id: string; score: number; source: string }>
}

export type IOC = {
  id: string
  publishedAt: string // ISO
  source: string
  severity: RiskLevel
  title: string
  summary: string
  indicator: string // hash, oauth id, domain, etc.
  indicatorKind: "oauth_client_id" | "domain" | "package" | "hash"
  reference?: string
}
