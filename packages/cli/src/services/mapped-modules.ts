// Reader for multirepo modules registered in `.kaddo/modules.yml` (VS module-aware
// context/explain). The descriptor is the single source of truth — modules are never
// inferred from folders alone. Per-module artifact coverage is computed from the
// `knowledge/tech/modules/<id>/` structure. No secondary repo source code is ever read.

import { exists, readFile, join } from '../utils/fs.js'
import { parse as parseYaml } from 'yaml'

export type MappedModuleInfo = {
  id: string
  name?: string
  repoPath: string
  type?: string
  mainTechnology?: string
  owner?: string
  capabilities: string[]
  code: string[]
  status?: string
}

export type ModuleArtifactCoverage = {
  moduleDesign: boolean
  stack: boolean
  security: boolean
  standards: boolean
  diagrams: boolean
  adrs: boolean
}

export type MappedModuleWithCoverage = MappedModuleInfo & {
  artifacts: ModuleArtifactCoverage
}

const DESCRIPTOR_PATH = '.kaddo/modules.yml'

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : []
}

function moduleArtifactCoverage(dir: string, id: string): ModuleArtifactCoverage {
  const base = join(dir, 'knowledge', 'tech', 'modules', id)
  return {
    moduleDesign: exists(join(base, 'module-design.md')),
    stack: exists(join(base, 'stack.md')),
    security: exists(join(base, 'security.md')),
    standards: exists(join(base, 'standards.md')),
    diagrams: exists(join(base, 'diagrams')),
    adrs: exists(join(base, 'adrs')),
  }
}

/**
 * Load mapped modules from `.kaddo/modules.yml`, each enriched with deterministic
 * artifact coverage. Returns an empty array when the descriptor is missing, empty or
 * invalid — never throws, so callers stay robust.
 */
export function loadMappedModules(dir: string): MappedModuleWithCoverage[] {
  const path = join(dir, DESCRIPTOR_PATH)
  if (!exists(path)) return []
  let parsed: { modules?: unknown }
  try {
    parsed = parseYaml(readFile(path)) as { modules?: unknown }
  } catch {
    return []
  }
  const raw = Array.isArray(parsed?.modules) ? parsed.modules : []
  const modules: MappedModuleWithCoverage[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const m = entry as Record<string, unknown>
    const id = typeof m.id === 'string' ? m.id : ''
    if (!id) continue
    modules.push({
      id,
      name: typeof m.name === 'string' ? m.name : undefined,
      repoPath: typeof m.repoPath === 'string' ? m.repoPath : (typeof m.path === 'string' ? m.path : ''),
      type: typeof m.type === 'string' ? m.type : undefined,
      mainTechnology: typeof m.mainTechnology === 'string' ? m.mainTechnology : undefined,
      owner: typeof m.owner === 'string' ? m.owner : undefined,
      capabilities: toStringArray(m.capabilities),
      code: toStringArray(m.code),
      status: typeof m.status === 'string' ? m.status : undefined,
      artifacts: moduleArtifactCoverage(dir, id),
    })
  }
  return modules
}

export type ModuleKaddoStatus = 'configured' | 'not_configured' | 'invalid'

export type ModuleStatusInfo = {
  status: ModuleKaddoStatus
  configured: boolean
  role?: string
  moduleContext: boolean
  currentState: boolean
  codebase: boolean
  warning?: string
}

/**
 * Detect the Kaddo configuration status of a mapped module's repository (VS-091).
 * Checks whether the module repo has a config, the correct role, and required files.
 */
export function detectModuleStatus(coreDir: string, repoPath: string): ModuleStatusInfo {
  const moduleDir = join(coreDir, repoPath)
  const configPath = join(moduleDir, '.kaddo', 'config.yml')
  const hasConfig = exists(configPath)

  if (!hasConfig) {
    return {
      status: 'not_configured',
      configured: false,
      moduleContext: false,
      currentState: false,
      codebase: false,
      warning: `Run \`kaddo init\` inside \`${repoPath}\` and select multirepo → module.`,
    }
  }

  let parsed: Record<string, unknown> | null = null
  try {
    parsed = parseYaml(readFile(configPath)) as Record<string, unknown>
  } catch {
    // invalid yaml
  }

  const project = parsed?.project as Record<string, unknown> | undefined
  const multirepo = parsed?.multirepo as Record<string, unknown> | undefined
  const role = (project?.role as string) ?? (multirepo?.role as string)

  if (role !== 'module') {
    return {
      status: 'invalid',
      configured: true,
      role,
      moduleContext: false,
      currentState: false,
      codebase: false,
      warning: `Repository has Kaddo configured but project.role is not module.`,
    }
  }

  return {
    status: 'configured',
    configured: true,
    role: 'module',
    moduleContext: exists(join(moduleDir, 'knowledge', 'tech', 'module', 'module-context.md')) ||
      exists(join(moduleDir, 'knowledge', 'module', 'module-context.md')),
    currentState: exists(join(moduleDir, 'knowledge', 'tech', 'current-state.md')),
    codebase: exists(join(moduleDir, 'knowledge', 'tech', 'codebase.md')),
  }
}

/**
 * Read the module-context.md content from a mapped module's repo (VS-091).
 * Returns null if the file doesn't exist.
 */
export function readModuleContext(coreDir: string, repoPath: string): string | null {
  // VS-093: new path under knowledge/tech/module/, legacy under knowledge/module/.
  const newPath = join(coreDir, repoPath, 'knowledge', 'tech', 'module', 'module-context.md')
  const legacyPath = join(coreDir, repoPath, 'knowledge', 'module', 'module-context.md')
  const p = exists(newPath) ? newPath : legacyPath
  if (!exists(p)) return null
  try {
    return readFile(p)
  } catch {
    return null
  }
}

/** Human-readable list of the present artifacts for a module's coverage. */
export function presentArtifacts(coverage: ModuleArtifactCoverage): string[] {
  const present: string[] = []
  if (coverage.moduleDesign) present.push('module-design')
  if (coverage.stack) present.push('stack')
  if (coverage.security) present.push('security')
  if (coverage.standards) present.push('standards')
  if (coverage.diagrams) present.push('diagrams')
  if (coverage.adrs) present.push('adrs')
  return present
}
