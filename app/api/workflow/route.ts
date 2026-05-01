import { sleep, FatalError } from 'workflow'
import { start } from 'workflow/api'
import type { StackAsset } from '@/lib/types'

/**
 * Step 1: Fetch or enumerate OAuth apps from Google Workspace Admin API.
 * In production, call admin.googleapis.com; for demo, return seed data.
 */
async function enumerateGoogleWorkspaceOAuthApps() {
  'use step'
  // In production: use Google Admin API with service account
  // For this demo, return seed data or throw FatalError if no credentials
  return [
    {
      id: 'oauth-context-ai',
      kind: 'oauth_app' as const,
      name: 'context.ai',
      identifier: '110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com',
      owner: 'workspace-admin@example.com',
      scopes: ['gmail.readonly', 'calendar.modify', 'contacts.readonly'],
    },
    {
      id: 'oauth-meetscribe',
      kind: 'oauth_app' as const,
      name: 'MeetScribe AI',
      identifier: 'meetscribe-oauth-2026-03',
      owner: 'workspace-admin@example.com',
      scopes: ['calendar.modify', 'gmail.modify'],
    },
  ]
}

/**
 * Step 2: Fetch or enumerate GitHub Apps from a GitHub org.
 * In production: call api.github.com/orgs/{org}/installations; for demo, return seed.
 */
async function enumerateGitHubApps() {
  'use step'
  // In production: use GitHub REST API with org token
  return [
    {
      id: 'gh-stalebot',
      kind: 'oauth_app' as const,
      name: 'stalebot-pro',
      identifier: 'stalebot-pro-v3.2.0',
      owner: 'github-org-admin',
      scopes: ['admin:org', 'repo:read', 'issues:write'],
    },
  ]
}

/**
 * Step 3: Enumerate npm dependencies from a package.json registry or lockfile.
 * In production: call registry.npmjs.org or use a supply-chain scanner; for demo, return seed.
 */
async function enumerateNpmDependencies() {
  'use step'
  return [
    {
      id: 'npm-evalrunner',
      kind: 'npm_package' as const,
      name: 'evalrunner',
      identifier: 'evalrunner@2.4.1',
      owner: 'package-registry',
      scopes: [],
    },
    {
      id: 'npm-clipboardz',
      kind: 'npm_package' as const,
      name: 'clipboardz',
      identifier: 'clipboardz@1.0.5',
      owner: 'package-registry',
      scopes: [],
    },
    {
      id: 'npm-loomy-cli',
      kind: 'npm_package' as const,
      name: 'loomy-cli',
      identifier: 'loomy-cli@0.8.3',
      owner: 'package-registry',
      scopes: [],
    },
  ]
}

/**
 * Step 4: Enumerate SaaS tools (Linear, Slack, etc.) from workspace integrations or config.
 */
async function enumerateSaaSTools() {
  'use step'
  return [
    {
      id: 'saas-linear',
      kind: 'saas_tool' as const,
      name: 'Linear',
      identifier: 'linear.app',
      owner: 'workspace-admin',
      scopes: ['admin', 'issues:read', 'issues:write'],
    },
    {
      id: 'saas-slack',
      kind: 'saas_tool' as const,
      name: 'Slack',
      identifier: 'slack.com',
      owner: 'workspace-owner',
      scopes: ['admin', 'workspace:manage'],
    },
  ]
}

/**
 * Step 5: Call the scan API with all enumerated assets.
 */
async function runScanViaApi(assets: StackAsset[]) {
  'use step'
  // POST to /api/scan with the asset list
  // In production, handle streaming NDJSON response
  const res = await fetch(`${process.env.SCAN_API_URL || 'http://localhost:3000'}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assets }),
  })

  if (!res.ok) {
    throw new Error(`Scan API failed: ${res.status} ${res.statusText}`)
  }

  // Consume NDJSON stream
  const findings = []
  if (res.body) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: false })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          try {
            const msg = JSON.parse(line)
            if (msg.type === 'finding') findings.push(msg.finding)
          } catch {
            // Skip malformed lines
          }
        }
      }
    }
  }

  return findings
}

/**
 * Step 6: Filter critical findings and post alerts to Slack or file Linear tickets.
 */
async function alertOnCriticalFindings(findings: any[]) {
  'use step'
  const critical = findings.filter((f) => f.level === 'critical' || f.score >= 80)

  if (critical.length > 0 && process.env.SLACK_WEBHOOK_URL) {
    const text =
      `OAuthSentry: ${critical.length} critical risk finding(s) detected.\n` +
      critical.map((f) => `• ${f.asset.name} (${f.level}): ${f.headline}`).join('\n')

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  }

  return critical
}

/**
 * Main durable workflow: orchestrate the full scan lifecycle.
 * Runs on a cron-like schedule (Day 4 integrates ChatSDK for `/oauthsentry scan` trigger).
 */
export async function oauthSentryWorkflow(scheduleInterval?: string) {
  'use workflow'

  const interval = scheduleInterval || '1h'
  let iterationCount = 0

  // Infinite loop: scan → sleep → repeat
  // In production, this runs in the background and can survive interruptions.
  while (true) {
    iterationCount++

    try {
      console.log(`[OAuthSentry] Iteration ${iterationCount}: starting full enumeration & scan`)

      // Enumerate from all sources in parallel
      const [googleApps, githubApps, npmDeps, saasTools] = await Promise.all([
        enumerateGoogleWorkspaceOAuthApps(),
        enumerateGitHubApps(),
        enumerateNpmDependencies(),
        enumerateSaaSTools(),
      ])

      const allAssets = [...googleApps, ...githubApps, ...npmDeps, ...saasTools]
      console.log(`[OAuthSentry] Enumerated ${allAssets.length} total assets`)

      // Run the AI agent-based scan
      const findings = await runScanViaApi(allAssets)
      console.log(`[OAuthSentry] Scan complete: ${findings.length} findings`)

      // Alert on critical findings
      const critical = await alertOnCriticalFindings(findings)
      if (critical.length > 0) {
        console.log(`[OAuthSentry] Alert: ${critical.length} critical findings`)
      }

      // Sleep before next iteration
      console.log(`[OAuthSentry] Sleeping for ${interval} before next scan`)
      await sleep(interval)
    } catch (err) {
      console.error(`[OAuthSentry] Error in iteration ${iterationCount}:`, err)
      // Retry after a shorter sleep on error (backoff pattern)
      await sleep('5m')
    }
  }
}

/**
 * API endpoint to manually trigger a scan (used by ChatSDK Slack bot).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const trigger = (body as { trigger?: string }).trigger

    if (trigger === 'manual-scan') {
      // Start a one-off workflow run
      const run = await start(oauthSentryWorkflow, [])
      const runId = typeof run === 'object' && run !== null && 'runId' in run 
        ? (run as { runId: string }).runId 
        : String(run)
      return Response.json({ runId, status: 'started' })
    }

    return Response.json({ error: 'Unknown trigger' }, { status: 400 })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
