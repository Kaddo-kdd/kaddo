import { cwd, writeFile, join, ensureDir } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import {
  buildConsolidationPlan,
  renderConsolidationMarkdown,
  serializeConsolidationJson,
  CONSOLIDATION_CATEGORIES,
  type ConsolidationScope,
} from '../core/knowledge-consolidation.js'
import type { LayerName } from '../core/knowledge-discovery.js'

type ConsolidateOpts = { layer?: string; module?: string; scope?: string }

const LAYER_BY_FLAG: Record<string, LayerName> = {
  business: 'Business',
  product: 'Product',
  tech: 'Tech',
  delivery: 'Delivery',
}

function resolveScope(opts: ConsolidateOpts): ConsolidationScope {
  if (opts.module) return { kind: 'module', module: opts.module }
  if (opts.layer) {
    const layer = LAYER_BY_FLAG[opts.layer.toLowerCase()]
    if (!layer) {
      throw new Error(`Unknown --layer "${opts.layer}". Use one of: business, product, tech, delivery.`)
    }
    return { kind: 'layer', layer }
  }
  // --scope all (default). Any other value falls back to all with a note.
  return { kind: 'all' }
}

/**
 * `kaddo knowledge consolidate` — analyze the canonical knowledge and write a reviewable
 * Consolidation Plan under `.kaddo/`. Read-only with respect to `knowledge/`: it never modifies
 * canonical artifacts and never calls an LLM (semantic review is an agent/skill step).
 */
export function runKnowledgeConsolidate(opts: ConsolidateOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)
  intro('kaddo knowledge consolidate')

  if (opts.scope && opts.scope !== 'all' && !opts.layer && !opts.module) {
    log.warn(`Unrecognized --scope "${opts.scope}"; analyzing the whole project. Use --layer or --module for a narrower scope.`)
  }

  const scope = resolveScope(opts)
  const plan = buildConsolidationPlan(dir, { scope })

  ensureDir(join(dir, '.kaddo'))
  const mdRel = join('.kaddo', 'consolidation-plan.md')
  const jsonRel = join('.kaddo', 'consolidation-plan.json')
  writeFile(join(dir, mdRel), renderConsolidationMarkdown(plan))
  writeFile(join(dir, jsonRel), serializeConsolidationJson(plan))

  log.success(`Consolidation analysis complete (scope: ${plan.scope}).`)
  log.info(
    `Artifacts evaluated: ${plan.coverage.artifacts_evaluated} · Work Items: ${plan.coverage.work_items_evaluated} · Opportunities: ${plan.summary.total}`
  )

  if (plan.summary.total === 0) {
    log.info('No consolidation opportunities detected within this scope by the available analyses.')
    log.info('This is not a claim of perfection — only that no opportunity surfaced with the current signals.')
  } else {
    for (const cat of CONSOLIDATION_CATEGORIES) {
      const n = plan.summary.by_category[cat]
      if (n > 0) log.info(`- ${n} × ${cat}`)
    }
    log.warn(
      `${plan.summary.requires_semantic_review} finding(s) require semantic review (agent/human) before acting — nothing was changed automatically.`
    )
  }

  log.info(`- ${mdRel.replace(/\\/g, '/')}`)
  log.info(`- ${jsonRel.replace(/\\/g, '/')}`)

  printCommandFooter('knowledge consolidate')
  outro('Consolidation Plan ready for review.')
}
