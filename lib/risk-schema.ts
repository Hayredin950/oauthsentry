import { z } from "zod"

// Zod schema describing the structured output the agent returns per asset.
// IMPORTANT: OpenAI strict mode (default in AI SDK 6) does NOT support
// numeric min/max, array minItems/maxItems, or `optional()` properties.
// Encode any such constraints in `describe()` instead, and use `nullable()`
// where a field may be absent.
export const riskFindingSchema = z.object({
  score: z
    .number()
    .describe(
      "Overall risk score, integer between 0 and 100 inclusive. 80+ critical, 60-79 high, 30-59 medium, 10-29 low, 0-9 info.",
    ),
  level: z
    .enum(["critical", "high", "medium", "low", "info"])
    .describe("Severity bucket derived from score."),
  headline: z.string().describe("One-line summary in plain English. Action-oriented."),
  reasoning: z
    .string()
    .describe(
      "2-4 sentences explaining the analysis. Reference any IOC matches or advisories found via tools.",
    ),
  factors: z
    .array(
      z.object({
        label: z.string().describe("Short factor name, 2-5 words."),
        detail: z.string().describe("One concrete sentence with supporting detail."),
      }),
    )
    .describe("Key risk factors that drove the score. Provide 1 to 4 entries."),
  iocMatches: z
    .array(z.string())
    .describe(
      "IDs of any matched IOCs (from the matchIocs tool, e.g. 'ioc-2026-04-19-context'). Empty array if none.",
    ),
  recommendation: z
    .string()
    .describe("Concrete next-step recommendation. 1-2 sentences, action-oriented."),
})

export type RiskFindingOutput = z.infer<typeof riskFindingSchema>
