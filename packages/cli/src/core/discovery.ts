// WI-091 (EP-001 / INI-001, candidate AUD-C2) — the Discover step of the audit flow: a pure, read-only
// inventory of the project's stack, modules, dependencies, configuration and existing knowledge. It is the
// factual base the orchestrator (AUD-C4) and correlation (AUD-C6) build on, and it derives from the
// committed project manifests (pnpm-workspace.yaml / package.json), never from .kaddo/ derived files.
//
// Honest by construction: anything it cannot read is recorded in `limitations`, never silently dropped
// (same principle as the AuditRun contract, WI-090). It only locates and references knowledge artifacts —
// semantic correlation is AUD-C6, not here. No LLM, no network. It never writes canonical knowledge.

import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { parse as parseYaml } from 'yaml'
import { scan } from '../services/scanner.js'
import { discoverKnowledge } from '../services/knowledge-artifacts.js'

export type DiscoveredStack = {
  /** Primary language detected at the root (typescript, javascript, …). */
  language: string
  /** Package manager detected from lockfiles/manifests (pnpm, npm, …). */
  packageManager: string
  /** True when a workspace/monorepo layout was detected (pnpm-workspace.yaml or package.json workspaces). */
  workspace: boolean
}

export type DiscoveredModule = {
  /** Package name from the module's package.json (falls back to the directory name). */
  name: string
  /** POSIX path to the module directory, relative to the project root. */
  path: string
  /** Coarse role inferred from the path (e.g. "packages", "apps") — advisory, never authoritative. */
  role: string
}

export type ModuleDependencies = {
  dependencies: string[]
  devDependencies: string[]
}

/** Dependencies keyed by module path (plus the literal "." for the root manifest). */
export type DiscoveredDependencies = Record<string, ModuleDependencies>

export type DiscoveredConfigs = {
  /** Each flag reports PRESENCE of a config, detected from files — never inferred. */
  typescript: boolean
  lint: boolean
  test: boolean
  ci: boolean
}

export type KnowledgeRef = {
  type: string
  id: string
  /** POSIX path relative to the project root. */
  path: string
  /** Knowledge layer (business, product, tech, delivery, …). */
  layer: string
}

export type ProjectDiscovery = {
  /** POSIX path of the discovered project root. */
  root: string
  createdAt: string
  stack: DiscoveredStack
  modules: DiscoveredModule[]
  dependencies: DiscoveredDependencies
  configs: DiscoveredConfigs
  /** Light references to existing knowledge artifacts (located, not semantically parsed). */
  knowledge: KnowledgeRef[]
  /** Everything that could not be read (an unreadable/invalid manifest, a missing file). Never silent. */
  limitations: string[]
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

function relPosix(root: string, abs: string): string {
  return toPosix(path.relative(root, abs)) || '.'
}

/** Read and JSON-parse a package.json; on failure push a limitation and return null. */
function readPackageJson(file: string, limitations: string[], label: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>
  } catch {
    limitations.push(`Could not read ${label} (${toPosix(file)}).`)
    return null
  }
}

/** The workspace package globs, from pnpm-workspace.yaml or package.json `workspaces`. */
function workspaceGlobs(dir: string, limitations: string[]): string[] {
  const pnpmFile = path.join(dir, 'pnpm-workspace.yaml')
  if (fs.existsSync(pnpmFile)) {
    try {
      const doc = parseYaml(fs.readFileSync(pnpmFile, 'utf8')) as { packages?: unknown }
      if (Array.isArray(doc?.packages)) return doc.packages.filter((p): p is string => typeof p === 'string')
      return []
    } catch {
      limitations.push('Could not parse pnpm-workspace.yaml.')
      return []
    }
  }
  const rootPkg = readPackageJson(path.join(dir, 'package.json'), limitations, 'root package.json')
  const ws = rootPkg?.workspaces
  if (Array.isArray(ws)) return ws.filter((p): p is string => typeof p === 'string')
  if (ws && typeof ws === 'object' && Array.isArray((ws as { packages?: unknown }).packages)) {
    return ((ws as { packages: unknown[] }).packages).filter((p): p is string => typeof p === 'string')
  }
  return []
}

function roleFromPath(relDir: string): string {
  const first = relDir.split('/')[0]
  return first && first !== '.' ? first : 'root'
}

/** Resolve workspace module directories (those containing a package.json) from the workspace globs. */
function discoverModules(dir: string, globs: string[], limitations: string[]): DiscoveredModule[] {
  if (globs.length === 0) return []
  // Each workspace glob points at module directories; append package.json to match actual packages.
  // Do not allow workspace patterns to make discovery read outside the project.
  // Restrict the grammar as well as '..': glob brace/extglob expansion can otherwise
  // synthesize traversal after a simple path check.
  const safeGlobs = globs.filter((g) => {
    const candidate = g.startsWith('!') ? g.slice(1) : g
    const safe = candidate.length > 0 && /^[A-Za-z0-9_@./*\-]+$/.test(candidate)
      && !candidate.includes('..') && !path.posix.isAbsolute(candidate) && !path.win32.isAbsolute(candidate)
    if (!safe) limitations.push('Ignored an unsafe or unsupported workspace pattern.')
    return safe
  })
  const patterns = safeGlobs.map((g) => `${g.replace(/\/+$/, '')}/package.json`)
  let matches: string[] = []
  try {
    matches = fg.sync(patterns, { cwd: dir, dot: false, onlyFiles: true, followSymbolicLinks: false })
  } catch {
    limitations.push('Could not expand workspace globs.')
    return []
  }
  const modules: DiscoveredModule[] = []
  for (const rel of matches.sort()) {
    const pkg = readPackageJson(path.join(dir, rel), limitations, `module manifest ${rel}`)
    const relDir = toPosix(path.dirname(rel))
    modules.push({
      name: typeof pkg?.name === 'string' ? (pkg.name as string) : path.basename(relDir),
      path: relDir,
      role: roleFromPath(relDir),
    })
  }
  return modules
}

function depNames(pkg: Record<string, unknown> | null, key: string): string[] {
  const d = pkg?.[key]
  if (!d || typeof d !== 'object') return []
  return Object.keys(d as Record<string, unknown>).sort()
}

function detectConfigs(dir: string): DiscoveredConfigs {
  const any = (names: string[]) => names.some((n) => fs.existsSync(path.join(dir, n)))
  return {
    typescript: any(['tsconfig.json', 'tsconfig.base.json']),
    lint: any(['.eslintrc', '.eslintrc.json', '.eslintrc.cjs', '.eslintrc.js', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'biome.json']),
    test: any(['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs', 'jest.config.js', 'jest.config.ts', 'playwright.config.ts']),
    ci: fs.existsSync(path.join(dir, '.github', 'workflows')),
  }
}

function knowledgeRefs(dir: string, limitations: string[]): KnowledgeRef[] {
  try {
    return discoverKnowledge(dir).map((a) => ({
      type: a.type,
      id: a.id,
      path: a.relPath,
      layer: a.layer,
    }))
  } catch {
    limitations.push('Could not inventory knowledge/ artifacts.')
    return []
  }
}

/**
 * Discover the project's factual inventory: stack, workspace modules, dependencies, configuration presence
 * and existing-knowledge references. Pure and read-only; `createdAt` must be supplied by the caller so the
 * result is deterministic and testable.
 */
export function discoverProject(dir: string, opts: { createdAt?: string } = {}): ProjectDiscovery {
  const limitations: string[] = []
  const scanResult = scan(dir)
  const globs = workspaceGlobs(dir, limitations)
  const modules = discoverModules(dir, globs, limitations)

  const dependencies: DiscoveredDependencies = {}
  const rootPkg = readPackageJson(path.join(dir, 'package.json'), limitations, 'root package.json')
  dependencies['.'] = { dependencies: depNames(rootPkg, 'dependencies'), devDependencies: depNames(rootPkg, 'devDependencies') }
  for (const m of modules) {
    const pkg = readPackageJson(path.join(dir, m.path, 'package.json'), limitations, `module manifest ${m.path}/package.json`)
    dependencies[m.path] = { dependencies: depNames(pkg, 'dependencies'), devDependencies: depNames(pkg, 'devDependencies') }
  }

  return {
    root: toPosix(path.resolve(dir)),
    createdAt: opts.createdAt ?? new Date().toISOString(),
    stack: {
      language: scanResult.language,
      packageManager: scanResult.packageManager,
      workspace: modules.length > 0 || globs.length > 0,
    },
    modules,
    dependencies,
    configs: detectConfigs(dir),
    knowledge: knowledgeRefs(dir, limitations),
    limitations,
  }
}

/** Recursively sort object keys so JSON output is deterministic at every level (never drops fields). */
function sortDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortDeep)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(o).sort()) out[k] = sortDeep(o[k])
    return out
  }
  return v
}

/** Deterministic JSON for a ProjectDiscovery (stable key order) so serialization round-trips and diffs cleanly. */
export function serializeDiscovery(discovery: ProjectDiscovery): string {
  return JSON.stringify(sortDeep(discovery), null, 2) + '\n'
}

export function parseDiscovery(json: string): ProjectDiscovery {
  const data = JSON.parse(json) as ProjectDiscovery
  if (!data || typeof data.root !== 'string' || !Array.isArray(data.modules)) {
    throw new Error('Invalid ProjectDiscovery JSON: missing root or modules.')
  }
  return data
}
