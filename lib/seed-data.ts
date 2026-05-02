import type { IOC, RiskFinding, StackAsset } from "./types"

// IOCs include the real Context.ai OAuth client ID disclosed in the
// Vercel April 2026 security bulletin, plus plausible illustrative items.
export const seedIOCs: IOC[] = [
  {
    id: "ioc-2026-04-19-context",
    publishedAt: "2026-04-19T11:04:00Z",
    source: "Vercel Security Bulletin",
    severity: "critical",
    title: "Context.ai OAuth app compromised",
    summary:
      "Third-party AI meeting tool's Google Workspace OAuth app subject to broader compromise. Used as initial access vector against a Vercel employee's Google Workspace.",
    indicator: "110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com",
    indicatorKind: "oauth_client_id",
    reference: "https://vercel.com/kb/bulletin",
  },
  {
    id: "ioc-2026-04-22-pkg-clipboard",
    publishedAt: "2026-04-22T08:14:00Z",
    source: "Socket Threat Intel",
    severity: "high",
    title: "Typosquat: clipboardz",
    summary:
      "Malicious npm package mimicking 'clipboardy'. Exfiltrates env vars on postinstall. Affects 14 known downstream consumers.",
    indicator: "clipboardz",
    indicatorKind: "package",
  },
  {
    id: "ioc-2026-04-21-stalebot",
    publishedAt: "2026-04-21T15:32:00Z",
    source: "GitHub Security Advisory",
    severity: "high",
    title: "Abandoned GitHub App: stalebot-pro",
    summary:
      "Vendor sunset 11 months ago, repository transferred. New owner pushed permission escalation in v3.2.0.",
    indicator: "stalebot-pro.com",
    indicatorKind: "domain",
  },
  {
    id: "ioc-2026-04-20-meetscribe",
    publishedAt: "2026-04-20T09:11:00Z",
    source: "Mandiant",
    severity: "medium",
    title: "MeetScribe AI: excessive scope drift",
    summary:
      "OAuth app silently expanded scopes from calendar.readonly to gmail.modify in March 2026 release. No customer notification.",
    indicator: "meetscribe.app",
    indicatorKind: "domain",
  },
  {
    id: "ioc-2026-04-18-evalrunner",
    publishedAt: "2026-04-18T17:48:00Z",
    source: "Snyk",
    severity: "medium",
    title: "evalrunner@2.4.1: prototype pollution",
    summary:
      "CVE-2026-3318. Allows arbitrary property assignment via crafted JSON input. Patched in 2.4.2.",
    indicator: "evalrunner",
    indicatorKind: "package",
  },
  {
    id: "ioc-2026-04-17-loomy",
    publishedAt: "2026-04-17T12:00:00Z",
    source: "OSV",
    severity: "low",
    title: "loomy-cli@1.0.3: deprecated",
    summary:
      "Maintainer marked package deprecated; recommends migration to upstream 'looma'.",
    indicator: "loomy-cli",
    indicatorKind: "package",
  },
]

// Default stack inventory pre-loaded into the textarea so judges
// can hit "Run scan" immediately without typing.
export const seedAssets: StackAsset[] = [
  {
    id: "asset-context",
    kind: "oauth_app",
    name: "Context.ai",
    identifier: "110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com",
    owner: "engineering@acme.co",
    installedBy: "j.chen@acme.co",
    scopes: ["calendar.readonly", "gmail.readonly", "drive.file"],
  },
  {
    id: "asset-meetscribe",
    kind: "oauth_app",
    name: "MeetScribe AI",
    identifier: "meetscribe.app",
    owner: "ops@acme.co",
    installedBy: "m.patel@acme.co",
    scopes: ["calendar.readonly", "gmail.modify"],
  },
  {
    id: "asset-stalebot",
    kind: "oauth_app",
    name: "stalebot-pro",
    identifier: "stalebot-pro.com",
    owner: "platform@acme.co",
    scopes: ["repo", "workflow", "admin:org"],
  },
  {
    id: "asset-clipboardz",
    kind: "npm_package",
    name: "clipboardz",
    identifier: "clipboardz@1.0.0",
    owner: "frontend-team",
  },
  {
    id: "asset-evalrunner",
    kind: "npm_package",
    name: "evalrunner",
    identifier: "evalrunner@2.4.1",
    owner: "platform-team",
  },
  {
    id: "asset-linear",
    kind: "saas_tool",
    name: "Linear",
    identifier: "linear.app",
    owner: "product@acme.co",
    scopes: ["read", "write"],
  },
  {
    id: "asset-slack",
    kind: "saas_tool",
    name: "Slack",
    identifier: "slack.com",
    owner: "ops@acme.co",
  },
  {
    id: "asset-loomy",
    kind: "npm_package",
    name: "loomy-cli",
    identifier: "loomy-cli@1.0.3",
    owner: "design-team",
  },
]

// Pre-baked findings for the v1 demo. Day 2 will replace with the
// real AI SDK 6 streaming agent output.
export const seedFindings: RiskFinding[] = [
  {
    assetId: "asset-context",
    asset: seedAssets[0],
    score: 96,
    level: "critical",
    headline: "Confirmed compromise — rotate credentials immediately",
    reasoning:
      "OAuth client ID matches the Indicator of Compromise published in the Vercel April 2026 security bulletin. This app was the initial access vector for the Vercel/Context.ai incident. The installed scopes (calendar, gmail, drive) match the surface area used during enumeration.",
    factors: [
      { label: "Direct IOC match", detail: "OAuth client ID listed in Vercel bulletin (Apr 19, 2026)" },
      { label: "High-impact scopes", detail: "gmail.readonly grants persistent inbox access" },
      { label: "Recent compromise", detail: "Active investigation, third-party scope unknown" },
    ],
    iocMatches: ["ioc-2026-04-19-context"],
    recommendation:
      "Revoke the OAuth grant in Google Workspace Admin > Security > API controls. Rotate all secrets accessible to the installer (j.chen@acme.co). Audit Vercel env-variable read events for the past 14 days.",
    ticketStatus: "none",
    alertStatus: "none",
  },
  {
    assetId: "asset-clipboardz",
    asset: seedAssets[3],
    score: 88,
    level: "critical",
    headline: "Typosquatted package with active payload",
    reasoning:
      "Package 'clipboardz' is a typosquat of the legitimate 'clipboardy' library. Postinstall script exfiltrates process.env to a remote endpoint. Confirmed by Socket on Apr 22, 2026.",
    factors: [
      { label: "Typosquat", detail: "Levenshtein distance 1 from 'clipboardy' (60M+ weekly downloads)" },
      { label: "Malicious postinstall", detail: "Runs network call to dns-cache.io on install" },
      { label: "Recently published", detail: "Created 9 days ago, no prior history" },
    ],
    iocMatches: ["ioc-2026-04-22-pkg-clipboard"],
    recommendation:
      "Remove from package.json, run pnpm install --frozen-lockfile, rotate any secrets that may have been read from .env on developer machines or CI runners.",
    ticketStatus: "none",
    alertStatus: "none",
  },
  {
    assetId: "asset-stalebot",
    asset: seedAssets[2],
    score: 74,
    level: "high",
    headline: "Abandoned vendor — repository transferred to unverified owner",
    reasoning:
      "stalebot-pro was sunset by its original maintainer 11 months ago. The GitHub App's underlying repo was transferred to a new account in March 2026 and a permission escalation shipped in v3.2.0. App still installed in 1 organization with admin:org scope.",
    factors: [
      { label: "Ownership change", detail: "Domain WHOIS updated 2026-03-04" },
      { label: "Scope escalation", detail: "admin:org added in v3.2.0 without changelog disclosure" },
      { label: "Wide blast radius", detail: "admin:org allows full org configuration changes" },
    ],
    iocMatches: ["ioc-2026-04-21-stalebot"],
    recommendation:
      "Uninstall the GitHub App. Replace with a maintained alternative or build an internal action. Audit org-level changes since 2026-03-04.",
    ticketStatus: "none",
    alertStatus: "none",
  },
  {
    assetId: "asset-meetscribe",
    asset: seedAssets[1],
    score: 62,
    level: "high",
    headline: "Silent scope expansion to gmail.modify",
    reasoning:
      "MeetScribe AI silently expanded its OAuth scopes from calendar.readonly to gmail.modify in their March 2026 release with no customer notification. gmail.modify allows reading, sending, and deleting mail.",
    factors: [
      { label: "Scope drift", detail: "calendar.readonly \u2192 gmail.modify (March 2026)" },
      { label: "No disclosure", detail: "No email or in-product notice from vendor" },
      { label: "Persistent access", detail: "Refresh token grants long-lived access" },
    ],
    iocMatches: ["ioc-2026-04-20-meetscribe"],
    recommendation:
      "Review need for gmail.modify with the installer (m.patel@acme.co). If not required, downgrade scopes or revoke. Consider vendor-risk review.",
    ticketStatus: "none",
    alertStatus: "none",
  },
  {
    assetId: "asset-evalrunner",
    asset: seedAssets[4],
    score: 48,
    level: "medium",
    headline: "Known CVE — patch available",
    reasoning:
      "evalrunner@2.4.1 contains CVE-2026-3318 (prototype pollution via crafted JSON input). Patched in 2.4.2. Exploitable only when input is user-controlled and parsed without a schema.",
    factors: [
      { label: "CVE-2026-3318", detail: "CVSS 6.5 (medium)" },
      { label: "Patch available", detail: "Upgrade to 2.4.2 or later" },
    ],
    iocMatches: ["ioc-2026-04-18-evalrunner"],
    recommendation: "Bump to evalrunner@^2.4.2. No code changes required.",
    ticketStatus: "none",
    alertStatus: "none",
  },
  {
    assetId: "asset-loomy",
    asset: seedAssets[7],
    score: 22,
    level: "low",
    headline: "Deprecated dependency",
    reasoning:
      "loomy-cli was marked deprecated by its maintainer. No security issue, but no future patches. Replacement is the upstream 'looma' package.",
    factors: [{ label: "Deprecated", detail: "Maintainer recommends migration to 'looma'" }],
    iocMatches: ["ioc-2026-04-17-loomy"],
    recommendation: "Schedule migration to 'looma' within the next sprint.",
    ticketStatus: "none",
    alertStatus: "none",
  },
  {
    assetId: "asset-linear",
    asset: seedAssets[5],
    score: 8,
    level: "info",
    headline: "No known issues",
    reasoning: "No matching IOCs. Vendor has clean security record. Scopes are appropriate for use.",
    factors: [{ label: "Clean", detail: "No advisories in the last 90 days" }],
    iocMatches: [],
    recommendation: "Continue monitoring.",
  },
  {
    assetId: "asset-slack",
    asset: seedAssets[6],
    score: 8,
    level: "info",
    headline: "No known issues",
    reasoning: "No matching IOCs. Vendor maintains SOC 2 Type II.",
    factors: [{ label: "Clean", detail: "No advisories in the last 90 days" }],
    iocMatches: [],
    recommendation: "Continue monitoring.",
  },
]

export const seedInventoryText = seedAssets
  .map((a) => `${a.kind === "oauth_app" ? "oauth" : a.kind === "npm_package" ? "npm" : "saas"}: ${a.name} (${a.identifier})`)
  .join("\n")

// Alternative inventory for testing different scenarios
export const testInventories = {
  minimal: `oauth: Google Calendar (google-calendar.app)
saas: Notion (notion.so)`,
  
  npmFocused: `npm: lodash (lodash@4.17.21)
npm: axios (axios@1.6.0)
npm: express (express@4.18.2)
npm: react (react@18.2.0)
npm: typescript (typescript@5.3.0)`,
  
  oauthFocused: `oauth: Zoom (zoom.us)
oauth: Salesforce (salesforce.com)
oauth: GitHub (github.com/oauth)
oauth: Google Drive (drive.google.com)
oauth: Dropbox (dropbox.com)`,
  
  enterprise: `oauth: Context.ai (110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com)
oauth: Okta SSO (okta.com/sso)
oauth: Microsoft 365 (microsoft365.com)
saas: Jira (jira.atlassian.com)
saas: Confluence (confluence.atlassian.com)
saas: Datadog (datadoghq.com)
npm: aws-sdk (@aws-sdk/client-s3@3.400.0)
npm: prisma (@prisma/client@5.0.0)`,
}
