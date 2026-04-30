import type { AssetKind, StackAsset } from "./types"

const kindMap: Record<string, AssetKind> = {
  oauth: "oauth_app",
  npm: "npm_package",
  saas: "saas_tool",
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

/**
 * Parse the textarea inventory format:
 *   kind: name (identifier)
 *
 * Lines that don't match are skipped. Returns a deduplicated list with
 * stable IDs derived from the asset name + identifier.
 */
export function parseInventory(text: string): StackAsset[] {
  const seen = new Set<string>()
  const out: StackAsset[] = []
  const re = /^\s*(oauth|npm|saas)\s*:\s*(.+?)\s*\((.+)\)\s*$/i

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const m = line.match(re)
    if (!m) continue
    const kind = kindMap[m[1].toLowerCase()]
    const name = m[2].trim()
    const identifier = m[3].trim()
    if (!kind || !name || !identifier) continue
    const id = `asset-${slugify(name)}-${slugify(identifier).slice(0, 12)}`
    if (seen.has(id)) continue
    seen.add(id)
    out.push({ id, kind, name, identifier })
  }

  return out
}
