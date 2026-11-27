// WI-096 (EP-001 / INI-001, candidate AUD-C3) — resolve a user's selection into a validated AuditScope
// (WI-090) for the audit flow. Pure and read-only: it turns "whole project / these modules / these paths"
// into the scope the orchestrator (WI-092) consumes, validating module ids against the Discover inventory
// (WI-091).
//
// Honest by construction: an unknown module is an ERROR that lists the valid modules — never a silent
// downgrade to auditing the whole project. Modules and paths are mutually exclusive (an ambiguous selection
// is an error). Deterministic: the same selection yields the same scope with stable ordering.

import type { AuditScope } from './audit.js'
import type { DiscoveredModuleRef } from './audit-correlation.js'

export type ScopeSelection = {
  /** Explicitly audit the whole project. Ignored when modules or paths are given. */
  project?: boolean
  /** Module ids to audit (matched by package name or short id). */
  modules?: string[]
  /** Path globs to audit. */
  paths?: string[]
}

/** The short id of a module: the last segment of its path, or of its package name. */
function shortIds(m: DiscoveredModuleRef): string[] {
  const fromPath = m.path.replace(/\\/g, '/').split('/').filter(Boolean).pop()
  const fromName = m.name.split('/').filter(Boolean).pop()
  return [m.name, fromPath, fromName].filter((x): x is string => Boolean(x))
}

/**
 * Resolve a selection into an AuditScope. Pure. Precedence is explicit and mutually exclusive: paths or
 * modules or (default) the whole project. An unknown module throws, listing the valid modules.
 */
export function resolveAuditScope(selection: ScopeSelection, modules: DiscoveredModuleRef[]): AuditScope {
  const hasModules = (selection.modules?.length ?? 0) > 0
  const hasPaths = (selection.paths?.length ?? 0) > 0

  if (hasModules && hasPaths) {
    throw new Error('Ambiguous audit scope: specify modules or paths, not both.')
  }

  if (hasPaths) {
    const paths = [...new Set(selection.paths!.map((p) => p.replace(/\\/g, '/').trim()).filter(Boolean))].sort()
    return { kind: 'paths', paths }
  }

  if (hasModules) {
    const valid = modules.map((m) => m.name).sort()
    const canonical: string[] = []
    for (const id of selection.modules!) {
      const key = id.trim()
      const match = modules.find((m) => shortIds(m).includes(key))
      if (!match) {
        throw new Error(`Unknown module "${id}". Valid modules: ${valid.length ? valid.join(', ') : '(none)'}.`)
      }
      canonical.push(match.name)
    }
    return { kind: 'module', modules: [...new Set(canonical)].sort() }
  }

  return { kind: 'project' }
}
