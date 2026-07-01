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
import { analyzeKnowledgeArtifact, type ArtifactQuality } from './artifact-quality.js'

export type { LayerName, LayerMaturity, LayerStatus }

// The baseline files that back each layer's maturity. If these are still bootstrap placeholders (or
// weak), the layer must not be reported as Consolidated/Structured (VS-073.1).
const LAYER_BASELINE: Record<LayerName, string[]> = {
  Business: ['knowledge/business/business.md'],
  Product: ['knowledge/product/product.md', 'knowledge/product/capabilities.md'],
  Tech: ['knowledge/tech/codebase.md', 'knowledge/tech/current-state.md'],
  Delivery: ['knowledge/delivery/roadmap.md'],
}

/** Worst (lowest) quality across a layer's baseline files that actually exist. */
function layerQuality(dir: string, layer: LayerName): ArtifactQuality | null {
  const order: ArtifactQuality[] = ['missing', 'placeholder', 'weak', 'useful']
  let worst: ArtifactQuality | null = null
  for (const rel of LAYER_BASELINE[layer]) {
    const q = analyzeKnowledgeArtifact(dir, rel)
    if (q === 'missing') continue // a missing baseline file doesn't downgrade a layer proven by others
    if (worst === null || order.indexOf(q) < order.indexOf(worst)) worst = q
  }
  return worst
}

/**
 * Per-layer maturity, discovered by front-matter type, then downgraded when the layer's baseline
 * files are still bootstrap placeholders or too thin (VS-073.1). A file existing ≠ knowledge ready.
 */
export function knowledgeLayers(dir: string): LayerStatus[] {
  return discoverLayers(dir).map((l) => {
    // Only downgrade "positive" maturities; never touch Missing/Partial/Traceable/Placeholder/Weak.
    if (l.status !== 'Consolidated' && l.status !== 'Structured') return l
    const q = layerQuality(dir, l.layer)
    if (q === 'placeholder') return { ...l, status: 'Placeholder' as LayerMaturity }
    if (q === 'weak') return { ...l, status: 'Weak' as LayerMaturity }
    return l
  })
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
