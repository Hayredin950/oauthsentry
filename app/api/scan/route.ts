import { z } from "zod"
import { seedFindings } from "@/lib/seed-data"
import type { RiskFinding, StackAsset } from "@/lib/types"

// Day 1: deterministic mock streamer. No AI calls, no API keys required.
// The streaming contract (NDJSON: { type: "start" | "finding" | "error" | "done" })
// is identical to what the Day 2 AI SDK 6 agent will use, so the client
// component will work unchanged when we swap in the real agent.

const RequestSchema = z.object({
  assets: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(["oauth_app", "npm_package", "saas_tool"]),
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

// Look up a seed finding for a posted asset by name OR identifier match.
// This lets the textarea behave the same whether the user keeps the seed
// data, edits it, or pastes their own.
function findSeedFinding(asset: StackAsset): RiskFinding | undefined {
  const nameKey = asset.name.toLowerCase().trim()
  const idKey = asset.identifier.toLowerCase().trim()
  return seedFindings.find(
    (f) =>
      f.asset.name.toLowerCase() === nameKey ||
      f.asset.identifier.toLowerCase() === idKey,
  )
}

function defaultCleanFinding(asset: StackAsset): RiskFinding {
  return {
    assetId: asset.id,
    asset,
    score: 8,
    level: "info",
    headline: "No known issues",
    reasoning:
      "No matching IOCs in the current threat feed. (Day 1 mock — Day 2 will run this through the AI SDK 6 tool-calling agent for real analysis.)",
    factors: [{ label: "Clean", detail: "No advisories matched" }],
    iocMatches: [],
    recommendation: "Continue monitoring.",
    ticketStatus: "none",
    alertStatus: "none",
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
      { error: "Invalid request", detail: (err as Error).message },
      { status: 400 },
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"))

      send({ type: "start", count: body.assets.length })

      for (const asset of body.assets as StackAsset[]) {
        // Simulate analysis latency so the streaming UX is visible.
        await delay(450)
        const seed = findSeedFinding(asset)
        const finding: RiskFinding = seed
          ? { ...seed, assetId: asset.id, asset, ticketStatus: "none", alertStatus: "none" }
          : defaultCleanFinding(asset)
        send({ type: "finding", finding })
      }

      send({ type: "done" })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}
