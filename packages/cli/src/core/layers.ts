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

const COMPLETE: Record<LayerName, (s: LayerMaturity) => boolean> = {
  Business: (s) => s !== 'Missing',
  Product: (s) => s !== 'Missing',
  Tech: (s) => s !== 'Missing',
  Delivery: (s) => s === 'Traceable',
}

/**
 * The current phase: the first layer (Business → Product → Tech → Delivery) that is not yet
 * complete. Returns 'Delivery' when everything earlier is complete.
 */
export function currentPhase(layers: LayerStatus[]): LayerName {
  for (const l of layers) {
    if (!COMPLETE[l.layer](l.status)) return l.layer
  }
  return 'Delivery'
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
