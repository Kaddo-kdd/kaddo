// kaddo bootstrap (VS project-knowledge-bootstrap; realigned in knowledge-repository-realignment).
//
// Turns an initialized new project into the minimal knowledge base across the project's
// macro layers: Business → Product → Tech → Delivery. Deterministic — it writes knowledge
// artifacts from the template registry. It never calls an LLM, never generates source code,
// and never decides architecture. Existing files are never overwritten.
//
// Bootstrap generates only the minimal base (Business + Product + tech/codebase.md).
// Roadmap, work items and decisions emerge later through agents and project evolution.

import { cwd, exists, join, writeFile } from '../utils/fs.js'
import { intro, outro, log, confirm } from '../utils/ui.js'
import { loadConfig, projectLanguage, ConfigError, type ProjectLanguage } from '../core/config.js'
import { getTemplate } from '../templates/registry.js'

const CONFIG_PATH = '.kaddo/config.yml'

type BootstrapLayer = 'Business' | 'Product' | 'Tech'
type LayeredTarget = { layer: BootstrapLayer; path: string; templateId: string }

const TARGETS: LayeredTarget[] = [
  // Minimum sufficient knowledge: one consolidated file per layer. Specialized
  // artifacts (problem.md, users.md, capabilities.md, …) appear later, as the project
  // matures, via agents and refinement — not at bootstrap.
  { layer: 'Business', path: 'knowledge/business/business.md', templateId: 'business' },
  { layer: 'Product', path: 'knowledge/product/product.md', templateId: 'product' },
  { layer: 'Tech', path: 'knowledge/tech/codebase.md', templateId: 'codebase' },
]

export const BOOTSTRAP_LAYERS: BootstrapLayer[] = ['Business', 'Product', 'Tech']

export type BootstrapResult = {
  written: string[]
  skipped: string[]
  layers: BootstrapLayer[]
}

/**
 * Generate the minimal initial knowledge base from the template registry. Pure and
 * deterministic; never overwrites existing files (reported as skipped). It does not
 * generate roadmap, work items or decisions — those emerge later through agents.
 */
export function bootstrap(dir: string): BootstrapResult {
  const written: string[] = []
  const skipped: string[] = []

  // Knowledge language (VS-051). The CLI does not translate template prose — it records the
  // language directive so the bootstrap-agent fills the body in the configured language.
  let language: ProjectLanguage = 'en'
  try {
    const config = loadConfig(dir)
    if (config) language = projectLanguage(config)
  } catch {
    // fall back to English on unreadable config
  }

  for (const target of TARGETS) {
    const full = join(dir, target.path)
    if (exists(full)) {
      skipped.push(target.path)
      continue
    }
    const tpl = getTemplate(target.templateId)
    const base = tpl ? tpl.content : ''
    const content = withLanguageDirective(base, language)
    writeFile(full, content.endsWith('\n') ? content : `${content}\n`)
    written.push(target.path)
  }

  return { written, skipped, layers: BOOTSTRAP_LAYERS }
}

/** Insert a project-language directive after the front matter (no-op for English). */
function withLanguageDirective(content: string, language: ProjectLanguage): string {
  if (language !== 'es') return content
  const note =
    '> Idioma del proyecto: **español**. Escribe este conocimiento en español. ' +
    'Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.\n'
  const fm = content.match(/^---\n[\s\S]*?\n---\n/)
  if (fm) return content.slice(0, fm[0].length) + '\n' + note + content.slice(fm[0].length)
  return `${note}\n${content}`
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
  log.info('Base layers: Business → Product → Tech → Delivery')

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

  console.log('')
  log.info(
    'When you pass the context pack to your LLM/coding agent, it must never commit, push or ' +
      'merge without your confirmation — and create a branch before implementing.'
  )
  outro(
    'Minimal knowledge base ready (Business → Product → Tech). Run `kaddo context` and ' +
      '`kaddo add agents`, then refine with the business-agent, bootstrap-agent and ' +
      'codebase-agent. Roadmap and work items come next under knowledge/delivery/.'
  )
}
