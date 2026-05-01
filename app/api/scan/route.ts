/**
 * OAuthSentry Scan API - AI-powered security risk analysis
 * Analyzes OAuth apps and dependencies against IOC feeds
 */
import { generateObject, tool } from 'ai'
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

async function analyzeAsset(asset: StackAsset): Promise<RiskFinding> {
  // Pre-fetch IOC matches and advisories to include in the prompt
  const iocResults = findIocMatches({ identifier: asset.identifier, name: asset.name })
  const advisoryResults = findVendorAdvisories(asset.name)

  const iocContext = iocResults.length > 0
    ? `\n\nIOC MATCHES FOUND (${iocResults.length}):\n` +
      iocResults.map((ioc) => `- ${ioc.title} (${ioc.severity}): ${ioc.summary}`).join('\n')
    : '\n\nNo IOC matches found.'

  const advisoryContext = advisoryResults.length > 0
    ? `\n\nSECURITY ADVISORIES (${advisoryResults.length}):\n` +
      advisoryResults.map((a) => `- ${a.vendor} (${a.date}, ${a.severity}): ${a.summary}`).join('\n')
    : '\n\nNo security advisories found.'

  const prompt = `You are a security risk analyst for an organization scanning their OAuth apps, npm dependencies, and SaaS integrations. 

Analyze the following asset for security risk:
- Kind: ${asset.kind}
- Name: ${asset.name}
- Identifier: ${asset.identifier}
${asset.owner ? `- Owner: ${asset.owner}` : ''}
${asset.installedBy ? `- Installed By: ${asset.installedBy}` : ''}
${asset.scopes?.length ? `- Scopes: ${asset.scopes.join(', ')}` : ''}
${iocContext}
${advisoryContext}

Based on the above information, produce a risk finding with:
- score (0-100): Higher = more risky
- level: critical (80-100), high (60-79), medium (40-59), low (20-39), info (0-19)
- headline: Brief summary of the risk
- reasoning: Detailed explanation
- factors: Array of { label, detail } pairs explaining risk factors
- recommendation: Actionable next steps

${asset.kind === 'oauth_app' ? 'For OAuth apps, weight heavily any IOC matches, administrative scope permissions, or recent disclosure of OAuth app compromise. Context.ai incident from April 2026 shows how a compromised OAuth app can pivot to internal systems.' : ''}
${asset.kind === 'npm_package' ? 'For npm packages, check for supply-chain attacks, maintainer abandonment, or known CVEs. Flag deprecated packages, packages with no recent updates, or those with suspicious post-install scripts.' : ''}
${asset.kind === 'saas_tool' ? 'For SaaS tools, evaluate based on vendor security posture (SOC 2, ISO 27001), any recent breaches, and scope of access (email, code, secrets, customer data).' : ''}`

  const result = await generateObject({
    model: 'openai/gpt-4o-mini',
    schema: riskFindingSchema,
    system:
      'You are a security risk analyst. Respond with structured JSON matching the requested schema. Be precise with risk scores and recommendations.',
    prompt,
  })

  // Collect IOC IDs from the pre-fetched results
  const iocMatches = iocResults.map((ioc) => ioc.id)

  return {
    assetId: asset.id,
    asset,
    score: result.object.score,
    level: result.object.level,
    headline: result.object.headline,
    reasoning: result.object.reasoning,
    factors: result.object.factors,
    iocMatches,
    recommendation: result.object.recommendation,
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
          analyzed++
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
