import path from 'path'
import { cwd, exists, join, readFile, readDir, isDir, writeFile } from '../utils/fs.js'
import { intro, outro, log, confirm } from '../utils/ui.js'
import { loadConfig, isCore, systemName, workspaceRoots } from '../core/config.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const CONFIG_PATH = '.kaddo/config.yml'
const MODULES_YML = '.kaddo/modules.yml'
const MODULES_MD = 'knowledge/tech/modules/modules.md'

const IGNORED_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage', 'vendor',
  '.next', 'out', 'tmp', 'temp', '.kaddo',
])

export type DiscoveryStatus =
  | 'configured'
  | 'not_configured'
  | 'invalid'
  | 'foreign_system'
  | 'duplicate'
  | 'missing'

export type DiscoveredModule = {
  id: string
  name: string
  path: string
  parentSystem: string
  status: DiscoveryStatus
  eligibleForMapping: boolean
  warning?: string
  moduleContext: boolean
  currentState: boolean
  codebase: boolean
}

type ModulesYml = {
  version: number
  system: string
  workspace_roots: string[]
  modules: ModulesYmlEntry[]
}

type ModulesYmlEntry = {
  id: string
  name: string
  path: string
  parent_system: string
  status: string
  context?: Record<string, string>
}

export function readModulesYml(dir: string): ModulesYml {
  const p = join(dir, MODULES_YML)
  if (!exists(p)) return { version: 1, system: '', workspace_roots: ['..'], modules: [] }
  try {
    const parsed = parseYaml(readFile(p)) as Partial<ModulesYml>
    return {
      version: parsed.version ?? 1,
      system: parsed.system ?? '',
      workspace_roots: parsed.workspace_roots ?? ['..'],
      modules: Array.isArray(parsed.modules) ? parsed.modules : [],
    }
  } catch {
    return { version: 1, system: '', workspace_roots: ['..'], modules: [] }
  }
}

function writeModulesYml(dir: string, yml: ModulesYml): void {
  writeFile(join(dir, MODULES_YML), stringifyYaml(yml))
}

function readRepoConfig(repoDir: string): Record<string, unknown> | null {
  const configPath = join(repoDir, CONFIG_PATH)
  if (!exists(configPath)) return null
  try {
    return parseYaml(readFile(configPath)) as Record<string, unknown>
  } catch {
    return null
  }
}

function hasKnowledgeFile(repoDir: string, ...segments: string[]): boolean {
  return exists(join(repoDir, 'knowledge', ...segments))
}

function hasModuleContext(repoDir: string): boolean {
  return hasKnowledgeFile(repoDir, 'tech', 'module', 'module-context.md') ||
    hasKnowledgeFile(repoDir, 'module', 'module-context.md')
}

function hasCurrentState(repoDir: string): boolean {
  return hasKnowledgeFile(repoDir, 'tech', 'current-state.md')
}

function hasCodebase(repoDir: string): boolean {
  return hasKnowledgeFile(repoDir, 'tech', 'codebase.md')
}

function buildModuleContextPaths(repoDir: string): Record<string, string> {
  const ctx: Record<string, string> = {}
  if (hasKnowledgeFile(repoDir, 'tech', 'module', 'module-context.md')) {
    ctx.module = 'knowledge/tech/module/module-context.md'
  } else if (hasKnowledgeFile(repoDir, 'module', 'module-context.md')) {
    ctx.module = 'knowledge/module/module-context.md'
  }
  if (hasCurrentState(repoDir)) ctx.current_state = 'knowledge/tech/current-state.md'
  if (hasCodebase(repoDir)) ctx.codebase = 'knowledge/tech/codebase.md'
  return ctx
}

/**
 * Discover modules in workspace roots. Pure read — never modifies any repo.
 */
export function discoverModules(dir: string): DiscoveredModule[] {
  const config = loadConfig(dir)
  if (!config || !isCore(config)) return []

  const sysName = systemName(config) ?? config.project.name
  const roots = workspaceRoots(config)
  const existing = readModulesYml(dir)

  const seenIds = new Set<string>()
  const seenPaths = new Set<string>()
  const results: DiscoveredModule[] = []
  const coreAbsPath = path.resolve(dir)

  for (const root of roots) {
    const rootAbs = path.resolve(dir, root)
    if (!exists(rootAbs) || !isDir(rootAbs)) continue

    let entries: string[]
    try { entries = readDir(rootAbs) } catch { continue }

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry)) continue
      const candidateAbs = path.resolve(rootAbs, entry)
      if (!isDir(candidateAbs)) continue
      if (candidateAbs === coreAbsPath) continue

      const relPath = path.relative(dir, candidateAbs).replace(/\\/g, '/')
      const repoConfig = readRepoConfig(candidateAbs)

      if (!repoConfig) {
        results.push({
          id: entry,
          name: entry,
          path: relPath.startsWith('.') ? relPath : `./${relPath}`,
          parentSystem: '',
          status: 'not_configured',
          eligibleForMapping: false,
          moduleContext: false,
          currentState: false,
          codebase: false,
        })
        continue
      }

      const project = repoConfig.project as Record<string, unknown> | undefined
      const multirepo = repoConfig.multirepo as Record<string, unknown> | undefined
      const module = repoConfig.module as Record<string, unknown> | undefined
      const role = (project?.role as string) ?? (multirepo?.role as string)

      if (role !== 'module') {
        results.push({
          id: entry,
          name: (project?.name as string) ?? entry,
          path: relPath.startsWith('.') ? relPath : `./${relPath}`,
          parentSystem: '',
          status: 'invalid',
          eligibleForMapping: false,
          warning: 'Repository has Kaddo but is not configured as a module.',
          moduleContext: false,
          currentState: false,
          codebase: false,
        })
        continue
      }

      const modId = (module?.id as string) ?? entry
      const modParent = (multirepo?.parent_system as string) ?? ''
      const modName = (project?.name as string) ?? entry
      const modPath = relPath.startsWith('.') ? relPath : `./${relPath}`

      if (modParent && modParent !== sysName) {
        results.push({
          id: modId,
          name: modName,
          path: modPath,
          parentSystem: modParent,
          status: 'foreign_system',
          eligibleForMapping: false,
          warning: `parent system: ${modParent}`,
          moduleContext: hasModuleContext(candidateAbs),
          currentState: hasCurrentState(candidateAbs),
          codebase: hasCodebase(candidateAbs),
        })
        continue
      }

      let status: DiscoveryStatus = 'configured'
      let warning: string | undefined
      let eligible = true

      if (seenIds.has(modId)) {
        status = 'duplicate'
        warning = `duplicate module id: ${modId}`
        eligible = false
      } else if (seenPaths.has(modPath)) {
        status = 'duplicate'
        warning = `duplicate path: ${modPath}`
        eligible = false
      }

      seenIds.add(modId)
      seenPaths.add(modPath)

      results.push({
        id: modId,
        name: modName,
        path: modPath,
        parentSystem: modParent || sysName,
        status,
        eligibleForMapping: eligible,
        warning,
        moduleContext: hasModuleContext(candidateAbs),
        currentState: hasCurrentState(candidateAbs),
        codebase: hasCodebase(candidateAbs),
      })
    }
  }

  // Check for previously registered modules whose paths no longer exist.
  for (const m of existing.modules) {
    const absPath = path.resolve(dir, m.path)
    if (!exists(absPath) && !results.some((r) => r.path === m.path)) {
      results.push({
        id: m.id,
        name: m.name,
        path: m.path,
        parentSystem: m.parent_system,
        status: 'missing',
        eligibleForMapping: false,
        warning: 'Previously registered but path no longer exists.',
        moduleContext: false,
        currentState: false,
        codebase: false,
      })
    }
  }

  return results
}

/**
 * Apply discovered modules to .kaddo/modules.yml and modules.md.
 */
export function applyDiscovery(dir: string, discovered: DiscoveredModule[]): { mapped: number } {
  const config = loadConfig(dir)
  const sysName = systemName(config!) ?? config!.project.name
  const yml = readModulesYml(dir)
  yml.system = sysName

  const eligible = discovered.filter((d) => d.eligibleForMapping && d.status === 'configured')
  for (const d of eligible) {
    const existingIdx = yml.modules.findIndex((m) => m.id === d.id)
    const entry: ModulesYmlEntry = {
      id: d.id,
      name: d.name,
      path: d.path,
      parent_system: d.parentSystem,
      status: d.status,
      context: buildModuleContextPaths(path.resolve(dir, d.path)),
    }
    if (existingIdx >= 0) {
      yml.modules[existingIdx] = entry
    } else {
      yml.modules.push(entry)
    }
  }

  writeModulesYml(dir, yml)
  updateModulesMd(dir, yml)

  return { mapped: eligible.length }
}

function updateModulesMd(dir: string, yml: ModulesYml): void {
  const lines: string[] = [
    '---',
    'type: modules-map',
    `system: ${yml.system}`,
    'generated_by: kaddo-modules-discover',
    'template_version: 2',
    '---',
    '',
    `# ${yml.system} — Modules`,
    '',
  ]

  if (yml.modules.length === 0) {
    lines.push('_No modules mapped yet. Run `kaddo modules discover` to find sibling modules._')
  } else {
    for (const m of yml.modules) {
      lines.push(`## ${m.id}`)
      lines.push('')
      lines.push(`- Repository: \`${m.path}\``)
      lines.push(`- Status: ${m.status}`)
      lines.push(`- Parent system: ${m.parent_system}`)
      const ctxPaths = m.context ?? {}
      lines.push(`- Module context: ${ctxPaths.module ? 'available' : 'missing'}`)
      lines.push('')
    }
  }

  writeFile(join(dir, MODULES_MD), lines.join('\n'))
}

/**
 * Validate modules already registered in .kaddo/modules.yml (VS-093 AC26).
 */
export function runModulesValidate(dir: string = cwd()): void {
  const yml = readModulesYml(dir)
  if (yml.modules.length === 0) {
    console.log('No modules registered in .kaddo/modules.yml.')
    return
  }

  const config = loadConfig(dir)
  const sysName = systemName(config!) ?? config!.project.name

  const legacy = detectLegacyPaths(dir)
  if (legacy.length > 0) {
    console.log('')
    console.log('Legacy multirepo knowledge paths detected.')
    console.log('')
    console.log('Recommended migration:')
    for (const l of legacy) {
      console.log(`- ${l.from}`)
      console.log(`  → ${l.to}`)
      console.log('')
    }
  }

  console.log('')
  for (const m of yml.modules) {
    const absPath = path.resolve(dir, m.path)
    if (!exists(absPath)) {
      console.log(`${m.id.padEnd(16)} missing`)
      continue
    }
    const repoConfig = readRepoConfig(absPath)
    if (!repoConfig) {
      console.log(`${m.id.padEnd(16)} not_configured`)
      continue
    }
    const project = repoConfig.project as Record<string, unknown> | undefined
    const multirepo = repoConfig.multirepo as Record<string, unknown> | undefined
    const role = (project?.role as string) ?? (multirepo?.role as string)
    if (role !== 'module') {
      console.log(`${m.id.padEnd(16)} invalid`)
      continue
    }
    const modParent = multirepo?.parent_system as string
    if (modParent && modParent !== sysName) {
      console.log(`${m.id.padEnd(16)} foreign_system`)
      continue
    }
    console.log(`${m.id.padEnd(16)} valid`)
  }
  console.log('')
}

export type LegacyMigration = { from: string; to: string }

export function detectLegacyPaths(dir: string): LegacyMigration[] {
  const migrations: LegacyMigration[] = []
  if (exists(join(dir, 'knowledge', 'system', 'system-context.md'))) {
    migrations.push({ from: 'knowledge/system/system-context.md', to: 'knowledge/tech/system/system-context.md' })
  }
  if (exists(join(dir, 'knowledge', 'modules', 'modules.md'))) {
    migrations.push({ from: 'knowledge/modules/modules.md', to: 'knowledge/tech/modules/modules.md' })
  }
  if (exists(join(dir, 'knowledge', 'module', 'module-context.md'))) {
    migrations.push({ from: 'knowledge/module/module-context.md', to: 'knowledge/tech/module/module-context.md' })
  }
  return migrations
}

export async function runModulesDiscover(opts: { apply?: boolean } = {}): Promise<void> {
  const dir = cwd()

  intro('kaddo modules discover')

  const config = loadConfig(dir)
  if (!config) {
    console.error('Kaddo is not initialized. Run `kaddo init` first.')
    process.exit(1)
  }
  if (!isCore(config)) {
    console.error('Module discovery is only available from a core repository.')
    process.exit(1)
  }

  const discovered = discoverModules(dir)

  if (discovered.length === 0) {
    log.info('No sibling repositories found in workspace roots.')
    outro('Discovery complete.')
    return
  }

  console.log('')
  console.log('Workspace module discovery')
  console.log('')

  for (const d of discovered) {
    const icon =
      d.status === 'configured' ? '✓' :
      d.status === 'not_configured' ? '○' :
      d.status === 'foreign_system' ? '!' :
      d.status === 'duplicate' ? '!' :
      d.status === 'missing' ? '✗' :
      '✗'
    console.log(`${icon} ${d.id}`)
    console.log(`  ${d.path}`)
    console.log(`  status: ${d.status}`)
    if (d.warning) console.log(`  ${d.warning}`)
    console.log('')
  }

  const eligible = discovered.filter((d) => d.eligibleForMapping && d.status === 'configured')
  console.log(`Eligible for mapping: ${eligible.length}`)

  if (eligible.length === 0) {
    outro('Discovery complete.')
    return
  }

  if (opts.apply) {
    const confirmed = await confirm({
      message: `Map ${eligible.length} configured Kaddo modules?`,
      initialValue: true,
    })
    if (!confirmed) {
      outro('No changes applied.')
      return
    }
    const result = applyDiscovery(dir, discovered)
    log.success(`Mapped ${result.mapped} configured modules.`)
    log.success('Updated .kaddo/modules.yml.')
    log.success('Updated knowledge/tech/modules/modules.md.')
    outro('Discovery applied.')
  } else {
    log.info('Run `kaddo modules discover --apply` to persist eligible modules.')
    outro('Discovery complete.')
  }
}
