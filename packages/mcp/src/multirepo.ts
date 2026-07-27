// Multirepo MCP tools (VS-092).
//
// Read-only tools that help agents understand multirepo projects: module listing,
// module context retrieval, WI validation, WI context composition, branch strategy,
// and capsule export. Never executes git, never calls LLM, never modifies knowledge.

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { readYaml, readText, writeDerived, assertMcpDerivedWritePath } from './project.js'
import { listWorkItems, type WorkItemSummary } from './workitems.js'
import type { ToolResult } from './tools.js'

const ok = (data: unknown): ToolResult => ({ ok: true, data })
const fail = (message: string): ToolResult => ({ ok: false, message })

// --- Module repo reading (safe, restricted to knowledge files) ---------------

type ModulesDescriptor = {
  version?: number
  system?: string
  workspace_roots?: string[]
  modules?: Array<{
    id: string
    name?: string
    path?: string
    repoPath?: string
    parent_system?: string
    type?: string
    mainTechnology?: string
    owner?: string
    capabilities?: string[]
    code?: string[]
    status?: string
    context?: Record<string, string>
  }>
}

function moduleRepoPath(m: { path?: string; repoPath?: string }): string {
  return m.path ?? m.repoPath ?? ''
}

type ConfigYaml = {
  project?: { name?: string; role?: string; structure?: string }
  multirepo?: { role?: string; parent_system?: string }
  module?: { id?: string }
}

function loadModulesDescriptor(root: string): ModulesDescriptor {
  return readYaml<ModulesDescriptor>(root, '.kaddo/modules.yml') ?? { modules: [] }
}

function loadConfig(root: string): ConfigYaml | null {
  return readYaml<ConfigYaml>(root, '.kaddo/config.yml')
}

function projectRole(config: ConfigYaml): string | undefined {
  return config.project?.role ?? config.multirepo?.role
}

function isCore(config: ConfigYaml): boolean {
  return projectRole(config) === 'core'
}

function readModuleFile(root: string, repoPath: string, relFile: string): string | null {
  const moduleDir = path.resolve(root, repoPath)
  const abs = path.resolve(moduleDir, relFile)
  if (!abs.startsWith(moduleDir)) return null
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null
  return fs.readFileSync(abs, 'utf-8')
}

type ModuleKaddoStatus = 'configured' | 'not_configured' | 'invalid' | 'missing'

type ModuleStatusDetail = {
  status: ModuleKaddoStatus
  configured: boolean
  role?: string
  moduleContext: boolean
  currentState: boolean
  codebase: boolean
  warning?: string
}

function detectModuleStatus(root: string, repoPath: string): ModuleStatusDetail {
  const moduleDir = path.resolve(root, repoPath)
  if (!fs.existsSync(moduleDir)) {
    return { status: 'missing', configured: false, moduleContext: false, currentState: false, codebase: false, warning: `Directory \`${repoPath}\` does not exist.` }
  }
  const configPath = path.join(moduleDir, '.kaddo', 'config.yml')
  if (!fs.existsSync(configPath)) {
    return { status: 'not_configured', configured: false, moduleContext: false, currentState: false, codebase: false, warning: `Run \`kaddo init\` inside \`${repoPath}\` and select multirepo → module.` }
  }
  let parsed: ConfigYaml | null = null
  try {
    parsed = parseYaml(fs.readFileSync(configPath, 'utf-8')) as ConfigYaml
  } catch { /* invalid yaml */ }
  const role = parsed?.project?.role ?? parsed?.multirepo?.role
  if (role !== 'module') {
    return { status: 'invalid', configured: true, role, moduleContext: false, currentState: false, codebase: false, warning: `Repository has Kaddo configured but project.role is not module.` }
  }
  return {
    status: 'configured', configured: true, role: 'module',
    moduleContext: fs.existsSync(path.join(moduleDir, 'knowledge', 'tech', 'module', 'module-context.md')) ||
      fs.existsSync(path.join(moduleDir, 'knowledge', 'module', 'module-context.md')),
    currentState: fs.existsSync(path.join(moduleDir, 'knowledge', 'tech', 'current-state.md')),
    codebase: fs.existsSync(path.join(moduleDir, 'knowledge', 'tech', 'codebase.md')),
  }
}

function resolveModuleContextPath(root: string, repoPath: string): string {
  const moduleDir = path.resolve(root, repoPath)
  if (fs.existsSync(path.join(moduleDir, 'knowledge', 'tech', 'module', 'module-context.md'))) {
    return 'knowledge/tech/module/module-context.md'
  }
  return 'knowledge/module/module-context.md'
}

function isPlaceholder(content: string): boolean {
  const body = content.replace(/^---[\s\S]*?---\n?/, '')
  return /^_[^_]+_$/m.test(body) && !body.split('\n').some((l) => l.trim().length > 0 && !l.startsWith('#') && !l.startsWith('_') && !l.startsWith('-') && !l.startsWith('>'))
}

function firstParagraph(md: string): string {
  const body = md.replace(/^---[\s\S]*?---\n?/, '')
  for (const block of body.split(/\n\s*\n/)) {
    const t = block.trim()
    if (t && !t.startsWith('#') && !t.startsWith('>') && !t.startsWith('_')) return t.replace(/\s+/g, ' ')
  }
  return ''
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

// --- Tool 1: kaddo_modules_list ----------------------------------------------

export function modulesListTool(root: string, args: { includeWarnings?: boolean }): ToolResult {
  const config = loadConfig(root)
  if (!config) return fail('No Kaddo config found. Run `kaddo init` first.')
  if (!isCore(config)) return fail('kaddo_modules_list can only be called from a core repository (project.role: core).')

  const descriptor = loadModulesDescriptor(root)
  const modules = (descriptor.modules ?? []).map((m) => {
    const rp = moduleRepoPath(m)
    const st = detectModuleStatus(root, rp)
    const entry: Record<string, unknown> = {
      id: m.id,
      repo: rp,
      status: st.status,
      kaddo: {
        configured: st.configured,
        role: st.role,
        moduleContext: st.moduleContext,
        currentState: st.currentState,
        codebase: st.codebase,
      },
    }
    if (args.includeWarnings && st.warning) entry.warning = st.warning
    return entry
  })

  return ok({
    project: { name: config.project?.name ?? 'unknown', structure: config.project?.structure ?? 'unknown', role: 'core' },
    modules,
  })
}

// --- Tool 2: kaddo_get_module_context ----------------------------------------

export function getModuleContextTool(root: string, args: { module: string; includeTech?: boolean; includeWarnings?: boolean }): ToolResult {
  const config = loadConfig(root)
  if (!config) return fail('No Kaddo config found.')

  const descriptor = loadModulesDescriptor(root)
  const mod = (descriptor.modules ?? []).find((m) => m.id === args.module)
  if (!mod) return fail(`Module "${args.module}" not found in .kaddo/modules.yml.`)

  const rp = moduleRepoPath(mod)
  const st = detectModuleStatus(root, rp)
  const warnings: string[] = []

  if (st.status !== 'configured') {
    if (st.warning) warnings.push(st.warning)
    return ok({
      module: { id: mod.id, status: st.status },
      context: null,
      warnings,
      recommendedNextStep: { label: 'Initialize module repository with Kaddo.', command: 'kaddo init' },
    })
  }

  const mcRelPath = resolveModuleContextPath(root, rp)
  const mcContent = readModuleFile(root, rp, mcRelPath)
  const context: Record<string, unknown> = {
    moduleContextPath: `${rp}/${mcRelPath}`,
    moduleContext: mcContent ?? null,
  }

  if (mcContent && isPlaceholder(mcContent)) {
    warnings.push('module-context.md still contains placeholder sections.')
  }

  if (args.includeTech) {
    const cs = readModuleFile(root, rp, 'knowledge/tech/current-state.md')
    const cb = readModuleFile(root, rp, 'knowledge/tech/codebase.md')
    context.currentStatePath = `${rp}/knowledge/tech/current-state.md`
    context.currentStateSummary = cs ? firstParagraph(cs) : null
    context.codebasePath = `${rp}/knowledge/tech/codebase.md`
    context.codebaseSummary = cb ? firstParagraph(cb) : null
    if (!cs) warnings.push('current-state.md not found in module repository.')
    if (!cb) warnings.push('codebase.md not found in module repository.')
  }

  return ok({
    module: { id: mod.id, repo: rp, status: 'configured' },
    context,
    warnings: args.includeWarnings ? warnings : [],
  })
}

// --- Tool 3: kaddo_validate_work_item_modules --------------------------------

export function validateWorkItemModulesTool(root: string, args: { workItemId: string }): ToolResult {
  const items = listWorkItems(root)
  const wi = items.find((w) => w.id === args.workItemId)
  if (!wi) return fail(`Work Item "${args.workItemId}" not found.`)

  const raw = readText(root, wi.path)
  if (!raw) return fail(`Could not read Work Item file.`)

  const parsed = matter(raw)
  const data = parsed.data as Record<string, unknown>
  const affectedModules: string[] = Array.isArray(data.affected_modules) ? data.affected_modules.map(String) : []
  const codeEntries: Array<{ repo?: string; paths?: string[] }> = Array.isArray(data.code) ? data.code.filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null).map((c) => ({ repo: typeof c.repo === 'string' ? c.repo : undefined, paths: Array.isArray(c.paths) ? c.paths.map(String) : [] })) : []

  const descriptor = loadModulesDescriptor(root)
  const mapped = new Set((descriptor.modules ?? []).map((m) => m.id))

  const warnings: string[] = []
  const errors: string[] = []

  if (affectedModules.length === 0) {
    warnings.push('Work Item has no affected_modules declared.')
  }

  const moduleValidations = affectedModules.map((modId) => {
    if (!mapped.has(modId)) {
      errors.push(`Module "${modId}" is not in .kaddo/modules.yml.`)
      return { id: modId, status: 'not_mapped' as const, hasModuleContext: false, hasCurrentState: false, hasCodebase: false, hasOwnership: false }
    }
    const mod = (descriptor.modules ?? []).find((m) => m.id === modId)!
    const rp = moduleRepoPath(mod)
    const st = detectModuleStatus(root, rp)
    if (st.status !== 'configured') {
      warnings.push(`Module "${modId}" is ${st.status}.`)
    }
    const mcRelPath = resolveModuleContextPath(root, rp)
    const mcContent = st.moduleContext ? readModuleFile(root, rp, mcRelPath) : null
    if (mcContent && isPlaceholder(mcContent)) {
      warnings.push(`Module "${modId}" has placeholder module-context.`)
    }
    const hasOwnership = codeEntries.some((c) => c.repo && (c.repo === rp || c.repo.endsWith(`/${modId}`) || c.repo.includes(modId)))
    return { id: modId, status: st.status, hasModuleContext: st.moduleContext, hasCurrentState: st.currentState, hasCodebase: st.codebase, hasOwnership }
  })

  for (const ce of codeEntries) {
    if (ce.repo && !affectedModules.some((m) => ce.repo!.includes(m))) {
      warnings.push(`code.repo "${ce.repo}" is not listed in affected_modules.`)
    }
  }

  for (const mv of moduleValidations) {
    if (affectedModules.includes(mv.id) && !mv.hasOwnership) {
      warnings.push(`Module "${mv.id}" is in affected_modules but has no paths in code.`)
    }
  }

  return ok({
    workItem: { id: wi.id, title: wi.title, status: wi.status, scope: affectedModules.length > 0 ? 'multirepo' : 'single', affectedModules },
    validation: { valid: errors.length === 0, modules: moduleValidations, warnings, errors },
  })
}

// --- Tool 4: kaddo_get_work_item_context -------------------------------------

export function getWorkItemContextTool(root: string, args: { workItemId: string; includeModuleContexts?: boolean; includeBranchStrategy?: boolean; includeGuardExpectations?: boolean }): ToolResult {
  const config = loadConfig(root)
  if (!config) return fail('No Kaddo config found.')

  const items = listWorkItems(root)
  const wi = items.find((w) => w.id === args.workItemId)
  if (!wi) return fail(`Work Item "${args.workItemId}" not found.`)

  const raw = readText(root, wi.path)
  if (!raw) return fail(`Could not read Work Item file.`)

  const parsed = matter(raw)
  const data = parsed.data as Record<string, unknown>
  const affectedModules: string[] = Array.isArray(data.affected_modules) ? data.affected_modules.map(String) : []
  const codeEntries: Array<{ repo?: string; paths?: string[] }> = Array.isArray(data.code) ? data.code.filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null).map((c) => ({ repo: typeof c.repo === 'string' ? c.repo : undefined, paths: Array.isArray(c.paths) ? c.paths.map(String) : [] })) : []

  const descriptor = loadModulesDescriptor(root)
  const warnings: string[] = []

  const modules = affectedModules.map((modId) => {
    const mod = (descriptor.modules ?? []).find((m) => m.id === modId)
    if (!mod) {
      warnings.push(`Module "${modId}" not in modules.yml.`)
      return { id: modId, repo: null, moduleContext: null, currentStateSummary: null, codebaseSummary: null }
    }
    const rp = moduleRepoPath(mod)
    const st = detectModuleStatus(root, rp)
    if (st.status !== 'configured') warnings.push(`Module "${modId}" is ${st.status}.`)

    const mcRelPath = resolveModuleContextPath(root, rp)
    const mc = args.includeModuleContexts !== false ? readModuleFile(root, rp, mcRelPath) : null
    const cs = readModuleFile(root, rp, 'knowledge/tech/current-state.md')
    const cb = readModuleFile(root, rp, 'knowledge/tech/codebase.md')
    return { id: modId, repo: rp, moduleContext: mc, currentStateSummary: cs ? firstParagraph(cs) : null, codebaseSummary: cb ? firstParagraph(cb) : null }
  })

  const ownership = { crossRepo: codeEntries.length > 1, items: codeEntries.filter((c) => c.repo).map((c) => ({ repo: c.repo!, paths: c.paths ?? [] })) }

  const result: Record<string, unknown> = {
    project: { name: config.project?.name ?? 'unknown', role: projectRole(config) ?? 'unknown', structure: config.project?.structure ?? 'unknown' },
    workItem: { id: wi.id, title: wi.title, status: wi.status, affectedModules, acceptanceCriteria: extractSection(parsed.content, 'Acceptance criteria'), outOfScope: extractSection(parsed.content, 'Out of scope') },
    modules,
    ownership,
    warnings,
  }

  if (args.includeBranchStrategy !== false && affectedModules.length > 0) {
    result.branchStrategy = buildBranchStrategy(wi, affectedModules, codeEntries, descriptor)
  }

  if (args.includeGuardExpectations) {
    result.guardExpectations = [
      'Run guard from core before closing the Work Item.',
      'Validate ownership across all affected repos.',
    ]
  }

  return ok(result)
}

function extractSection(content: string, heading: string): string[] {
  const re = new RegExp(`^##\\s+${heading}\\s*$`, 'im')
  const lines = content.split(/\r?\n/)
  const start = lines.findIndex((l) => re.test(l))
  if (start < 0) return []
  const out: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break
    const m = lines[i].match(/^\s*-\s*\[[ x]?\]\s*(.+?)\s*$/)
    if (m) out.push(m[1])
  }
  return out
}

// --- Tool 5: kaddo_suggest_branch_strategy -----------------------------------

function buildBranchStrategy(wi: WorkItemSummary, affectedModules: string[], codeEntries: Array<{ repo?: string; paths?: string[] }>, descriptor: ModulesDescriptor): Record<string, unknown> {
  const slug = slugify(wi.title)
  const wiLower = wi.id.toLowerCase()
  const coreBranch = `feature/${wiLower}-${slug}`

  const moduleBranches: Record<string, string> = {}
  const commitMessages: Record<string, string> = {}

  for (const modId of affectedModules) {
    const mod = (descriptor.modules ?? []).find((m) => m.id === modId)
    const repo = mod ? moduleRepoPath(mod) || modId : modId
    moduleBranches[repo] = `feature/${wiLower}-${modId}-${slug.slice(0, 20)}`
    commitMessages[repo] = `fix(${wiLower}): update ${modId}`
  }

  commitMessages['core'] = `docs(${wiLower}): capture cross-repo implementation summary`

  return {
    type: affectedModules.length > 0 ? 'multi-repo' : 'single-repo',
    branches: { core: coreBranch, modules: moduleBranches },
    commitMessages,
    checklist: [
      'Create branches manually in each repo.',
      'Implement changes in affected module repos.',
      'Run validation per repo.',
      'Run Kaddo guard from core.',
      'Review diffs manually.',
      'Commit only with explicit human confirmation.',
    ],
  }
}

export function suggestBranchStrategyTool(root: string, args: { workItemId: string }): ToolResult {
  const items = listWorkItems(root)
  const wi = items.find((w) => w.id === args.workItemId)
  if (!wi) return fail(`Work Item "${args.workItemId}" not found.`)

  const raw = readText(root, wi.path)
  if (!raw) return fail(`Could not read Work Item file.`)

  const parsed = matter(raw)
  const data = parsed.data as Record<string, unknown>
  const affectedModules: string[] = Array.isArray(data.affected_modules) ? data.affected_modules.map(String) : []
  const codeEntries: Array<{ repo?: string; paths?: string[] }> = Array.isArray(data.code) ? data.code.filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null).map((c) => ({ repo: typeof c.repo === 'string' ? c.repo : undefined, paths: Array.isArray(c.paths) ? c.paths.map(String) : [] })) : []

  const descriptor = loadModulesDescriptor(root)
  const strategy = buildBranchStrategy(wi, affectedModules, codeEntries, descriptor)

  return ok({
    workItem: { id: wi.id, title: wi.title },
    strategy,
    safety: { gitCommandsExecuted: false, message: 'Kaddo only suggests branch and commit strategy. It does not execute git commands.' },
  })
}

// --- Tool 6: kaddo_export_capsule --------------------------------------------

export function exportCapsuleTool(root: string, args: { scope?: string; module?: string }): ToolResult {
  const config = loadConfig(root)
  if (!config) return fail('No Kaddo config found.')

  const role = projectRole(config)
  const warnings: string[] = []
  let capsuleType: string
  let capsuleName: string
  let capsuleData: Record<string, unknown>

  if (args.module) {
    if (role === 'core') {
      const descriptor = loadModulesDescriptor(root)
      const mod = (descriptor.modules ?? []).find((m) => m.id === args.module)
      if (!mod) return fail(`Module "${args.module}" not found in .kaddo/modules.yml.`)
      const rp = moduleRepoPath(mod)
      const mcRelPath = resolveModuleContextPath(root, rp)
      const mc = readModuleFile(root, rp, mcRelPath)
      if (!mc) warnings.push('module-context.md not found for this module.')
      if (mc && isPlaceholder(mc)) warnings.push('module-context.md contains placeholder sections.')
      capsuleType = 'module'
      capsuleName = `${slugify(config.project?.name ?? 'project')}-${args.module}`
      capsuleData = {
        type: 'knowledge-capsule',
        system: `${config.project?.name ?? 'unknown'}/${args.module}`,
        version: 1,
        updated_at: new Date().toISOString().split('T')[0],
        owner: mod.owner ?? 'unknown',
        source_project: config.project?.name ?? 'unknown',
        purpose: mc ? firstParagraph(mc) : '',
        responsibilities: [],
        capabilities: mod.capabilities ?? [],
        contracts: [],
        dependencies: [],
        knownRisks: [],
        owners: mod.owner ? [mod.owner] : [],
      }
    } else if (role === 'module') {
      const mc = readText(root, 'knowledge/tech/module/module-context.md') ?? readText(root, 'knowledge/module/module-context.md')
      if (!mc) warnings.push('module-context.md not found.')
      if (mc && isPlaceholder(mc)) warnings.push('module-context.md contains placeholder sections.')
      const modId = config.module?.id ?? args.module
      capsuleType = 'module'
      capsuleName = slugify(modId)
      capsuleData = {
        type: 'knowledge-capsule',
        system: `${config.multirepo?.parent_system ?? 'unknown'}/${modId}`,
        version: 1,
        updated_at: new Date().toISOString().split('T')[0],
        purpose: mc ? firstParagraph(mc) : '',
        responsibilities: [],
        capabilities: [],
        contracts: [],
        dependencies: [],
        knownRisks: [],
        owners: [],
      }
    } else {
      return fail('Cannot export module capsule: project role is neither core nor module.')
    }
  } else if (args.scope === 'system') {
    if (role !== 'core') return fail('--scope system can only be used from a core repository.')
    const descriptor = loadModulesDescriptor(root)
    const responsibilities: string[] = []
    for (const m of (descriptor.modules ?? [])) {
      const rp = moduleRepoPath(m)
      const mcRelPath = resolveModuleContextPath(root, rp)
      const mc = readModuleFile(root, rp, mcRelPath)
      responsibilities.push(mc ? `[${m.id}] ${firstParagraph(mc) || m.name || m.id}` : `[${m.id}] ${m.name || m.id} (no module-context)`)
    }
    capsuleType = 'system'
    capsuleName = `${slugify(config.project?.name ?? 'project')}-system`
    capsuleData = {
      type: 'knowledge-capsule',
      system: config.project?.name ?? 'unknown',
      version: 1,
      updated_at: new Date().toISOString().split('T')[0],
      purpose: '',
      responsibilities,
      capabilities: [],
      contracts: [],
      dependencies: [],
      knownRisks: [],
      owners: [],
    }
  } else {
    if (role === 'module') {
      const mc = readText(root, 'knowledge/tech/module/module-context.md') ?? readText(root, 'knowledge/module/module-context.md')
      if (!mc) warnings.push('module-context.md not found.')
      if (mc && isPlaceholder(mc)) warnings.push('module-context.md contains placeholder sections.')
      const modId = config.module?.id ?? 'module'
      capsuleType = 'module'
      capsuleName = slugify(modId)
      capsuleData = {
        type: 'knowledge-capsule',
        system: `${config.multirepo?.parent_system ?? 'unknown'}/${modId}`,
        version: 1,
        updated_at: new Date().toISOString().split('T')[0],
        purpose: mc ? firstParagraph(mc) : '',
        responsibilities: [],
        capabilities: [],
        contracts: [],
        dependencies: [],
        knownRisks: [],
        owners: [],
      }
    } else {
      capsuleType = 'project'
      capsuleName = slugify(config.project?.name ?? 'project')
      capsuleData = {
        type: 'knowledge-capsule',
        system: config.project?.name ?? 'unknown',
        version: 1,
        updated_at: new Date().toISOString().split('T')[0],
        purpose: '',
        responsibilities: [],
        capabilities: [],
        contracts: [],
        dependencies: [],
        knownRisks: [],
        owners: [],
      }
    }
  }

  const jsonPath = `.kaddo/exports/${capsuleName}.capsule.json`
  const mdPath = `.kaddo/exports/${capsuleName}.capsule.md`
  const jsonContent = JSON.stringify(capsuleData, null, 2) + '\n'
  const mdContent = renderCapsuleMd(capsuleData)

  writeDerived(root, jsonPath, jsonContent)
  writeDerived(root, mdPath, mdContent)

  return ok({ exported: true, type: capsuleType, module: args.module ?? undefined, paths: { json: jsonPath, md: mdPath }, warnings })
}

// --- Tool 7: kaddo_modules_discover ------------------------------------------

export function modulesDiscoverTool(root: string, args: { apply?: boolean; confirm?: boolean }): ToolResult {
  const config = loadConfig(root)
  if (!config) return fail('No Kaddo config found.')
  if (!isCore(config)) return fail('Module discovery is only available from a core repository.')

  const sysName = (config as { system?: { name?: string } }).system?.name ?? config.project?.name ?? ''
  const workspaceRoots: string[] = (config as { multirepo?: { workspace_roots?: string[] } }).multirepo?.workspace_roots ?? ['..']

  const IGNORED = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', 'vendor', '.next', 'out', 'tmp', 'temp', '.kaddo'])
  const coreAbs = path.resolve(root)
  const discovered: Array<{ id: string; path: string; status: string; eligibleForMapping: boolean; parentSystem?: string; warning?: string }> = []

  for (const wr of workspaceRoots) {
    const rootAbs = path.resolve(root, wr)
    if (!fs.existsSync(rootAbs) || !fs.statSync(rootAbs).isDirectory()) continue
    let entries: string[]
    try { entries = fs.readdirSync(rootAbs) } catch { continue }

    for (const entry of entries) {
      if (IGNORED.has(entry)) continue
      const candidateAbs = path.resolve(rootAbs, entry)
      if (!fs.statSync(candidateAbs).isDirectory()) continue
      if (candidateAbs === coreAbs) continue

      const relPath = path.relative(root, candidateAbs).replace(/\\/g, '/')
      const cfgPath = path.join(candidateAbs, '.kaddo', 'config.yml')
      if (!fs.existsSync(cfgPath)) {
        discovered.push({ id: entry, path: relPath, status: 'not_configured', eligibleForMapping: false })
        continue
      }
      let parsed: ConfigYaml | null = null
      try { parsed = parseYaml(fs.readFileSync(cfgPath, 'utf-8')) as ConfigYaml } catch { /* */ }
      const role = parsed?.project?.role ?? parsed?.multirepo?.role
      if (role !== 'module') {
        discovered.push({ id: entry, path: relPath, status: 'invalid', eligibleForMapping: false, warning: 'Not configured as module.' })
        continue
      }
      const modParent = parsed?.multirepo?.parent_system ?? ''
      if (modParent && modParent !== sysName) {
        discovered.push({ id: parsed?.module?.id ?? entry, path: relPath, status: 'foreign_system', eligibleForMapping: false, parentSystem: modParent })
        continue
      }
      discovered.push({ id: parsed?.module?.id ?? entry, path: relPath, status: 'configured', eligibleForMapping: true })
    }
  }

  if (args.apply) {
    if (!args.confirm) {
      return ok({ discovered, applied: false, message: 'Set confirm: true to apply discovered modules.' })
    }
    const descriptor = loadModulesDescriptor(root)
    for (const d of discovered.filter((dd) => dd.eligibleForMapping)) {
      if (!(descriptor.modules ?? []).some((m) => m.id === d.id)) {
        if (!descriptor.modules) descriptor.modules = []
        descriptor.modules.push({ id: d.id, name: d.id, path: d.path, parent_system: sysName, status: 'configured' })
      }
    }
    const ymlContent = stringifyYaml({ version: descriptor.version ?? 1, system: sysName, workspace_roots: workspaceRoots, modules: descriptor.modules ?? [] })
    writeDerived(root, '.kaddo/modules.yml', ymlContent)
    return ok({ discovered, applied: true })
  }

  return ok({ discovered, applied: false })
}

function renderCapsuleMd(data: Record<string, unknown>): string {
  const fm = ['---', `type: knowledge-capsule`, `system: ${data.system}`, `version: ${data.version}`, `updated_at: ${data.updated_at}`, '---', ''].join('\n')
  const list = (items: unknown[]) => items.length === 0 ? '_To be completed._' : items.map((i) => `- ${i}`).join('\n')
  return [
    fm,
    `# ${data.system} — Knowledge Capsule\n`,
    `## Purpose\n\n${data.purpose || '_To be completed._'}\n`,
    `## Responsibilities\n\n${list(data.responsibilities as unknown[])}\n`,
    `## Capabilities\n\n${list(data.capabilities as unknown[])}\n`,
    `## Contracts\n\n${list(data.contracts as unknown[])}\n`,
    `## Dependencies\n\n${list(data.dependencies as unknown[])}\n`,
    `## Known Risks\n\n${list(data.knownRisks as unknown[])}\n`,
    `## Owners\n\n${list(data.owners as unknown[])}\n`,
    '> Security: this capsule must never contain secrets, tokens, credentials, PII or source code.\n',
  ].join('\n')
}
