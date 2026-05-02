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
  timeline?: RiskTimeline[] // Timeline of risk level changes
  detectedAt?: string // When first detected
  escalatedAt?: string // When escalated to critical
  isFalsePositive?: boolean // Mark as false positive
  falsePositiveReason?: string // Why marked as FP
  riskFactorBreakdown?: Array<{ factor: string; points: number }> // Scoring details
  remediationRecommendations?: string[] // Step-by-step remediation steps
  comparisonMetrics?: { severityRank: number; affectedOrgs: number; timeToExploit: string }
}

export type RiskTimeline = {
  date: string // ISO timestamp
  level: RiskLevel
  score: number
  event: string // e.g., "First detected", "Escalated to critical", "Breach disclosed"
}

// Alias for consistency
export type RiskTimelineEvent = {
  date: string
  event: string
  riskLevel: string
  score: number
}

export type RiskFactorBreakdownItem = {
  factor: string
  points: number
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
