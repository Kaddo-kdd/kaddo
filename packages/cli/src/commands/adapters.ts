import { cwd, exists, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import { buildCodexAdapterContext, renderAgentsMd } from '../core/codex-adapter.js'

type AdapterOpts = { force?: boolean; dryRun?: boolean }

/** `kaddo adapters install codex` (alias `kaddo export codex`) — generate AGENTS.md for Codex. */
export function runAdaptersInstall(adapter: string, opts: AdapterOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)

  if (adapter !== 'codex') {
    console.error(`Unknown adapter: "${adapter}". Available: codex.`)
    process.exit(1)
  }

  const content = renderAgentsMd(buildCodexAdapterContext(dir))

  // Preview only — write nothing.
  if (opts.dryRun) {
    console.log('# AGENTS.md preview', '')
    console.log(content)
    return
  }

  intro('kaddo adapters install codex')
  const rel = 'AGENTS.md'
  const full = join(dir, rel)
  const existed = exists(full)

  if (existed && !opts.force) {
    log.warn('AGENTS.md already exists.')
    log.info('Use `kaddo adapters install codex --force` to overwrite,')
    log.info('or `kaddo adapters install codex --dry-run` to preview.')
    outro('Nothing changed.')
    return
  }

  writeFile(full, content)
  log.success(`${existed ? 'Overwrote' : 'Created'} AGENTS.md for Codex.`)
  log.info('Source: Kaddo project knowledge. Regenerate it instead of editing by hand.')
  printCommandFooter('adapters install codex')
  outro('AGENTS.md ready.')
}
