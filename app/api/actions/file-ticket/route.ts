import { z } from 'zod'
import { fileTicketForFinding } from '@/lib/linear-client'
import type { RiskFinding } from '@/lib/types'

const RequestSchema = z.object({
  finding: z.object({
    assetId: z.string(),
    asset: z.object({
      id: z.string(),
      kind: z.enum(['oauth_app', 'npm_package', 'saas_tool']),
      name: z.string(),
      identifier: z.string(),
    }),
    score: z.number(),
    level: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    headline: z.string(),
    reasoning: z.string(),
    recommendation: z.string(),
    factors: z.array(z.object({ label: z.string(), detail: z.string() })),
  }),
  linearApiKey: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = RequestSchema.parse(await req.json())
    
    // Use API key from request body (localStorage) or fall back to env var
    const apiKey = body.linearApiKey || process.env.LINEAR_API_KEY
    if (!apiKey) {
      return Response.json(
        { success: false, error: 'Linear API Key not configured. Please add it in Settings.' },
        { status: 400 },
      )
    }
    
    const result = await fileTicketForFinding(body.finding as any, apiKey)

    return Response.json(result)
  } catch (err) {
    return Response.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    )
  }
}
