// Server-only knowledge base queried by the AI agent's tools.
// Kept separate from `seed-data.ts` (which drives client UI defaults) so
// the agent has a clear, auditable source of truth.

import { seedIOCs } from "./seed-data"
import type { IOC } from "./types"

export const knowledgeIOCs: IOC[] = seedIOCs

/**
 * Lightweight, deterministic IOC matcher. Returns IOC entries whose
 * indicator overlaps the asset identifier or name. Substring matches in
 * either direction so partial OAuth client IDs and package names work.
 */
export function findIocMatches(input: { identifier: string; name: string }) {
  const ident = input.identifier.toLowerCase().trim()
  const name = input.name.toLowerCase().trim()
  return knowledgeIOCs.filter((ioc) => {
    const ind = ioc.indicator.toLowerCase()
    if (!ident && !name) return false
    if (ident && (ind.includes(ident) || ident.includes(ind))) return true
    if (name && ioc.title.toLowerCase().includes(name)) return true
    if (name && ind.includes(name)) return true
    return false
  })
}

/**
 * Static vendor advisory knowledge base. Models a "search the public web
 * for recent advisories about vendor X" tool with deterministic results
 * suitable for a hackathon demo. Easy to swap later with a real web-search
 * tool (Tavily, Exa, Vercel AI Gateway grounding, etc.).
 */
type Advisory = {
  vendor: string
  date: string
  source: string
  severity: "critical" | "high" | "medium" | "low" | "info"
  summary: string
}

const advisories: Advisory[] = [
  {
    vendor: "context.ai",
    date: "2026-04-19",
    source: "Vercel Security Bulletin",
    severity: "critical",
    summary:
      "Context.ai's Google Workspace OAuth app was the subject of a broader compromise. Used as the initial access vector to take over a Vercel employee's Google Workspace account, leading to enumeration of Vercel environment variables. Recommendation: immediately revoke any Context.ai OAuth grants in Workspace and rotate any credentials accessible to affected users.",
  },
  {
    vendor: "meetscribe",
    date: "2026-04-20",
    source: "Mandiant",
    severity: "medium",
    summary:
      "MeetScribe AI silently expanded OAuth scopes from calendar.readonly to gmail.modify in their March 2026 release with no customer notification. Vendor-risk concerns; consider downgrading or revoking.",
  },
  {
    vendor: "stalebot-pro",
    date: "2026-04-21",
    source: "GitHub Security Advisory",
    severity: "high",
    summary:
      "stalebot-pro was sunset by its original maintainer 11 months ago. The underlying GitHub App repository was transferred to a new owner in March 2026 and a permission escalation (admin:org) shipped in v3.2.0 without changelog disclosure.",
  },
  {
    vendor: "clipboardz",
    date: "2026-04-22",
    source: "Socket Threat Intel",
    severity: "high",
    summary:
      "Malicious npm package mimicking 'clipboardy'. Exfiltrates process.env on postinstall to dns-cache.io. 14 known downstream consumers.",
  },
  {
    vendor: "evalrunner",
    date: "2026-04-18",
    source: "Snyk",
    severity: "medium",
    summary:
      "evalrunner@2.4.1 contains CVE-2026-3318 (prototype pollution via crafted JSON input). Patched in 2.4.2.",
  },
  {
    vendor: "loomy-cli",
    date: "2026-04-17",
    source: "OSV",
    severity: "low",
    summary: "Maintainer marked package deprecated; recommends migration to upstream 'looma'.",
  },
  {
    vendor: "linear",
    date: "2025-11-02",
    source: "Linear Trust Center",
    severity: "info",
    summary: "No active advisories. SOC 2 Type II, ISO 27001 certified. Clean record over the last 90 days.",
  },
  {
    vendor: "slack",
    date: "2025-12-01",
    source: "Slack Trust",
    severity: "info",
    summary: "No active advisories. Maintains SOC 2 Type II. Clean record over the last 90 days.",
  },
]

export function findVendorAdvisories(vendor: string) {
  const v = vendor.toLowerCase().trim()
  return advisories.filter(
    (a) => a.vendor.toLowerCase().includes(v) || v.includes(a.vendor.toLowerCase()),
  )
}
