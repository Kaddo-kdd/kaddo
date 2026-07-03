// The Kaddo package version, resolved at runtime so installed agent/skill metadata and status checks
// never drift from the published version (VS-074.2). Works from source (tsx/vitest) and bundled dist
// by walking up from this module to the nearest package.json that has a version.

import { fileURLToPath } from 'node:url'
import { dirname, join, parse } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

function resolveVersion(): string {
  try {
    let dir = dirname(fileURLToPath(import.meta.url))
    const root = parse(dir).root
    for (;;) {
      const pkg = join(dir, 'package.json')
      if (existsSync(pkg)) {
        const v = (JSON.parse(readFileSync(pkg, 'utf-8')) as { version?: string }).version
        if (v) return v
      }
      if (dir === root) break
      dir = dirname(dir)
    }
  } catch {
    // fall through
  }
  return '0.0.0'
}

/** The current Kaddo package version (e.g. "3.41.0"). */
export const KADDO_VERSION: string = resolveVersion()
