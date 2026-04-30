import { generateText, Output, stepCountIs, tool } from "ai"
import { z } from "zod"
import { findIocMatches, findVendorAdvisories } from "@/lib/risk-knowledge"
import { riskFindingSchema } from "@/lib/risk-schema"
import type { RiskFinding, StackAsset } from "@/lib/types"

// Long enough for the agent to call multiple tools per asset.
export const maxDuration = 60

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

// === Agent tools ============================================================

const matchIocs = tool({
  description:
    "Match an asset against the published Indicators of Compromise (IOC) feed. Returns any IOC entries whose indicator overlaps the asset's identifier or name. Use this for every asset.",
  inputSchema: z.object({
    name: z.string().describe("Vendor or package name, e.g. 'Context.ai' or 'clipboardz'."),
    identifier: z
      .string()
      .describe(
        "OAuth client ID, package@version, or domain. Pass exactly what was provided.",
      ),
  }),
  execute: async ({ name, identifier }) => {
    const matches = findIocMatches({ name, identifier })
    return {
      matches: matches.map((m) => ({
        id: m.id,
        title: m.title,
        severity: m.severity,
        source: m.source,
        publishedAt: m.publishedAt,
        indicator: m.indicator,
        summary: m.summary,
      })),
    }
  },
})

const lookupVendorAdvisories = tool({
  description:
    "Look up recent public advisories or breach disclosures about a vendor / package. Use this to check vendor reputation when no direct IOC match is found, or to add corroborating context.",
  inputSchema: z.object({
    vendor: z.string().describe("Vendor or package name to search for."),
  }),
  execute: async ({ vendor }) => {
    const advisories = findVendorAdvisories(vendor)
    return { advisories }
  },
})

// === System prompt ==========================================================

const SYSTEM = `You are Risk Radar, a security analyst agent that triages third-party software supply-chain risk.

For each asset you receive, you will:
1. Call \`matchIocs\` with the asset's name and identifier to check for direct Indicator of Compromise matches.
2. Call \`lookupVendorAdvisories\` with the vendor name for additional context.
3. Synthesize a structured risk finding.

Scoring rubric:
- 80-100 (critical): Direct IOC match published in the last 30 days, OR active malicious payload, OR confirmed compromise.
- 60-79 (high): Strong vendor-risk signal (abandoned, ownership change, silent scope expansion), OR exploitable CVE in production-facing code.
- 30-59 (medium): Patched CVE, scope drift without confirmed exploitation, vendor-risk concerns.
- 10-29 (low): Deprecated, minor issues, hygiene-only concerns.
- 0-9 (info): No known issues.

Always be concrete. Cite IOC IDs in \`iocMatches\` when matched. Do NOT invent IOCs that the tool did not return. The recommendation must be a concrete next step (e.g. "Revoke the OAuth grant in Workspace Admin", "Bump to evalrunner@^2.4.2"), not generic advice.`

// === Per-asset agent call ===================================================

async function analyzeAsset(asset: StackAsset): Promise<RiskFinding> {
  const userPrompt = `Analyze this asset and produce a risk finding:

kind: ${asset.kind}
name: ${asset.name}
identifier: ${asset.identifier}
${asset.scopes && asset.scopes.length ? `scopes: ${asset.scopes.join(", ")}\n` : ""}${
    asset.owner ? `owner: ${asset.owner}\n` : ""
  }${asset.installedBy ? `installedBy: ${asset.installedBy}\n` : ""}
Use both tools before producing your final answer.`

  const { output } = await generateText({
    // openai/gpt-5-mini is fast, zero-config via Vercel AI Gateway.
    // Swap to anthropic/claude-opus-4.6 for higher quality.
    model: "openai/gpt-5-mini",
    system: SYSTEM,
    prompt: userPrompt,
    tools: { matchIocs, lookupVendorAdvisories },
    stopWhen: stepCountIs(6),
    output: Output.object({ schema: riskFindingSchema }),
  })

  return {
    assetId: asset.id,
    asset,
    score: output.score,
    level: output.level,
    headline: output.headline,
    reasoning: output.reasoning,
    factors: output.factors,
    iocMatches: output.iocMatches,
    recommendation: output.recommendation,
    ticketStatus: "none",
    alertStatus: "none",
  }
}

// === Streaming NDJSON response ==============================================

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

      for (const asset of body.assets) {
        try {
          const finding = await analyzeAsset(asset as StackAsset)
          send({ type: "finding", finding })
        } catch (err) {
          console.log("[v0] scan asset failed", asset.id, (err as Error).message)
          send({
            type: "error",
            assetId: asset.id,
            asset,
            message: (err as Error).message,
          })
        }
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
