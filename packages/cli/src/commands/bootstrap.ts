// kaddo bootstrap (VS project-knowledge-bootstrap).
//
// Turns an initialized new project into a structured knowledge base across the base
// layers: Business → Architecture → Codebase → Development. Deterministic — it writes
// knowledge artifacts from the template registry. It never calls an LLM, never generates
// source code, and never decides architecture. Existing files are never overwritten.

import { cwd, exists, join, writeFile, ensureDir } from '../utils/fs.js'
import { intro, outro, log, confirm } from '../utils/ui.js'
import { loadConfig, ConfigError } from '../core/config.js'
import { getTemplate } from '../templates/registry.js'

const CONFIG_PATH = '.kaddo/config.yml'

type LayeredTarget = { layer: BootstrapLayer; path: string; templateId: string }
type BootstrapLayer = 'Business' | 'Architecture' | 'Codebase' | 'Development'

const TARGETS: LayeredTarget[] = [
  // Business
  { layer: 'Business', path: 'architecture/business/product-brief.md', templateId: 'business-product-brief' },
  { layer: 'Business', path: 'architecture/business/problem.md', templateId: 'business-problem' },
  { layer: 'Business', path: 'architecture/business/users.md', templateId: 'business-users' },
  { layer: 'Business', path: 'architecture/business/value-proposition.md', templateId: 'business-value-proposition' },
  { layer: 'Business', path: 'architecture/business/business-rules.md', templateId: 'business-rules' },
  { layer: 'Business', path: 'architecture/business/constraints.md', templateId: 'business-constraints' },
  { layer: 'Business', path: 'architecture/business/glossary.md', templateId: 'business-glossary' },
  // Architecture
  { layer: 'Architecture', path: 'architecture/capabilities.md', templateId: 'capabilities' },
  { layer: 'Architecture', path: 'architecture/quality-attributes.md', templateId: 'quality-attributes' },
  { layer: 'Architecture', path: 'architecture/stack.md', templateId: 'stack' },
  { layer: 'Architecture', path: 'architecture/current-state.md', templateId: 'current-state' },
  { layer: 'Architecture', path: 'architecture/decision-candidates.md', templateId: 'decision-candidates' },
  { layer: 'Architecture', path: 'architecture/adrs/ADR-0001-initial-architecture.md', templateId: 'adr' },
  // Codebase
  { layer: 'Codebase', path: 'architecture/codebase-foundation.md', templateId: 'codebase-foundation' },
  { layer: 'Codebase', path: 'architecture/standards.md', templateId: 'standards' },
  { layer: 'Codebase', path: 'architecture/git-strategy.md', templateId: 'git-strategy' },
  // Development
  { layer: 'Development', path: 'architecture/roadmap.md', templateId: 'roadmap' },
  { layer: 'Development', path: 'architecture/bootstrap-summary.md', templateId: 'bootstrap-summary' },
]

export const BOOTSTRAP_LAYERS: BootstrapLayer[] = ['Business', 'Architecture', 'Codebase', 'Development']

export type BootstrapResult = {
  written: string[]
  skipped: string[]
  layers: BootstrapLayer[]
}

/**
 * Generate the initial knowledge base from the template registry. Pure and deterministic;
 * never overwrites existing files (reported as skipped). Also ensures work-items/ exists.
 */
export function bootstrap(dir: string): BootstrapResult {
  const written: string[] = []
  const skipped: string[] = []

  for (const target of TARGETS) {
    const full = join(dir, target.path)
    if (exists(full)) {
      skipped.push(target.path)
      continue
    }
    const tpl = getTemplate(target.templateId)
    const content = tpl ? tpl.content : ''
    writeFile(full, content.endsWith('\n') ? content : `${content}\n`)
    written.push(target.path)
  }

  // Development layer: ensure the work-items directory exists.
  const workItems = join(dir, 'architecture/work-items')
  if (!exists(workItems)) {
    ensureDir(workItems)
    const keep = join(workItems, '.gitkeep')
    if (!exists(keep)) {
      writeFile(keep, '')
      written.push('architecture/work-items/.gitkeep')
    }
  }

  return { written, skipped, layers: BOOTSTRAP_LAYERS }
}

export async function runBootstrap(dir: string = cwd()): Promise<void> {
  intro('kaddo bootstrap')

  if (!exists(join(dir, CONFIG_PATH))) {
    console.error('Kaddo is not initialized in this project.')
    console.error("Run `kaddo init` first.")
    process.exit(1)
  }

  let state = 'unknown'
  try {
    const config = loadConfig(dir)
    state = config?.project.state ?? 'unknown'
  } catch (err) {
    const message = err instanceof ConfigError ? err.message : String(err)
    console.error(message)
    process.exit(1)
  }

  log.info(`Project state: ${state}`)
  log.info('Base layers: Business → Architecture → Codebase → Development')

  if (state !== 'new') {
    log.warn('This project is not marked as new. Bootstrap is designed for new projects.')
    const ok = await confirm({ message: 'Continue anyway?', initialValue: false })
    if (!ok) {
      outro('Bootstrap cancelled.')
      return
    }
  }

  const result = bootstrap(dir)

  console.log('')
  console.log('Bootstrap layers:')
  for (const layer of result.layers) console.log(`  ✓ ${layer}`)
  console.log('')

  if (result.written.length > 0) {
    console.log('Created:')
    for (const p of result.written) console.log(`  - ${p}`)
  }
  if (result.skipped.length > 0) {
    console.log('')
    console.log('Kept existing (skipped):')
    for (const p of result.skipped) console.log(`  - ${p}`)
  }
  console.log('')

  outro(
    'Knowledge base ready. Run `kaddo context` and `kaddo add agents`, then refine these ' +
      'artifacts with the business-agent, bootstrap-agent and codebase-foundation-agent in your LLM.'
  )
}
