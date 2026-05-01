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
})

export async function POST(req: Request) {
  try {
    const body = RequestSchema.parse(await req.json())
    const result = await fileTicketForFinding(body.finding as any)

    return Response.json(result)
  } catch (err) {
    return Response.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    )
  }
}
