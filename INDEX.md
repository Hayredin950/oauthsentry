# OAuthSentry — Complete Project

Welcome to **OAuthSentry**, a durable AI-powered security agent that continuously scans your organization's OAuth apps, third-party AI integrations, npm dependencies, and SaaS tools against live IOC threat feeds.

**Status:** ✅ All 5 days complete (Vercel Workflow + ChatSDK + AI SDK 6)  
**Hackathon:** Zero to Agent (Apr 24 – May 4, 2026)

---

## Quick Start

### Run Locally
```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

### Deploy to Vercel
```bash
vercel deploy
```

### Test the Features
- ✅ Dashboard loads with dark theme, amber accents
- ✅ Click "Run scan" → findings stream in real-time
- ✅ Expand findings to see IOC matches, advisories, recommendations
- ✅ Click action buttons to file Linear tickets and send Slack alerts
- ✅ See live IOC threat feed in sidebar

---

## Documentation

Start here based on your role:

### For Judges 👨‍⚖️
**[JUDGES_QUICK_REFERENCE.md](JUDGES_QUICK_REFERENCE.md)** (7 min read)
- 60-second pitch
- 2-minute demo script
- Q&A for common questions
- Tech stack overview

### For Developers 👨‍💻
**[README.md](README.md)** (10 min read)
- Complete setup guide
- Tech stack details
- File structure overview
- Environment variables

### For Demo / Presentation 🎤
**[DEMO.md](DEMO.md)** (8 min read)
- Step-by-step demo script
- Deployment guide
- Troubleshooting
- Slack app manifest

### For Understanding the Build 🏗️
**[BUILD_SUMMARY.md](BUILD_SUMMARY.md)** (10 min read)
- What was built each day
- Architecture diagram
- Design decisions
- Future roadmap

### For Complete Context 📋
**[COMPLETION_REPORT.md](COMPLETION_REPORT.md)** (15 min read)
- Executive summary
- File inventory
- Testing checklist
- Submission readiness

---

## What Was Built

### Day 1: UI Scaffold ✅
React dashboard with streaming results, expandable findings, action buttons, and live IOC feed.

### Day 2: AI SDK 6 Agent ✅
Tool-calling agent that analyzes each asset, calls `matchIocs` and `lookupAdvisories` tools, returns structured findings with reasoning.

### Day 3: WDK Durable Workflow ✅
Long-running workflow that enumerates assets from 4 sources, runs scans, filters critical findings, and alerts Slack. Survives restarts.

### Day 4: ChatSDK Slack Bot ✅
Slash command `/oauthsentry scan` to trigger scans from Slack. Auto-posts critical findings to the team.

### Day 5: Linear Integration ✅
Action buttons file critical findings as Linear tickets with full context (score, reasoning, recommendation, factors).

---

## Architecture

```
Dashboard (React)
    ↓ POST /api/scan
AI Agent (AI SDK 6)
    ├─ Tool 1: matchIocs (IOC database)
    └─ Tool 2: lookupAdvisories (vendor advisories)
    ↓ Structured RiskFinding
Actions (Day 5)
    ├─ Linear: Create tickets
    ├─ Slack: Post alerts
    └─ WDK: Durable orchestration
```

---

## Key Features

- **Real-time Streaming:** Findings appear as the agent analyzes them
- **Tool-Calling Agent:** Dynamic reasoning with two tools
- **Durable Workflows:** Scans survive restarts and failures
- **Multi-Platform Bot:** Slack command, mentions, auto-alerts
- **Action Buttons:** File tickets, send alerts directly from dashboard
- **Live IOC Feed:** Real threat intelligence indicators
- **Dark Mode:** Beautiful, accessible UI (Tailwind v4)

---

## Environment Variables

```bash
# .env.local

# Linear (optional for ticket filing)
LINEAR_API_KEY=lin_pat_...
LINEAR_TEAM_ID=team-...

# Slack (optional for alerts)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

See `.env.example` for full list.

---

## File Structure

```
project/
├── app/
│   ├── api/
│   │   ├── scan/route.ts              # AI SDK 6 agent
│   │   ├── workflow/route.ts          # WDK workflow
│   │   ├── webhooks/[platform]/       # Chat SDK webhook
│   │   └── actions/
│   │       ├── file-ticket/           # Linear API
│   │       └── send-alert/            # Slack webhook
│   ├── page.tsx                       # Home page
│   ├── layout.tsx                     # Root layout
│   └── globals.css                    # Tailwind + tokens
├── components/
│   ├── risk-scanner.tsx               # Main form
│   ├── risk-results-table.tsx         # Findings table
│   ├── ioc-feed.tsx                   # Threat feed
│   ├── hero.tsx                       # Hero section
│   ├── site-header.tsx                # Navigation
│   └── risk-score-badge.tsx           # Severity badge
├── lib/
│   ├── bot.ts                         # Chat SDK Slack bot
│   ├── linear-client.ts               # Linear API wrapper
│   ├── types.ts                       # TypeScript types
│   ├── seed-data.ts                   # Example data
│   ├── risk-knowledge.ts              # IOC + advisory DB
│   ├── risk-schema.ts                 # AI output schema
│   └── parse-inventory.ts             # Parse textarea
├── README.md                          # Setup guide
├── DEMO.md                            # Demo script
├── BUILD_SUMMARY.md                   # What was built
├── JUDGES_QUICK_REFERENCE.md          # Judge reference
├── COMPLETION_REPORT.md               # Completion details
├── .env.example                       # Env template
└── package.json                       # Dependencies
```

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + Tailwind v4 + shadcn/ui |
| AI Agent | AI SDK 6 + tool-calling |
| Workflows | Vercel Workflow (WDK) |
| Chat Bot | Chat SDK + Slack adapter |
| Integrations | Linear GraphQL, Slack Webhooks |
| Hosting | Vercel Next.js |

---

## How to Deploy

### GitHub
```bash
git push origin main
# → Vercel auto-deploys on push
```

### CLI
```bash
vercel deploy
# → Add env vars in Vercel dashboard
```

### Set Up Slack
1. Create app at https://api.slack.com/apps with provided manifest
2. Copy `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` to Vercel project Settings → Vars
3. Type `/oauthsentry scan` in any Slack channel

---

## Testing

### Local
```bash
# Terminal 1: Dev server
pnpm dev

# Terminal 2: Run tests (if added)
pnpm test
```

### Production
```bash
# Run build
pnpm build

# Start server
pnpm start
```

### Validation
- ✅ Dashboard loads at http://localhost:3000
- ✅ Click "Run scan" → findings stream
- ✅ Expand findings → see details
- ✅ Click actions → pending → success states
- ✅ IOC sidebar scrolls

---

## Next Steps

1. **Read [JUDGES_QUICK_REFERENCE.md](JUDGES_QUICK_REFERENCE.md)** (5 min)
2. **Read [README.md](README.md)** for setup details (10 min)
3. **Run `pnpm dev`** and test locally (2 min)
4. **Review [DEMO.md](DEMO.md)** for presentation (5 min)
5. **Deploy to Vercel** and submit! (5 min)

---

## Support & Links

- **Vercel Workflow:** https://useworkflow.dev
- **Chat SDK:** https://chat-sdk.dev
- **AI SDK:** https://sdk.vercel.ai
- **v0:** https://v0.app

---

## Credits

Built during **Zero to Agent Hackathon** (Apr 24 – May 4, 2026) using:
- Vercel Workflow SDK (durable workflows)
- Chat SDK (multi-platform bots)
- AI SDK 6 (agent framework)
- v0 (beautiful UI scaffolding)

---

**Status:** ✅ Complete | **Ready:** ✅ Yes | **Ship:** 🚀 Go!
