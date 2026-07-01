// kaddo bootstrap — state-aware knowledge baseline (VS-073).
//
// Creates the structural knowledge baseline Kaddo expects, tailored to the project's `project.state`
// (new / pre-ai / legacy). Bootstrap is NOT "new-project bootstrap" — it is "knowledge baseline
// bootstrap" and applies to every project type; only the template content differs by state.
//
// Deterministic: writes template files + ensures directories from the template set. Never overwrites
// existing files (reported as skipped), never installs agents/skills, never runs scan/context/git,
// never calls an LLM, never generates source code or decides architecture.

import { cwd, exists, join, writeFile, ensureDir } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { loadConfig, projectLanguage, ConfigError, type ProjectLanguage, type ProjectState } from '../core/config.js'
import { baselineTemplate, type BaselineKind } from '../core/bootstrap-templates.js'
import { printCommandFooter } from '../core/command-help.js'

const CONFIG_PATH = '.kaddo/config.yml'

type FileTarget = { path: string; kind: BaselineKind }
const FILE_TARGETS: FileTarget[] = [
  { path: 'knowledge/business/business.md', kind: 'business' },
  { path: 'knowledge/product/product.md', kind: 'product' },
  { path: 'knowledge/product/capabilities.md', kind: 'capabilities' },
  { path: 'knowledge/tech/codebase.md', kind: 'codebase' },
  { path: 'knowledge/tech/current-state.md', kind: 'current-state' },
  { path: 'knowledge/delivery/roadmap.md', kind: 'roadmap' },
]
// Directories that must exist for later artifacts (kept via a .gitkeep placeholder).
const DIR_TARGETS = ['knowledge/tech/decisions', 'knowledge/delivery/work-items']

export type BootstrapResult = {
  state: ProjectState
  written: string[]
  skipped: string[]
  createdDirs: string[]
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

/**
 * Create the state-aware knowledge baseline. Pure and deterministic; never overwrites existing files
 * (reported as skipped). Does not install agents/skills or generate roadmap candidates/Work Items.
 */
export function bootstrap(dir: string): BootstrapResult {
  const written: string[] = []
  const skipped: string[] = []
  const createdDirs: string[] = []

  let state: ProjectState = 'new'
  let language: ProjectLanguage = 'en'
  try {
    const config = loadConfig(dir)
    if (config) {
      state = config.project.state
      language = projectLanguage(config)
    }
  } catch {
    // fall back to defaults on unreadable config
  }

  for (const target of FILE_TARGETS) {
    const full = join(dir, target.path)
    if (exists(full)) {
      skipped.push(target.path)
      continue
    }
    const content = withLanguageDirective(baselineTemplate(target.kind, state), language)
    writeFile(full, content.endsWith('\n') ? content : `${content}\n`)
    written.push(target.path)
  }

  for (const d of DIR_TARGETS) {
    const full = join(dir, d)
    if (exists(full)) {
      skipped.push(`${d}/`)
      continue
    }
    ensureDir(full)
    writeFile(join(full, '.gitkeep'), '')
    createdDirs.push(`${d}/`)
  }

  return { state, written, skipped, createdDirs }
}

export async function runBootstrap(dir: string = cwd()): Promise<void> {
  intro('kaddo bootstrap')

  if (!exists(join(dir, CONFIG_PATH))) {
    console.error('Kaddo is not initialized in this project.')
    console.error('Run `kaddo init` first.')
    process.exit(1)
  }

  let state: ProjectState = 'new'
  try {
    const config = loadConfig(dir)
    state = config?.project.state ?? 'new'
  } catch (err) {
    console.error(err instanceof ConfigError ? err.message : String(err))
    process.exit(1)
  }

  const stateLabel = state === 'pre-ai' ? 'pre-ai' : state
  log.info(`Project state: ${stateLabel}`)
  log.info(`Creating ${stateLabel} knowledge baseline.`)
  log.info('Existing files will not be overwritten.')

  const result = bootstrap(dir)

  console.log('')
  if (result.written.length > 0 || result.createdDirs.length > 0) {
    console.log('Created:')
    for (const p of result.written) console.log(`  - ${p}`)
    for (const d of result.createdDirs) console.log(`  - ${d}`)
  }
  if (result.skipped.length > 0) {
    console.log('')
    console.log('Skipped (kept existing):')
    for (const p of result.skipped) console.log(`  - ${p}`)
  }
  console.log('')

  log.info(
    'When you pass the context pack to your LLM/coding agent, it must never commit, push or ' +
      'merge without your confirmation — and create a branch before implementing.'
  )
  printCommandFooter('bootstrap')
  outro(
    `${stateLabel} knowledge baseline ready. Next: \`kaddo add agents\` (then \`kaddo add skills\`), ` +
      'and refine the knowledge with the relevant agents.'
  )
}
