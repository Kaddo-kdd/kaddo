import { getModule, listModules } from '../modules/registry.js'
import { exists, writeFile, ensureDir, join, cwd, readFile } from '../utils/fs.js'
import { log, intro, outro } from '../utils/ui.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const CONFIG_PATH = '.kaddo/config.yml'

function markModuleInstalled(dir: string, configKey: string, moduleName: string): void {
  const configPath = join(dir, CONFIG_PATH)
  if (!exists(configPath)) return
  try {
    const config = parseYaml(readFile(configPath)) as Record<string, unknown>
    config[configKey] = { installed: true, installed_at: new Date().toISOString().split('T')[0] }
    const modules = (config.modules as string[] | undefined) ?? []
    if (!modules.includes(moduleName)) modules.push(moduleName)
    config.modules = modules
    writeFile(configPath, stringifyYaml(config))
  } catch {
    // non-fatal
  }
}

function isModuleInstalled(dir: string, configKey: string): boolean {
  const configPath = join(dir, CONFIG_PATH)
  if (!exists(configPath)) return false
  try {
    const config = parseYaml(readFile(configPath)) as Record<string, unknown>
    const moduleConfig = config[configKey] as { installed?: boolean } | undefined
    return moduleConfig?.installed === true
  } catch {
    return false
  }
}

export function runAdd(moduleName: string, dir: string = cwd()): void {
  if (!moduleName) {
    console.log('')
    console.log('Available modules:')
    for (const mod of listModules()) {
      console.log(`  kaddo add ${mod.name.padEnd(12)} — ${mod.description}`)
    }
    console.log('')
    return
  }

  const mod = getModule(moduleName)
  if (!mod) {
    console.error(`Unknown module: "${moduleName}"`)
    console.error(`Available: ${listModules().map((m) => m.name).join(', ')}`)
    process.exit(1)
  }

  intro(`kaddo add ${mod.name}`)

  // Require an initialized project.
  if (!exists(join(dir, CONFIG_PATH))) {
    console.error('Kaddo is not initialized in this project.')
    console.error('Run `kaddo init` first.')
    process.exit(1)
  }

  const alreadyInstalled = isModuleInstalled(dir, mod.configKey)

  // Create directories (idempotent).
  for (const d of mod.dirs) {
    ensureDir(join(dir, d))
  }

  // Write only files that do not exist — never overwrite user-edited files silently.
  const written: string[] = []
  const skipped: string[] = []
  for (const file of mod.files) {
    const fullPath = join(dir, file.path)
    if (exists(fullPath)) {
      skipped.push(file.path)
    } else {
      writeFile(fullPath, file.content)
      written.push(file.path)
    }
  }

  for (const p of written) log.success(`Created ${p}`)
  for (const p of skipped) log.info(`Kept existing ${p}`)

  if (alreadyInstalled && written.length === 0) {
    outro(`Module "${mod.name}" is already installed. Nothing changed.`)
    return
  }

  // Mark as installed in config
  markModuleInstalled(dir, mod.configKey, mod.name)
  log.success(`Module "${mod.name}" installed.`)

  // Agents are prompt packs, not work items — show a tailored handoff.
  if (mod.name === 'agents') {
    log.info('Next:')
    console.log('    1. Run `kaddo context`')
    console.log('    2. Open your preferred LLM chat')
    console.log('    3. Paste `.kaddo/context-pack.md`')
    console.log('    4. Use the recommended agent for your project state')
    outro('Agents installed. Kaddo prepares context — your LLM does the interpretation.')
    return
  }

  // Show new work item types
  if (mod.workItemTypes.length > 0) {
    log.info(`New work item types available:`)
    for (const t of mod.workItemTypes) {
      console.log(`    kaddo create ${t.name}  [${t.knowledgeLevel}] — ${t.description}`)
    }
  }

  outro(`Done. Run \`kaddo create ${mod.workItemTypes[0]?.name ?? mod.name}\` to get started.`)
}
