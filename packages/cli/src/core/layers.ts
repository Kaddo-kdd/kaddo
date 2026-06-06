// Knowledge layers — frontmatter-driven (VS knowledge-discovery-semantic-recognition).
//
// Kaddo frames the project as four macro layers: Business → Product → Tech → Delivery.
// Layer presence and maturity are discovered by meaning (front-matter type) via the
// Knowledge Discovery Engine — not by exact file names. Used by `kaddo context`,
// `kaddo explain` and `kaddo understand`.

import {
  discoverLayers,
  type LayerName,
  type LayerMaturity,
  type LayerStatus,
} from './knowledge-discovery.js'

export type { LayerName, LayerMaturity, LayerStatus }

/** Per-layer maturity status, discovered from front-matter type (path as fallback). */
export function knowledgeLayers(dir: string): LayerStatus[] {
  return discoverLayers(dir)
}

/** Render the per-layer maturity + detected artifacts as markdown. */
export function renderLayersMarkdown(layers: LayerStatus[]): string {
  const lines: string[] = []
  for (const { layer, status, detected } of layers) {
    lines.push(`### ${layer} — ${status}`)
    if (detected.length > 0) for (const d of detected) lines.push(`- ✓ ${d}`)
    else lines.push('- ✗ none')
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}
