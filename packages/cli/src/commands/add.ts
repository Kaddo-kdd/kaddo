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

export function runAdd(moduleName: string): void {
  const dir = cwd()

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

  if (isModuleInstalled(dir, mod.configKey)) {
    log.warn(`Module "${mod.name}" is already installed.`)
    outro('Nothing changed.')
    return
  }

  // Create directories
  for (const d of mod.dirs) {
    ensureDir(join(dir, d))
    log.success(`Created ${d}/`)
  }

  // Write files
  for (const file of mod.files) {
    const fullPath = join(dir, file.path)
    if (!exists(fullPath)) {
      writeFile(fullPath, file.content)
    }
  }

  // Mark as installed in config
  markModuleInstalled(dir, mod.configKey, mod.name)
  log.success(`Module "${mod.name}" installed.`)

  // Show new work item types
  if (mod.workItemTypes.length > 0) {
    log.info(`New work item types available:`)
    for (const t of mod.workItemTypes) {
      console.log(`    kaddo create ${t.name}  [${t.knowledgeLevel}] — ${t.description}`)
    }
  }

  outro(`Done. Run \`kaddo create ${mod.workItemTypes[0]?.name ?? mod.name}\` to get started.`)
}
