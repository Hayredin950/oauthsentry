"use client"

import { Code, ExternalLink, Lock, Zap, Clock, Bell, Shield, GitBranch, Calendar } from "lucide-react"

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  description: string
  auth: "api-key" | "none"
  requestBody?: { field: string; type: string; required: boolean; description: string }[]
  responseFields: { field: string; type: string; description: string }[]
  example?: { request?: string; response: string }
  badge?: string
}

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/scan",
    description: "Run an AI-powered security scan on a list of assets (OAuth apps, npm packages, SaaS tools). Returns a streaming NDJSON response — each line is a JSON event as findings are produced.",
    auth: "api-key",
    badge: "Streaming NDJSON",
    requestBody: [
      { field: "assets", type: "Asset[]", required: true, description: "Array of assets to scan (max 40)" },
      { field: "assets[].id", type: "string", required: true, description: "Unique identifier for the asset" },
      { field: "assets[].kind", type: "'oauth_app' | 'npm_package' | 'saas_tool'", required: true, description: "Asset category" },
      { field: "assets[].name", type: "string", required: true, description: "Human-readable name" },
      { field: "assets[].identifier", type: "string", required: true, description: "OAuth client ID, npm package name, or domain" },
      { field: "assets[].owner", type: "string", required: false, description: "Who installed or owns this asset" },
      { field: "assets[].scopes", type: "string[]", required: false, description: "OAuth/permission scopes granted" },
    ],
    responseFields: [
      { field: "type", type: "'start' | 'finding' | 'error' | 'done'", description: "Event type for each NDJSON line" },
      { field: "finding.score", type: "number (0–100)", description: "Risk score — higher means riskier" },
      { field: "finding.level", type: "'critical' | 'high' | 'medium' | 'low' | 'info'", description: "Risk severity level" },
      { field: "finding.headline", type: "string", description: "Short summary of the identified risk" },
      { field: "finding.reasoning", type: "string", description: "Detailed AI-generated reasoning" },
      { field: "finding.factors", type: "{ label: string; detail: string }[]", description: "Individual risk factor breakdown" },
      { field: "finding.iocMatches", type: "string[]", description: "Matched IOC IDs from threat feeds" },
      { field: "finding.recommendation", type: "string", description: "Actionable remediation steps" },
    ],
    example: {
      request: `POST /api/scan
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "assets": [
    {
      "id": "oauth-context-ai",
      "kind": "oauth_app",
      "name": "Context.ai",
      "identifier": "110671459871-30f1spbu0hptbs60cb4vsmv791tbbvqj.apps.googleusercontent.com",
      "scopes": ["gmail.readonly", "calendar.modify", "contacts.readonly"]
    }
  ]
}`,
      response: `{"type":"start","count":1}
{"type":"finding","finding":{"assetId":"oauth-context-ai","score":95,"level":"critical","headline":"OAuth app involved in major security breach","reasoning":"Context.ai was the vector for the April 2026 Vercel/Context.ai incident...","factors":[{"label":"Breach Confirmed","detail":"Listed in NVD and GitHub Security Advisories"}],"iocMatches":["ioc-context-ai-2026"],"recommendation":"Immediately revoke all permissions..."},"analyzed":1,"total":1}
{"type":"done","analyzed":1}`,
    },
  },
  {
    method: "GET",
    path: "/api/threat-feed",
    description: "Fetch live threat intelligence from NVD, OSV (Google), and GitHub Security Advisories. Results are aggregated, sorted by date, and cached for 1 hour to respect upstream rate limits.",
    auth: "none",
    badge: "Live — NVD · OSV · GitHub",
    responseFields: [
      { field: "items", type: "ThreatItem[]", description: "Array of up to 15 live threat items sorted newest-first" },
      { field: "items[].id", type: "string", description: "CVE ID, GHSA ID, or OSV ID" },
      { field: "items[].title", type: "string", description: "Short title of the threat" },
      { field: "items[].summary", type: "string", description: "Detailed description" },
      { field: "items[].severity", type: "'critical' | 'high' | 'medium' | 'low' | 'info'", description: "Severity mapped from CVSS score" },
      { field: "items[].indicatorKind", type: "'oauth_client' | 'npm' | 'domain' | 'cve'", description: "Type of threat indicator" },
      { field: "items[].indicator", type: "string", description: "The affected identifier (package name, CVE ID, domain)" },
      { field: "items[].source", type: "'NVD' | 'OSV' | 'GITHUB SECURITY'", description: "Source of the threat intelligence" },
      { field: "items[].reference", type: "string (URL)", description: "Direct link to advisory" },
      { field: "items[].publishedAt", type: "ISO 8601 string", description: "When this advisory was published" },
      { field: "fetchedAt", type: "ISO 8601 string", description: "Timestamp of this response" },
    ],
    example: {
      response: `{
  "items": [
    {
      "id": "CVE-2026-12345",
      "title": "CVE-2026-12345: Critical RCE in oauth2-proxy...",
      "summary": "A heap buffer overflow in oauth2-proxy allows remote code execution via malformed token.",
      "severity": "critical",
      "indicatorKind": "cve",
      "indicator": "CVE-2026-12345",
      "source": "NVD",
      "reference": "https://nvd.nist.gov/vuln/detail/CVE-2026-12345",
      "publishedAt": "2026-04-29T00:00:00Z"
    }
  ],
  "sources": ["NVD", "OSV", "GitHub Security"],
  "fetchedAt": "2026-05-03T12:00:00Z"
}`,
    },
  },
  {
    method: "POST",
    path: "/api/actions/file-ticket",
    description: "Create a Linear issue for a specific risk finding. Uses the API key from the request body (set in Settings) or falls back to the LINEAR_API_KEY environment variable.",
    auth: "api-key",
    requestBody: [
      { field: "finding", type: "RiskFinding", required: true, description: "The full finding object from a scan result" },
      { field: "finding.asset.name", type: "string", required: true, description: "Asset name for the ticket title" },
      { field: "finding.score", type: "number", required: true, description: "Risk score (0–100)" },
      { field: "finding.level", type: "string", required: true, description: "Severity level" },
      { field: "finding.headline", type: "string", required: true, description: "Issue title" },
      { field: "finding.reasoning", type: "string", required: true, description: "Issue description body" },
      { field: "finding.recommendation", type: "string", required: true, description: "Remediation steps in the ticket" },
      { field: "linearApiKey", type: "string", required: false, description: "Linear API key (overrides env var)" },
    ],
    responseFields: [
      { field: "success", type: "boolean", description: "Whether the ticket was created" },
      { field: "ticketUrl", type: "string (URL)", description: "Direct URL to the Linear issue" },
      { field: "ticketId", type: "string", description: "Linear issue ID (e.g. OAU-42)" },
      { field: "error", type: "string", description: "Error message if success is false" },
    ],
    example: {
      response: `{
  "success": true,
  "ticketUrl": "https://linear.app/oauthsentry/issue/OAU-42",
  "ticketId": "OAU-42"
}`,
    },
  },
  {
    method: "POST",
    path: "/api/actions/send-alert",
    description: "Send a rich Slack message to your webhook for a risk finding. Uses the webhook URL from the request body (set in Settings) or falls back to the SLACK_WEBHOOK_URL environment variable.",
    auth: "api-key",
    requestBody: [
      { field: "finding", type: "RiskFinding", required: true, description: "The full finding object from a scan result" },
      { field: "finding.asset.name", type: "string", required: true, description: "Asset name displayed in the alert" },
      { field: "finding.score", type: "number", required: true, description: "Risk score shown in the alert" },
      { field: "finding.headline", type: "string", required: true, description: "Alert summary headline" },
      { field: "finding.cveReferences", type: "{ id: string; score: number }[]", required: false, description: "CVE data shown in threat intelligence section" },
      { field: "slackWebhookUrl", type: "string (URL)", required: false, description: "Slack webhook URL (overrides env var)" },
    ],
    responseFields: [
      { field: "success", type: "boolean", description: "Whether the alert was delivered" },
      { field: "error", type: "string", description: "Error message if success is false" },
    ],
    example: {
      response: `{
  "success": true
}`,
    },
  },
  {
    method: "GET",
    path: "/api/scheduled-scans",
    description: "Retrieve all saved scheduled scan configurations from Upstash Redis.",
    auth: "api-key",
    responseFields: [
      { field: "success", type: "boolean", description: "Whether the request succeeded" },
      { field: "schedules", type: "ScheduleConfig[]", description: "Array of all saved schedules" },
      { field: "schedules[].id", type: "string", description: "Unique schedule ID" },
      { field: "schedules[].frequency", type: "'daily' | 'weekly' | 'monthly'", description: "How often the scan runs" },
      { field: "schedules[].time", type: "string (HH:MM)", description: "Time of day to run" },
      { field: "schedules[].recipients", type: "string[]", description: "Email addresses for reports" },
      { field: "schedules[].enabled", type: "boolean", description: "Whether this schedule is active" },
      { field: "schedules[].nextRun", type: "ISO 8601 string", description: "When this scan will next execute" },
      { field: "schedules[].lastRun", type: "ISO 8601 string", description: "When this scan last ran (if ever)" },
    ],
    example: {
      response: `{
  "success": true,
  "schedules": [
    {
      "id": "schedule-1746123456-abc123",
      "frequency": "daily",
      "time": "09:00",
      "recipients": ["security@company.com"],
      "includeCharts": true,
      "includeRecommendations": true,
      "enabled": true,
      "createdAt": "2026-05-01T00:00:00Z",
      "nextRun": "2026-05-04T09:00:00Z",
      "lastRun": "2026-05-03T09:00:00Z"
    }
  ]
}`,
    },
  },
  {
    method: "POST",
    path: "/api/scheduled-scans",
    description: "Create a new scheduled scan configuration. The schedule is persisted to Upstash Redis and the next run time is calculated automatically.",
    auth: "api-key",
    requestBody: [
      { field: "frequency", type: "'daily' | 'weekly' | 'monthly'", required: true, description: "How often to run the scan" },
      { field: "time", type: "string (HH:MM)", required: true, description: "Time of day to run (24h format)" },
      { field: "dayOfWeek", type: "number (0–6)", required: false, description: "Day of week for weekly schedules (0=Sunday)" },
      { field: "dayOfMonth", type: "number (1–31)", required: false, description: "Day of month for monthly schedules" },
      { field: "recipients", type: "string[]", required: false, description: "Email addresses to notify" },
      { field: "includeCharts", type: "boolean", required: false, description: "Include visual charts in report (default: true)" },
      { field: "includeRecommendations", type: "boolean", required: false, description: "Include remediation steps (default: true)" },
    ],
    responseFields: [
      { field: "success", type: "boolean", description: "Whether the schedule was saved" },
      { field: "schedule", type: "ScheduleConfig", description: "The created schedule with computed nextRun" },
    ],
    example: {
      response: `{
  "success": true,
  "schedule": {
    "id": "schedule-1746123456-abc123",
    "frequency": "daily",
    "time": "09:00",
    "enabled": true,
    "nextRun": "2026-05-04T09:00:00Z",
    "createdAt": "2026-05-03T12:00:00Z"
  }
}`,
    },
  },
  {
    method: "POST",
    path: "/api/scheduled-scans/execute",
    description: "Immediately execute a specific scheduled scan by ID, or run all due scans when called by Vercel Cron (every 15 minutes). Returns scan results including findings summary.",
    auth: "api-key",
    badge: "Vercel Cron every 15 min",
    requestBody: [
      { field: "scheduleId", type: "string", required: false, description: "Specific schedule ID to run. Omit to run all due schedules (Cron mode)" },
    ],
    responseFields: [
      { field: "success", type: "boolean", description: "Whether the scan executed" },
      { field: "result.findingsCount", type: "number", description: "Total findings from this scan" },
      { field: "result.criticalCount", type: "number", description: "Number of critical severity findings" },
      { field: "result.highCount", type: "number", description: "Number of high severity findings" },
      { field: "result.ranAt", type: "ISO 8601 string", description: "When this execution ran" },
    ],
    example: {
      request: `POST /api/scheduled-scans/execute
Content-Type: application/json

{ "scheduleId": "schedule-1746123456-abc123" }`,
      response: `{
  "success": true,
  "result": {
    "findingsCount": 5,
    "criticalCount": 2,
    "highCount": 2,
    "ranAt": "2026-05-03T12:00:00Z"
  }
}`,
    },
  },
  {
    method: "POST",
    path: "/api/workflow",
    description: "Trigger a durable WDK (Workflow Development Kit) scan workflow that enumerates assets from Google Workspace, GitHub, npm, and SaaS tools, then runs the AI scan agent, and posts Slack alerts for critical findings.",
    auth: "api-key",
    requestBody: [
      { field: "trigger", type: "'manual-scan'", required: true, description: "Trigger type — only 'manual-scan' is supported" },
    ],
    responseFields: [
      { field: "runId", type: "string", description: "The durable workflow run ID for tracking" },
      { field: "status", type: "'started'", description: "Confirmation the workflow was started" },
    ],
    example: {
      request: `POST /api/workflow
Content-Type: application/json

{ "trigger": "manual-scan" }`,
      response: `{
  "runId": "wf_9x3kZ1mNpQ2rT8",
  "status": "started"
}`,
    },
  },
]

const methodColors: Record<string, string> = {
  GET: "bg-green-500/10 text-green-600 border border-green-500/20",
  POST: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-600 border border-red-500/20",
}

export default function ApiDocumentation() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/20">
              <Code className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            OAuthSentry exposes a REST API for programmatic scanning, live threat intelligence, Linear ticket filing, Slack alerting, and scheduled scan management. All endpoints are available at{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">https://oauthsentry.vercel.app</code>.
          </p>
        </div>

        {/* API Overview cards */}
        <div className="grid grid-cols-2 gap-3 mb-10 sm:grid-cols-4">
          {[
            { icon: Zap, label: "Streaming scan", sub: "NDJSON" },
            { icon: Shield, label: "Live threat feed", sub: "NVD · OSV · GitHub" },
            { icon: Bell, label: "Slack + Linear", sub: "Real alerts" },
            { icon: Calendar, label: "Scheduled scans", sub: "Upstash Redis" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-3 text-center">
              <Icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Authentication */}
        <section className="mb-10 rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Authentication</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Endpoints marked <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">api-key</span> require your API key set in the{" "}
            <strong>Settings</strong> dialog in the app (for Linear and Slack integrations), or as environment variables on the server. For programmatic access:
          </p>
          <div className="rounded-md bg-muted p-3 overflow-x-auto">
            <pre className="text-xs font-mono text-foreground/90">{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  https://oauthsentry.vercel.app/api/scan`}</pre>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><span className="font-mono bg-muted px-1 rounded">LINEAR_API_KEY</span> — Linear API key (from linear.app/settings/account/security)</p>
            <p><span className="font-mono bg-muted px-1 rounded">SLACK_WEBHOOK_URL</span> — Slack Incoming Webhook URL</p>
            <p><span className="font-mono bg-muted px-1 rounded">KV_REST_API_URL / KV_REST_API_TOKEN</span> — Upstash Redis (for scheduled scans)</p>
          </div>
        </section>

        {/* Endpoints */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Endpoints ({endpoints.length})</h2>

          {endpoints.map((endpoint, i) => (
            <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Endpoint header */}
              <div className="flex items-start gap-3 p-4 border-b border-border/60 bg-muted/20">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0 ${methodColors[endpoint.method]}`}>
                  {endpoint.method}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono font-semibold">{endpoint.path}</code>
                    {endpoint.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                        {endpoint.badge}
                      </span>
                    )}
                    {endpoint.auth === "none" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium border border-green-500/20">
                        No auth required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{endpoint.description}</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Request body */}
                {endpoint.requestBody && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Request Body</p>
                    <div className="rounded-md border border-border/60 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold">Field</th>
                            <th className="text-left px-3 py-2 font-semibold">Type</th>
                            <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Required</th>
                            <th className="text-left px-3 py-2 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {endpoint.requestBody.map((field, j) => (
                            <tr key={j} className="hover:bg-muted/20">
                              <td className="px-3 py-2 font-mono text-[11px] text-foreground/90 whitespace-nowrap">{field.field}</td>
                              <td className="px-3 py-2 font-mono text-[11px] text-blue-600/80">{field.type}</td>
                              <td className="px-3 py-2 hidden sm:table-cell">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${field.required ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                                  {field.required ? 'required' : 'optional'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{field.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Response fields */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Response</p>
                  <div className="rounded-md border border-border/60 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold">Field</th>
                          <th className="text-left px-3 py-2 font-semibold">Type</th>
                          <th className="text-left px-3 py-2 font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {endpoint.responseFields.map((field, j) => (
                          <tr key={j} className="hover:bg-muted/20">
                            <td className="px-3 py-2 font-mono text-[11px] text-foreground/90 whitespace-nowrap">{field.field}</td>
                            <td className="px-3 py-2 font-mono text-[11px] text-green-600/80">{field.type}</td>
                            <td className="px-3 py-2 text-muted-foreground">{field.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Example */}
                {endpoint.example && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Example</p>
                    {endpoint.example.request && (
                      <div className="mb-2 rounded-md bg-muted p-3 overflow-x-auto">
                        <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase">Request</p>
                        <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap">{endpoint.example.request}</pre>
                      </div>
                    )}
                    <div className="rounded-md bg-muted p-3 overflow-x-auto">
                      <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase">Response</p>
                      <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap">{endpoint.example.response}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Error codes */}
        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Error Codes</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Meaning</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Common cause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  { code: "200 OK", meaning: "Success", cause: "Request processed correctly" },
                  { code: "400 Bad Request", meaning: "Invalid request", cause: "Missing required fields or wrong types — check Zod schema errors in response" },
                  { code: "401 Unauthorized", meaning: "Authentication required", cause: "LINEAR_API_KEY or SLACK_WEBHOOK_URL not configured" },
                  { code: "404 Not Found", meaning: "Resource missing", cause: "Schedule ID not found in Upstash Redis" },
                  { code: "429 Too Many Requests", meaning: "Rate limited", cause: "NVD or GitHub APIs are rate-limited — the threat feed caches for 1 hour to mitigate this" },
                  { code: "500 Internal Server Error", meaning: "Server error", cause: "AI Gateway failure, upstream API error, or Upstash Redis connection issue" },
                ].map(({ code, meaning, cause }) => (
                  <tr key={code} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{code}</td>
                    <td className="px-4 py-3 text-sm font-medium">{meaning}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{cause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rate limiting */}
        <section className="mt-10 rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Rate Limits</h2>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/api/scan</code> — Max 40 assets per request. AI Gateway token limits apply per model.</li>
            <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/api/threat-feed</code> — Cached for 1 hour. NVD free tier: 5 requests/30s without API key.</li>
            <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/api/actions/*</code> — Slack webhook: no hard limit. Linear: 1,500 req/hour.</li>
            <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/api/scheduled-scans/execute</code> — Triggered by Vercel Cron every 15 minutes.</li>
          </ul>
        </section>

        {/* GitHub link */}
        <section className="mt-10 p-4 rounded-lg bg-primary/5 border border-primary/15">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm">
              View source, open issues, or contribute at{" "}
              <a
                href="https://github.com/HayreKhan750/oauthsentry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline underline-offset-4 inline-flex items-center gap-1"
              >
                github.com/HayreKhan750/oauthsentry
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
