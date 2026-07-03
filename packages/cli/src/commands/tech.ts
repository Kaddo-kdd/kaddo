import fs from 'fs'
import { cwd, exists, ensureDir, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'

// Discovery artifacts that belong under knowledge/tech/discovery/ (VS-075.2). Core files
// (current-state.md, codebase.md) and decisions/ are never touched.
const DISCOVERY_FILES = ['architecture-notes.md', 'decision-candidates.md']
const DISCOVERY_DIR = 'knowledge/tech/discovery'

/**
 * `kaddo tech organize` — move discovery artifacts from `knowledge/tech/` into
 * `knowledge/tech/discovery/`. Deterministic: never overwrites, never changes content, never touches
 * core files, decisions/ or code. No LLM, no git.
 */
export function runTechOrganize(dir: string = cwd()): void {
  requireConfig(dir)
  intro('kaddo tech organize')

  const moved: string[] = []
  const skipped: string[] = []

  for (const file of DISCOVERY_FILES) {
    const from = join(dir, 'knowledge/tech', file)
    const to = join(dir, DISCOVERY_DIR, file)
    if (!exists(from)) continue
    if (exists(to)) {
      skipped.push(file)
      continue
    }
    ensureDir(join(dir, DISCOVERY_DIR))
    fs.renameSync(from, to) // move; content is never modified
    moved.push(`knowledge/tech/${file} → ${DISCOVERY_DIR}/${file}`)
  }

  if (moved.length > 0) {
    log.success('Moved:')
    for (const m of moved) console.log(`  - ${m}`)
  }
  for (const file of skipped) {
    log.warn(`Cannot move ${file} because knowledge/tech/discovery/${file} already exists. Review both files manually.`)
  }
  if (moved.length === 0 && skipped.length === 0) {
    log.info('Nothing to organize — no discovery files in the legacy `knowledge/tech/` root.')
  }

  printCommandFooter('tech organize')
  outro('Tech knowledge organized.')
}
