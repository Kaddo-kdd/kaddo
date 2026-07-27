// Project resolution & path safety (VS-057).
//
// The MCP server is strictly READ-ONLY and may only read files under a Kaddo project's `.kaddo/`,
// `knowledge/` and `external/` directories. It never reads source code (`src/`), VCS internals
// (`.git/`), dependencies (`node_modules/`) or build output (`dist/`, `build/`, `coverage/`), and
// it never allows path traversal outside the project root.

import fs from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'

/** Top-level directories the server is allowed to read from. */
export const ALLOWED_ROOTS = ['.kaddo', 'knowledge', 'external'] as const

/** Directories that must never be read (defense in depth — they are not in ALLOWED_ROOTS). */
export const FORBIDDEN_ROOTS = ['src', '.git', 'node_modules', 'dist', 'build', 'coverage'] as const

export class KaddoMcpError extends Error {}

/** The project root the server operates on: `KADDO_PROJECT_DIR` env, else process cwd. */
export function projectRoot(): string {
  const fromEnv = process.env.KADDO_PROJECT_DIR
  return path.resolve(fromEnv && fromEnv.trim() ? fromEnv : process.cwd())
}

export function hasKaddoConfig(root: string): boolean {
  return fs.existsSync(path.join(root, '.kaddo', 'config.yml'))
}

export function hasKnowledge(root: string): boolean {
  return fs.existsSync(path.join(root, 'knowledge'))
}

/** Standard guards used by tools/resources before doing any reads. */
export function assertKaddoProject(root: string): void {
  if (!hasKaddoConfig(root)) {
    throw new KaddoMcpError('Kaddo project not found. Run `kaddo init` first.')
  }
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

/**
 * Resolve a project-relative path safely. Rejects absolute paths, traversal that escapes the root,
 * and anything whose first segment is not an allowed root. Returns the absolute path (existence not
 * guaranteed). Throws KaddoMcpError on any violation.
 */
export function safeResolve(root: string, relPath: string): string {
  const rel = toPosix(relPath).replace(/^\/+/, '')
  if (path.isAbsolute(relPath) || rel.split('/').some((seg) => seg === '..')) {
    throw new KaddoMcpError(`Path is not allowed: ${relPath}`)
  }
  const top = rel.split('/')[0]
  if (!ALLOWED_ROOTS.includes(top as (typeof ALLOWED_ROOTS)[number])) {
    throw new KaddoMcpError(
      `Path is outside the readable Kaddo directories (${ALLOWED_ROOTS.join(', ')}): ${relPath}`
    )
  }
  const resolved = path.resolve(root, rel)
  const base = toPosix(root).replace(/\/+$/, '')
  if (resolved !== root && !toPosix(resolved).startsWith(base + '/')) {
    throw new KaddoMcpError(`Path traversal blocked: ${relPath}`)
  }
  return resolved
}

/** Read a project file (relative path) as text, or null if it does not exist. */
export function readText(root: string, relPath: string): string | null {
  const abs = safeResolve(root, relPath)
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null
  return fs.readFileSync(abs, 'utf-8')
}

/** Read + parse a project JSON file, or null if missing/invalid. */
export function readJson<T = unknown>(root: string, relPath: string): T | null {
  const raw = readText(root, relPath)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Read + parse a project YAML file, or null if missing/invalid. */
export function readYaml<T = unknown>(root: string, relPath: string): T | null {
  const raw = readText(root, relPath)
  if (raw === null) return null
  try {
    return (parseYaml(raw) ?? null) as T | null
  } catch {
    return null
  }
}

// --- Derived writes (VS-058) ---------------------------------------------
//
// Derived tools may ONLY write generated artifacts under `.kaddo/`. They can never write to
// knowledge/, src/, external/, .kaddo/external.yml or any VCS/build directory.

const DERIVED_WRITE_FILES = new Set([
  '.kaddo/context-pack.md',
  '.kaddo/context-pack.json',
  '.kaddo/explain.md',
  '.kaddo/explain.json',
  '.kaddo/understand.md',
  '.kaddo/understand.json',
  '.kaddo/graph.json',
  '.kaddo/graph.mmd',
  '.kaddo/graph-hints.md',
  '.kaddo/graph-hints.json',
  '.kaddo/modules.yml',
])

const DERIVED_EXPORTS_RE = /^\.kaddo\/exports\/[^/]+\.capsule\.(md|json)$/
const DERIVED_REPORTS_RE = /^\.kaddo\/reports\/[^/]+\.(md|json)$/

/**
 * Assert a path is an allowed derived-write target. Returns the normalized POSIX path or throws.
 * Allowed: the fixed `.kaddo/*` derived files and `.kaddo/exports/<name>.capsule.{md,json}`.
 */
export function assertMcpDerivedWritePath(relPath: string): string {
  const p = toPosix(relPath).replace(/^\/+/, '')
  if (path.isAbsolute(relPath) || p.split('/').some((seg) => seg === '..')) {
    throw new KaddoMcpError('Blocked unsafe MCP derived write path.')
  }
  if (!DERIVED_WRITE_FILES.has(p) && !DERIVED_EXPORTS_RE.test(p) && !DERIVED_REPORTS_RE.test(p)) {
    throw new KaddoMcpError('Blocked unsafe MCP derived write path.')
  }
  return p
}

/** Write a derived artifact under the project, validated by `assertMcpDerivedWritePath`. */
export function writeDerived(root: string, relPath: string, content: string): void {
  const p = assertMcpDerivedWritePath(relPath)
  const abs = path.resolve(root, p)
  const base = toPosix(root).replace(/\/+$/, '')
  if (toPosix(abs) !== base && !toPosix(abs).startsWith(base + '/')) {
    throw new KaddoMcpError('Blocked unsafe MCP derived write path.')
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content, 'utf-8')
}

/**
 * Write a Work Item file during a lifecycle transition (e.g. draft → ready).
 * Only allows writes strictly under `knowledge/delivery/work-items/`.
 */
export function writeWorkItemTransition(root: string, relPath: string, content: string): void {
  const p = toPosix(relPath).replace(/^\/+/, '')
  if (path.isAbsolute(relPath) || p.split('/').some((seg) => seg === '..')) {
    throw new KaddoMcpError('Blocked unsafe work-item write path.')
  }
  if (!p.startsWith('knowledge/delivery/work-items/')) {
    throw new KaddoMcpError('Work Item transitions can only write under knowledge/delivery/work-items/.')
  }
  if (!p.endsWith('.md')) {
    throw new KaddoMcpError('Work Item files must be markdown.')
  }
  const abs = path.resolve(root, p)
  const base = toPosix(root).replace(/\/+$/, '')
  if (toPosix(abs) !== base && !toPosix(abs).startsWith(base + '/')) {
    throw new KaddoMcpError('Blocked unsafe work-item write path.')
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content, 'utf-8')
}

/** Remove a Work Item file during a lifecycle transition (e.g. moving from draft/ to ready/). */
export function removeWorkItemFile(root: string, relPath: string): void {
  const p = toPosix(relPath).replace(/^\/+/, '')
  if (path.isAbsolute(relPath) || p.split('/').some((seg) => seg === '..')) {
    throw new KaddoMcpError('Blocked unsafe work-item remove path.')
  }
  if (!p.startsWith('knowledge/delivery/work-items/')) {
    throw new KaddoMcpError('Work Item removal can only target knowledge/delivery/work-items/.')
  }
  const abs = path.resolve(root, p)
  if (fs.existsSync(abs)) fs.unlinkSync(abs)
}

/** List files under a project-relative directory (recursively), returning project-relative paths. */
export function listFiles(root: string, relDir: string, filterExt?: string): string[] {
  let absDir: string
  try {
    absDir = safeResolve(root, relDir)
  } catch {
    return []
  }
  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) return []
  const out: string[] = []
  const walk = (abs: string) => {
    for (const entry of fs.readdirSync(abs)) {
      if (entry.startsWith('.')) continue
      const full = path.join(abs, entry)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        walk(full)
      } else if (stat.isFile() && (!filterExt || entry.endsWith(filterExt))) {
        out.push(toPosix(path.relative(root, full)))
      }
    }
  }
  walk(absDir)
  return out.sort()
}
