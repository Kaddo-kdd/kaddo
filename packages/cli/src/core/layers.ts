// Knowledge layers (VS knowledge-repository-realignment, phase 3).
//
// Kaddo frames the project as four macro layers: Business → Product → Tech → Delivery.
// This module reports, deterministically, which key artifact of each layer is present
// under knowledge/. Used by `kaddo context` and `kaddo explain` to group knowledge by
// layer. No interpretation — pure file existence checks.

import { exists, join } from '../utils/fs.js'

export type LayerName = 'Business' | 'Product' | 'Tech' | 'Delivery'

export type LayerItem = { name: string; present: boolean }
export type LayerStatus = { layer: LayerName; items: LayerItem[] }

const KNOWLEDGE = 'knowledge'

/** Per-layer key artifacts, by path relative to the project root. */
const LAYER_SPEC: { layer: LayerName; items: { name: string; path: string }[] }[] = [
  {
    layer: 'Business',
    items: [
      { name: 'problem', path: `${KNOWLEDGE}/business/problem.md` },
      { name: 'users', path: `${KNOWLEDGE}/business/users.md` },
      { name: 'value-proposition', path: `${KNOWLEDGE}/business/value-proposition.md` },
      { name: 'constraints', path: `${KNOWLEDGE}/business/constraints.md` },
      { name: 'business-rules', path: `${KNOWLEDGE}/business/business-rules.md` },
    ],
  },
  {
    layer: 'Product',
    items: [
      { name: 'product brief', path: `${KNOWLEDGE}/product/product-brief.md` },
      { name: 'capabilities', path: `${KNOWLEDGE}/product/capabilities.md` },
    ],
  },
  {
    layer: 'Tech',
    items: [
      { name: 'codebase', path: `${KNOWLEDGE}/tech/codebase.md` },
      { name: 'current-state', path: `${KNOWLEDGE}/tech/current-state.md` },
      { name: 'decisions', path: `${KNOWLEDGE}/tech/decisions` },
    ],
  },
  {
    layer: 'Delivery',
    items: [
      { name: 'roadmap', path: `${KNOWLEDGE}/delivery/roadmap.md` },
      { name: 'work items', path: `${KNOWLEDGE}/delivery/work-items` },
    ],
  },
]

/** Deterministic presence of each layer's key artifacts under knowledge/. */
export function knowledgeLayers(dir: string): LayerStatus[] {
  return LAYER_SPEC.map(({ layer, items }) => ({
    layer,
    items: items.map((it) => ({ name: it.name, present: exists(join(dir, it.path)) })),
  }))
}

/**
 * The current phase: the first layer (Business → Product → Tech → Delivery) that still has
 * a missing key artifact. Used to recommend contextual agents. Returns 'Delivery' when all
 * earlier layers are complete.
 */
export function currentPhase(layers: LayerStatus[]): LayerName {
  for (const { layer, items } of layers) {
    if (items.some((i) => !i.present)) return layer
  }
  return 'Delivery'
}

/** Render the per-layer status as markdown (Business → Product → Tech → Delivery). */
export function renderLayersMarkdown(layers: LayerStatus[]): string {
  const lines: string[] = []
  for (const { layer, items } of layers) {
    lines.push(`### ${layer}`)
    for (const it of items) lines.push(`- ${it.present ? '✓' : '✗'} ${it.name}`)
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}
