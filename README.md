# OAuthSentry — Third-Party AI & OAuth Risk Agent

> Find the third-party AI tool that breaches you before it does.

OAuthSentry is a production-ready security agent that continuously scans your organization's OAuth apps, third-party AI integrations, and npm dependencies against live IOC threat feeds. High-risk findings automatically file Linear tickets and send Slack alerts in real-time.

**Built for:** Security teams protecting against supply-chain attacks and compromised AI tool integrations.

---

## What OAuthSentry Does

### The Problem
After the April 2026 Vercel/Context.ai incident where a compromised OAuth app pivoted into employee Google Workspace accounts, security teams need continuous monitoring of:
- OAuth apps with excessive permissions
- Third-party AI integrations with admin scopes
- Malicious npm packages (typosquats, backdoors)
- Vendor trust changes and abandoned projects

### The Solution
OAuthSentry:
1. **Scans** your assets (OAuth apps, npm packages, SaaS tools) using AI
2. **Scores** findings 0–100 with IOC matching and detailed reasoning
3. **Files** Linear tickets automatically for critical risks
4. **Alerts** your team in Slack with rich, actionable messages
5. **Monitors** 24/7 with scheduled scans persisted in Upstash Redis
6. **Shows** live threat intelligence from NVD, OSV, and GitHub Security Advisories

---

## Quick Start

### 1. Clone and install
```bash
git clone https://github.com/HayreKhan750/oauthsentry
cd oauthsentry
pnpm install
```

### 2. Set environment variables
Create a `.env.local` file:
```env
# Required — Vercel AI Gateway (for scan AI analysis)
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key

# Optional — Linear integration (file tickets from findings)
LINEAR_API_KEY=your_linear_api_key

# Optional — Slack integration (send alerts from findings)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Required for scheduled scans — Upstash Redis
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token

# Optional — used in Slack alert links
NEXT_PUBLIC_APP_URL=https://your-deployment.vercel.app
```

> **Note:** Linear and Slack keys can also be configured at runtime through the Settings dialog in the app UI — no redeployment needed.

### 3. Run locally
```bash
pnpm dev
```

Open http://localhost:3000

---

## Features

### Demo Mode
Click **Demo Mode** to instantly load 5 realistic findings (Context.ai, stalebot-pro, clipboardz, MeetScribe AI, evalrunner) without running a live AI scan. All 15 features work with demo data.

### Live Scan
Click **Run Scan** to scan real assets using the AI agent (`/api/scan`). The AI analyzes each asset against IOC feeds and security advisories, streaming findings in real-time via NDJSON.

### Threat Intelligence Feed
Live feed sourced from:
- **NVD** (National Vulnerability Database) — recent HIGH/CRITICAL CVEs
- **OSV** (Google Open Source Vulnerabilities) — npm ecosystem advisories
- **GitHub Security Advisories** — GHSA records for high/critical issues

No seeded or hardcoded data — if APIs are unavailable, a retry message is shown.

### Linear Integration
Set your Linear API key in Settings → click **File Linear ticket** on any finding → a detailed issue is created in your Linear workspace with severity, score, reasoning, risk factors, and remediation steps.

### Slack Integration
Set your Slack Webhook URL in Settings → click **Send Slack alert** on any finding → a rich Block Kit message is posted with asset details, score, severity, remediation steps, and action buttons.

### Scheduled Scans
Create daily/weekly/monthly scan schedules through the UI. Schedules are persisted to Upstash Redis. A Vercel Cron job fires every 15 minutes to execute any due schedules. Use **Run Now** to trigger a schedule immediately.

### PDF Export
Click **Export** on the dashboard to generate a multi-page PDF report including cover page, executive summary, full findings table, CVE references, and remediation recommendations.

---

## Architecture

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 16 App Router + Tailwind CSS v4 |
| AI | Vercel AI SDK 6 + AI Gateway (`openai/gpt-4o-mini`) |
| Workflows | Vercel WDK (durable, resumable scan orchestration) |
| Storage | Upstash Redis (scheduled scans) |
| Integrations | Linear GraphQL API + Slack Incoming Webhooks |
| Threat Feeds | NVD REST API + OSV API + GitHub Security REST API |
| Hosting | Vercel |

### API Routes
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/scan` | AI-powered streaming scan — returns NDJSON findings |
| `GET` | `/api/threat-feed` | Live threat intelligence from NVD, OSV, GitHub |
| `POST` | `/api/actions/file-ticket` | Create Linear issue for a finding |
| `POST` | `/api/actions/send-alert` | Send Slack alert for a finding |
| `GET` | `/api/scheduled-scans` | List all saved scan schedules (Upstash) |
| `POST` | `/api/scheduled-scans` | Create a new schedule (Upstash) |
| `PUT` | `/api/scheduled-scans` | Update/toggle a schedule |
| `DELETE` | `/api/scheduled-scans` | Delete a schedule |
| `POST` | `/api/scheduled-scans/execute` | Run a specific or all due schedules |
| `POST` | `/api/workflow` | Trigger a durable WDK scan workflow |
| `GET` | `/api/workflow/cron` | Vercel Cron endpoint (every 15 min) |

Full API documentation: https://oauthsentry.vercel.app/api-docs

### Data Flow
```
User clicks "Run Scan"
    ↓
POST /api/scan with asset list
    ↓
AI analyzes each asset against IOC feeds + advisories (streaming)
    ↓
RiskFinding[] streamed to dashboard in real-time
    ↓
User clicks "File ticket" → POST /api/actions/file-ticket
    ↓
Linear issue created via GraphQL API
    ↓
User clicks "Send alert" → POST /api/actions/send-alert
    ↓
Rich Block Kit message posted to Slack webhook
```

### File Structure
```
app/
  layout.tsx                         Root layout + ThemeProvider
  page.tsx                           Main dashboard
  globals.css                        Tailwind v4 + design tokens
  api-docs/page.tsx                  API documentation page
  api/
    scan/route.ts                    AI scan agent (streaming NDJSON)
    threat-feed/route.ts             Live NVD + OSV + GitHub feed
    actions/
      file-ticket/route.ts           Linear ticket filing
      send-alert/route.ts            Slack alert posting
    scheduled-scans/
      route.ts                       CRUD for Upstash-backed schedules
      execute/route.ts               Execute due scans + Cron handler
    workflow/
      route.ts                       WDK durable workflow
      cron/route.ts                  Vercel Cron trigger

lib/
  types.ts                           TypeScript types
  linear-client.ts                   Linear GraphQL client
  risk-knowledge.ts                  IOC feeds + vendor advisories
  risk-schema.ts                     Zod schema for AI output
  generate-demo-findings.ts          Demo mode data
  scan-context.tsx                   React context for scan state
  seed-data.ts                       IOC seed data for risk analysis

components/
  site-header.tsx                    Sticky header + navigation
  hero.tsx                           Landing hero section
  risk-scanner.tsx                   Main scan form + asset inventory
  risk-results-table.tsx             Findings table with all features
  metrics-dashboard.tsx              Summary metrics + charts
  ioc-feed.tsx                       Live threat feed sidebar
  risk-timeline.tsx                  Finding risk progression
  remediation-scorecard.tsx          Remediation stats
  risk-comparison.tsx                Side-by-side asset comparison
  team-collaboration.tsx             Comments + @mentions
  scheduled-scans.tsx                Schedule management UI
  export-report.tsx                  PDF/JSON/TXT export
  settings-dialog.tsx                Linear + Slack API key config
  theme-toggle.tsx                   Dark/light mode switch
```

---

## Deployment

### Deploy to Vercel
```bash
vercel deploy
```

Set the environment variables above in Vercel Project Settings → Environment Variables.

The `vercel.json` includes a Cron job that fires `/api/scheduled-scans/execute` every 15 minutes to run due schedules.

### Required Vercel Integrations
- **Upstash for Redis** — for scheduled scan persistence (add via Vercel Marketplace)

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Scan not running | Check `AI_GATEWAY_API_KEY` is set in environment variables |
| Linear tickets not created | Enter your Linear API key in Settings dialog or set `LINEAR_API_KEY` env var |
| Slack alerts not posting | Enter your Slack Webhook URL in Settings dialog or set `SLACK_WEBHOOK_URL` env var |
| Threat feed shows no data | External APIs (NVD, GitHub) may be rate-limited — feed retries automatically |
| Scheduled scans not running | Verify Upstash Redis integration is connected (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) |
| Build errors | Run `pnpm build` locally to identify TypeScript errors before deploying |

---

Built with Vercel AI SDK 6, Next.js 16, Workflow Development Kit, Upstash Redis, Linear, and Slack.
