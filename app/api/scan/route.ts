import { generateText, tool, Output } from 'ai'
import { z } from 'zod'
import { findIocMatches, findVendorAdvisories } from '@/lib/risk-knowledge'
import { riskFindingSchema } from '@/lib/risk-schema'
import type { StackAsset, RiskFinding } from '@/lib/types'

const RequestSchema = z.object({
  assets: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(['oauth_app', 'npm_package', 'saas_tool']),
        name: z.string(),
        identifier: z.string(),
        owner: z.string().nullable().optional(),
        installedBy: z.string().nullable().optional(),
        scopes: z.array(z.string()).nullable().optional(),
      }),
    )
    .min(1)
    .max(40),
})

// Tool 1: Match against IOC database
const matchIocsT = tool({
  description:
    'Search the IOC threat feed for indicators matching an asset name or identifier. Returns matched IOC entries with severity, source, and summary.',
  inputSchema: z.object({
    name: z.string().describe('Asset name (e.g., "Context.ai", "stalebot-pro")'),
    identifier: z.string().describe('OAuth client ID, npm package name, or domain (e.g., "110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com")'),
  }),
  execute: async ({ name, identifier }) => {
    const matches = findIocMatches({ identifier, name })
    return {
      count: matches.length,
      matches: matches.map((ioc) => ({
        id: ioc.id,
        indicator: ioc.indicator,
        title: ioc.title,
        severity: ioc.severity,
        source: ioc.source,
        summary: ioc.summary,
      })),
    }
  },
})

// Tool 2: Lookup vendor advisories
const lookupAdvisoriesT = tool({
  description:
    'Search published security advisories and disclosures for a vendor. Returns recent CVEs, breaches, and risk announcements.',
  inputSchema: z.object({
    vendor: z
      .string()
      .describe('Vendor name (e.g., "Context.ai", "Linear", "Slack", "stalebot-pro", "evalrunner")'),
  }),
  execute: async ({ vendor }) => {
    const advisories = findVendorAdvisories(vendor)
    return {
      count: advisories.length,
      advisories: advisories.map((a) => ({
        vendor: a.vendor,
        date: a.date,
        source: a.source,
        severity: a.severity,
        summary: a.summary,
      })),
    }
  },
})

async function analyzeAsset(asset: StackAsset): Promise<RiskFinding> {
  const prompt = `You are a security risk analyst for an organization scanning their OAuth apps, npm dependencies, and SaaS integrations. 

Analyze the following asset for security risk:
- Kind: ${asset.kind}
- Name: ${asset.name}
- Identifier: ${asset.identifier}
${asset.owner ? `- Owner: ${asset.owner}` : ''}
${asset.installedBy ? `- Installed By: ${asset.installedBy}` : ''}
${asset.scopes?.length ? `- Scopes: ${asset.scopes.join(', ')}` : ''}

Use the available tools to:
1. Check if this asset appears in any known IOCs (using matchIocs)
2. Look up any published advisories or security disclosures (using lookupAdvisories)

Based on tool results and your analysis, produce a risk finding with a score (0-100), level (critical/high/medium/low/info), and actionable recommendation.

${asset.kind === 'oauth_app' ? 'For OAuth apps, weight heavily any IOC matches, administrative scope permissions, or recent disclosure of OAuth app compromise. Context.ai incident from April 2026 shows how a compromised OAuth app can pivot to internal systems.' : ''}
${asset.kind === 'npm_package' ? 'For npm packages, check for supply-chain attacks, maintainer abandonment, or known CVEs. Flag deprecated packages, packages with no recent updates, or those with suspicious post-install scripts.' : ''}
${asset.kind === 'saas_tool' ? 'For SaaS tools, evaluate based on vendor security posture (SOC 2, ISO 27001), any recent breaches, and scope of access (email, code, secrets, customer data).' : ''}

Return your structured finding now.`

  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    tools: {
      matchIocs: matchIocsT,
      lookupAdvisories: lookupAdvisoriesT,
    },
    system:
      'You are a security risk analyst. Respond with structured JSON matching the requested schema. Be precise with risk scores and recommendations.',
    prompt,
    output: Output.object({ schema: riskFindingSchema }),
  })

  // Extract the parsed object from the result
  const parsed = result.object as z.infer<typeof riskFindingSchema>

  // Collect IOC IDs from tool calls (if available)
  const iocMatches =
    result.toolResults
      ?.filter((tr) => tr.toolName === 'matchIocs')
      .flatMap((tr) => (tr.result as { matches: { id: string }[] }).matches.map((m) => m.id)) || []

  return {
    assetId: asset.id,
    asset,
    score: parsed.score,
    level: parsed.level,
    headline: parsed.headline,
    reasoning: parsed.reasoning,
    factors: parsed.factors,
    iocMatches,
    recommendation: parsed.recommendation,
    ticketStatus: 'none',
    alertStatus: 'none',
  }
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

export async function POST(req: Request) {
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (err) {
    return Response.json(
      { error: 'Invalid request', detail: (err as Error).message },
      { status: 400 },
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))

      send({ type: 'start', count: body.assets.length })

      let analyzed = 0
      for (const asset of body.assets as StackAsset[]) {
        try {
          // Analyze using the AI agent
          const finding = await analyzeAsset(asset)
          analyzed++
          send({ type: 'finding', finding, analyzed, total: body.assets.length })

          // Small delay to avoid rate limiting
          await delay(100)
        } catch (err) {
          console.error(`[v0] Error analyzing ${asset.name}:`, err)
          send({
            type: 'error',
            assetId: asset.id,
            assetName: asset.name,
            error: (err as Error).message,
          })
        }
      }

      send({ type: 'done', analyzed })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
