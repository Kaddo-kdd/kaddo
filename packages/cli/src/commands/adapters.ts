import { cwd, exists, readFile, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import {
  buildCodexAdapterContext,
  renderAgentsMd,
  renderKaddoBlock,
  detectAgentsState,
  injectKaddoBlock,
} from '../core/codex-adapter.js'

type AdapterOpts = { force?: boolean; dryRun?: boolean; inject?: boolean }

/** `kaddo adapters install codex` (alias `kaddo export codex`) — generate/merge AGENTS.md for Codex. */
export function runAdaptersInstall(adapter: string, opts: AdapterOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)

  if (adapter !== 'codex') {
    console.error(`Unknown adapter: "${adapter}". Available: codex.`)
    process.exit(1)
  }

  const ctx = buildCodexAdapterContext(dir)
  const rel = 'AGENTS.md'
  const full = join(dir, rel)
  const existed = exists(full)
  const existing = existed ? readFile(full) : null

  // ── Inject mode (VS-065.2): add or update only the Kaddo block, preserving the rest. ──
  if (opts.inject) {
    const state = detectAgentsState(existing)
    if (state === 'invalid_kaddo_block') {
      console.error('Invalid Kaddo adapter block detected in AGENTS.md.')
      console.error('Found one marker without its pair. Fix the file manually or use --force to overwrite.')
      console.error('Nothing changed.')
      process.exit(1)
    }

    // No file yet: --inject behaves like a normal create (full projection).
    if (existing === null) {
      const content = renderAgentsMd(ctx)
      if (opts.dryRun) {
        console.log('# AGENTS.md preview', '')
        console.log(content)
        return
      }
      intro('kaddo adapters install codex --inject')
      writeFile(full, content)
      log.success('Created AGENTS.md for Codex.')
      printCommandFooter('adapters install codex')
      outro('AGENTS.md ready.')
      return
    }

    const merged = injectKaddoBlock(existing, ctx)
    if (opts.dryRun) {
      console.log('# AGENTS.md preview (inject)', '')
      console.log(merged.content)
      return
    }
    intro('kaddo adapters install codex --inject')
    writeFile(full, merged.content)
    if (merged.status === 'updated') {
      log.success('Updated existing Kaddo guidance block in AGENTS.md.')
    } else {
      log.success('Injected Kaddo guidance block into AGENTS.md.')
    }
    log.info('Content outside the Kaddo markers was preserved.')
    printCommandFooter('adapters install codex')
    outro('AGENTS.md ready.')
    return
  }

  const content = renderAgentsMd(ctx)

  // Preview only — write nothing.
  if (opts.dryRun) {
    console.log('# AGENTS.md preview', '')
    console.log(content)
    return
  }

  intro('kaddo adapters install codex')

  if (existed && !opts.force) {
    log.warn('AGENTS.md already exists.')
    log.info('Use `--inject` to add or update only the Kaddo block,')
    log.info('`--force` to overwrite, or `--dry-run` to preview.')
    outro('Nothing changed.')
    return
  }

  writeFile(full, content)
  log.success(`${existed ? 'Overwrote' : 'Created'} AGENTS.md for Codex.`)
  log.info('Source: Kaddo project knowledge. Regenerate it instead of editing by hand.')
  printCommandFooter('adapters install codex')
  outro('AGENTS.md ready.')
}

// Re-export for tests/consumers that want the raw block.
export { renderKaddoBlock }
