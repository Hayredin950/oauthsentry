# OAuthSentry — Deploy & Demo Guide

## Quick Start (5 minutes)

### 1. Run Locally

```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

Test the dashboard:
- **UI loads** with dark theme, amber accents, "OAuthSentry" header ✓
- **Inventory textarea** has 8 pre-loaded assets (Context.ai, MeetScribe, stalebot, npm packages, Slack, Linear) ✓
- **Click "Run scan"** → findings stream in one-by-one with animated progress ✓
- **Expand Context.ai row** (score 96 CRITICAL) → see IOC match, factors, recommendation ✓
- **Click "File Linear ticket"** → button shows pending → "✓ Ticket filed" (requires LINEAR_API_KEY set) ✓
- **Click "Send Slack alert"** → button shows pending → "✓ Slack sent" (requires SLACK_WEBHOOK_URL set) ✓

### 2. Configure Environment (Optional)

To enable Linear & Slack actions, create `.env.local`:

```bash
# Linear (https://linear.app/settings/api)
LINEAR_API_KEY=lin_pat_your_key_here
LINEAR_TEAM_ID=team-ABC123  # Find in Linear URL: linear.app/team/{teamId}

# Slack (https://api.slack.com/apps → OAuth Tokens & Redirect URLs)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Restart `pnpm dev` after setting env vars.

### 3. Deploy to Vercel

```bash
# Option A: via CLI
vercel deploy

# Option B: via GitHub (recommended)
git push origin main
# → Vercel auto-deploys on push
```

After deploy, copy the production URL (e.g., `https://oauthsentry.vercel.app`).

### 4. Connect Slack (Optional)

**Only if you set up the env vars above:**

1. Go to https://api.slack.com/apps and **Create New App** from the manifest below
2. Replace `https://your-domain.com` with your Vercel production URL
3. Install the app to your workspace
4. Add the `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` from the app settings to Vercel project environment variables:
   - Settings → Vars → add `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_WEBHOOK_URL`

**Slack App Manifest:**

```yaml
display_information:
  name: OAuthSentry
  description: AI-powered OAuth & third-party risk scanning bot
features:
  bot_user:
    display_name: OAuthSentry
    always_online: true
oauth_config:
  scopes:
    bot:
      - app_mentions:read
      - channels:history
      - channels:read
      - chat:write
      - groups:history
      - groups:read
      - im:history
      - im:read
      - commands
settings:
  event_subscriptions:
    request_url: https://your-domain.com/api/webhooks/slack
    bot_events:
      - app_mention
      - message.channels
      - message.groups
      - message.im
  interactivity:
    is_enabled: true
    request_url: https://your-domain.com/api/webhooks/slack
  slash_commands:
    - command: /oauthsentry
      url: https://your-domain.com/api/webhooks/slack
      description: Start a security scan
      usage_hint: scan
```

---

## Demo Script (2 minutes)

**Audience:** Hackathon judges, security teams, DevOps leads

### Slide 1: Problem
> *"April 2026: A compromised third-party AI tool's OAuth app got access to a Vercel employee's Google Workspace and then their internal systems. How many OAuth apps in your org are silently compromised?"*

### Slide 2-3: OAuthSentry Dashboard
1. **Open http://localhost:3000**
   - Show the hero: *"Find the third-party AI tool that breaches you before it does"*
   - Highlight textarea with pre-loaded assets (8 items, including Context.ai's actual client ID)

2. **Click "Run scan"**
   - Watch findings stream in live (AI agent analyzing each asset)
   - Live progress counter: "3/8 analyzed" → "4/8 analyzed"
   - Findings appear in the table as they complete

### Slide 4: Findings Deep-Dive
1. **Expand Context.ai row** (the one that breached Vercel)
   - Score: 96 CRITICAL (bright red)
   - Headline: *"Known IOC from April 2026 Vercel incident"*
   - Factors:
     - "IOC Match" — indicator is in the threat feed
     - "Google Workspace scope" — admin access flagged
     - "Workspace admin user" — highest-risk scopes
   - Reasoning: *"This OAuth app's client ID matches the Context.ai compromise IOC published in the Vercel security bulletin. ..."*
   - Recommendation: *"Revoke immediately. File incident report with security team."*

2. **Expand another row** (e.g., "stalebot-pro" HIGH)
   - Show how the agent surfaces different risk factors (maintainer abandonment, permission escalation)
   - Scroll the IOC sidebar to show live threat feed

### Slide 5: Automation
1. **Click "File Linear ticket"** on Context.ai row
   - Button shows "Filing..." with a spinner
   - After ~1 second: "✓ Ticket filed" (green checkmark)
   - Mention: *"In production, this creates a Linear issue with full reasoning & recommendation. The team gets notified automatically."*

2. **Click "Send Slack alert"** on another CRITICAL row
   - Same flow: pending → success
   - Mention: *"If Slack is configured, the alert posts immediately to #security channel."*

### Slide 6: Durable Workflows
1. **Show the tech stack:**
   - "Day 3 built WDK durable workflows. The scan survives server restarts, infrastructure failures, and timeouts."
   - "Day 4 added ChatSDK Slack bot. Team can trigger scans from Slack (`/oauthsentry scan`) and get auto-alerts when critical findings appear."
   - "Day 5 wired Linear integration — critical findings auto-file as priority-1 issues."

2. **(Optional) Show the code** if time permits:
   - `/api/scan` — AI SDK 6 agent with tool-calling (`matchIocs`, `lookupAdvisories`)
   - `app/api/workflow/route.ts` — WDK workflow orchestrating parallel enumeration + alert
   - `lib/bot.ts` — Chat SDK Slack bot handling `/oauthsentry scan` slash command

### Slide 7: Key Wins
- **All three tracks:** WDK (durable workflows), ChatSDK (Slack bot), AI SDK 6 (tool-calling agent)
- **Production-grade:** Streaming responses, structured output, error handling, real-world inspired by April 2026 incident
- **Multi-platform:** Same bot logic works on Teams, Discord, GitHub (via Chat SDK adapters)
- **Zero-cost to test:** Day 1 runs with zero API keys, no AI calls. Day 2+ plugs in real LLM agent when desired.

---

## Troubleshooting

### "AI_GATEWAY_API_KEY not set"
The scan API will fail. For dev, you have two options:

**Option 1:** Use the mock route (Day 1 mode)
- Revert `/api/scan/route.ts` to use mock findings (comment out AI SDK calls, use seed data)
- No API key needed

**Option 2:** Set up AI Gateway
- v0 projects get free access via Vercel AI Gateway (zero-config OpenAI, Anthropic, etc.)
- No `AI_GATEWAY_API_KEY` env var needed if using the default
- If using a different provider, set the key in Vercel project Settings → Vars

### "LINEAR_API_KEY not set"
Linear ticket filing won't work (shows error in browser console). Set the env var in `.env.local` or Vercel dashboard.

### "SLACK_WEBHOOK_URL not set"
Slack alerts won't post. Set the env var to enable them.

### "Scan takes 30+ seconds"
Expected on first run. The AI agent with two tools (`matchIocs`, `lookupAdvisories`) takes time per asset. Subsequent scans may be cached depending on the backend.

### "Console shows Workflow SDK errors"
WDK requires Node.js server context. Local dev with `pnpm dev` works fine. On Vercel, ensure you've deployed at least once so the WDK backend is available.

---

## Production Checklist

Before submitting to the hackathon:

- [ ] `pnpm dev` runs locally without errors
- [ ] Dashboard loads, "Run scan" works, findings stream in
- [ ] README.md is complete (you're reading it now ✓)
- [ ] `vercel deploy` completes successfully
- [ ] Paste the production URL in the submission
- [ ] (Optional) Slack bot is configured and `/oauthsentry scan` responds
- [ ] (Optional) Linear tickets get created and appear in your Linear workspace

---

## What Judges Will Ask

**Q: "How does this work under the hood?"**
A: Day 2 uses AI SDK 6 with two agent tools. The agent analyzes each asset, calls the tools to match IOCs and look up advisories, and returns structured findings. Day 3 wraps this in a WDK durable workflow so scans survive failures. Day 4 adds ChatSDK for Slack.

**Q: "How is this different from Snyk / Crowdstrike / etc?"**
A: It's focused on third-party *AI tool risk* specifically (inspired by the April 2026 Vercel incident). It combines IOC matching, vendor advisories, and OAuth scope analysis in a durable, multi-platform agent that runs unattended or on-demand.

**Q: "Does this work for real organizations?"**
A: Yes, with real API integrations. Currently uses seed data + deterministic mock advisories for demo. Production: swap in Google Workspace Admin SDK, GitHub API, npm registry endpoints, and real IOC feeds (e.g., CISA, VirusTotal, Shodan).

**Q: "Can it handle 1000+ assets?"**
A: Yes. WDK workflows are designed for long-running jobs. Parallel enumeration + batched scanning. Current demo limits to 40 assets per scan (tunable).

---

## Post-Hackathon Next Steps

1. **Real IOC feeds:** Integrate CISA, VirusTotal, Shodan, GitHub Advisory Database
2. **Real enumeration:** Replace seed data with actual Google Workspace Admin, GitHub, npm registry APIs
3. **SBOM support:** Parse CycloneDX/SPDX files for supply-chain risk analysis
4. **ML anomaly detection:** Flag unusual OAuth API usage patterns
5. **Compliance reports:** Generate SOC 2, ISO 27001, Salesforce compliance reports
6. **1Password / Vault integration:** Enumerate secrets and check for exposure

---

## Support

- **Vercel Workflow:** https://useworkflow.dev
- **Chat SDK:** https://chat-sdk.dev
- **AI SDK 6:** https://sdk.vercel.ai
- **v0:** https://v0.app
- **Zero to Agent Hackathon:** https://vercel.com/events/zero-to-agent

**Questions?** Open an issue or ping us in the Vercel Discord.

Good luck! 🎉
