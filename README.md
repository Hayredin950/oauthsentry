<div align="center">
  <img src="public/icon.svg" alt="OAuthSentry Logo" width="120" height="120" style="border-radius: 20px;">
  <h1 align="center">OAuthSentry</h1>
  <p align="center">
    <strong>Third-Party AI & OAuth Risk Agent</strong>
    <br>
    Find the third-party AI tool that breaches you before it does
  </p>
  
  <p align="center">
    <a href="https://oauthsentry-phi.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/Live_Demo-Access_Now-brightgreen?style=for-the-badge&logo=vercel" alt="Live Demo">
    </a>
    <a href="https://github.com/Hayredin950/oauthsentry" target="_blank">
      <img src="https://img.shields.io/badge/GitHub-View_Repository-181717?style=for-the-badge&logo=github" alt="GitHub">
    </a>
    <a href="LICENSE" target="_blank">
      <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
    </a>
  </p>

  <div align="center">
    <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white" alt="Vercel">
    <img src="https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white" alt="OpenAI">
  </div>
</div>

<br>

## 📖 Table of Contents

- [About](#-about)
- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## 🎯 About

OAuthSentry is a production-ready security agent that continuously scans your organization's OAuth apps, third-party AI integrations, and npm dependencies against live IOC threat feeds. High-risk findings automatically file Linear tickets and send Slack alerts in real-time. Built for security teams protecting against supply-chain attacks and compromised AI tool integrations.

## ⚠️ Problem Statement

After the April 2026 Vercel/Context.ai incident where a compromised OAuth app pivoted into employee Google Workspace accounts, security teams need continuous monitoring of:
- OAuth apps with excessive permissions
- Third-party AI integrations with admin scopes
- Malicious npm packages (typosquats, backdoors)
- Vendor trust changes and abandoned projects

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🔍 AI-Powered Scanning** | Scan OAuth apps, npm packages, and SaaS tools using GPT-4o-mini |
| **📊 Risk Scoring** | 0–100 scoring with IOC matching and detailed reasoning |
| **🎫 Linear Integration** | Auto-file tickets for critical findings |
| **💬 Slack Alerts** | Rich Block Kit messages with actionable remediation steps |
| **⏰ Scheduled Scans** | 24/7 monitoring persisted in Upstash Redis |
| **📡 Live Threat Feed** | Real-time intel from NVD, OSV, and GitHub Security Advisories |
| **📄 PDF Export** | Comprehensive reports with executive summaries |
| **🌓 Dark/Light Mode** | Beautiful UI with theme toggle |
| **🧪 Demo Mode** | Instantly load realistic findings without API calls |
| **⚡ Real-time Streaming** | NDJSON streaming of scan results |

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Type Safety**: TypeScript

### Backend & AI
- **AI SDK**: Vercel AI SDK 6
- **Model**: OpenAI GPT-4o-mini (via AI Gateway)
- **Workflows**: Vercel Workflow Development Kit (WDK)
- **Storage**: Upstash Redis
- **APIs**: REST & GraphQL

### Integrations
- **Linear**: GraphQL API for ticket filing
- **Slack**: Incoming Webhooks for alerts
- **Threat Feeds**: NVD, OSV, GitHub Security Advisories

### Deployment
- **Hosting**: Vercel
- **Cron**: Vercel Cron Jobs

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm or npm
- Vercel account (for deployment)
- OpenAI API key (via Vercel AI Gateway)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hayredin950/oauthsentry.git
   cd oauthsentry
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file:
   ```env
   # Required — Vercel AI Gateway
   AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key

   # Optional — Linear integration
   LINEAR_API_KEY=your_linear_api_key

   # Optional — Slack integration
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

   # Required for scheduled scans — Upstash Redis
   KV_REST_API_URL=your_upstash_redis_url
   KV_REST_API_TOKEN=your_upstash_redis_token

   # Optional — App URL for links in alerts
   NEXT_PUBLIC_APP_URL=https://your-deployment.vercel.app
   ```

   > **Note**: Linear and Slack keys can also be configured at runtime through the Settings dialog — no redeployment needed!

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 API Documentation

Full API documentation available at: [https://oauthsentry-phi.vercel.app/api-docs](https://oauthsentry-phi.vercel.app/api-docs)

### Key Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/scan` | AI-powered streaming scan (NDJSON) |
| `GET` | `/api/threat-feed` | Live threat intelligence |
| `POST` | `/api/actions/file-ticket` | Create Linear issue |
| `POST` | `/api/actions/send-alert` | Send Slack alert |
| `GET/POST/PUT/DELETE` | `/api/scheduled-scans` | Manage scan schedules |

## 🏗️ Architecture

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

### Project Structure
```
oauthsentry/
├── app/
│   ├── layout.tsx               # Root layout + ThemeProvider
│   ├── page.tsx                 # Main dashboard
│   ├── globals.css              # Tailwind v4 + design tokens
│   ├── api-docs/page.tsx        # API documentation
│   └── api/
│       ├── scan/route.ts        # AI scan agent
│       ├── threat-feed/route.ts # Threat intel feed
│       ├── actions/
│       │   ├── file-ticket/
│       │   └── send-alert/
│       ├── scheduled-scans/
│       └── workflow/
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── hero.tsx
│   ├── risk-scanner.tsx
│   ├── risk-results-table.tsx
│   └── ...
├── lib/
│   ├── types.ts
│   ├── linear-client.ts
│   ├── risk-knowledge.ts
│   └── ...
├── public/
├── package.json
├── tsconfig.json
└── vercel.json
```

## 🚀 Deployment

### Deploy to Vercel

1. **Deploy via Vercel CLI**
   ```bash
   vercel
   ```

2. **Set environment variables** in Vercel Project Settings → Environment Variables.

3. **Required Integration**: Add **Upstash for Redis** via Vercel Marketplace for scheduled scans.

The `vercel.json` includes a Cron job that fires `/api/scheduled-scans/execute` every 15 minutes to run due schedules.

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Scan not running | Verify `AI_GATEWAY_API_KEY` is set |
| Linear tickets not created | Check Linear API key in Settings or env var |
| Slack alerts not posting | Ensure Slack Webhook URL is configured |
| Threat feed empty | External APIs may be rate-limited — auto-retry enabled |
| Scheduled scans failing | Confirm Upstash Redis integration is active |
| Build errors | Run `pnpm build` locally to debug TypeScript issues |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📬 Contact

**Hayredin** - [hayredin.950@gmail.com](mailto:hayredin.950@gmail.com)

Project Link: [https://github.com/Hayredin950/oauthsentry](https://github.com/Hayredin950/oauthsentry)

Live Demo: [https://oauthsentry-phi.vercel.app](https://oauthsentry-phi.vercel.app)

---

<div align="center">
  <p>
    Built with ❤️ by <a href="https://github.com/Hayredin950">Hayredin</a>
  </p>
  <p>
    © 2026 OAuthSentry. All rights reserved.
  </p>
</div>
