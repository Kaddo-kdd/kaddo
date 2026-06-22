import { cwd, writeFile, exists, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import { buildSavingsReport, renderSavingsMarkdown, serializeSavingsJson, savingsTemplate } from '../core/savings.js'

type SavingsOpts = { json?: boolean; output?: string; scope?: string }

/** `kaddo savings` (alias `kaddo report savings`) — estimated savings report. */
export function runSavings(opts: SavingsOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)

  const scope = opts.scope === 'active' ? 'active' : opts.scope === 'all' ? 'all' : undefined
  const report = buildSavingsReport(dir, { scope })
  const content = opts.json ? serializeSavingsJson(report) : renderSavingsMarkdown(report)

  if (opts.output) {
    intro('kaddo savings')
    writeFile(join(dir, opts.output), content)
    log.success(`Wrote ${opts.output.replace(/\\/g, '/')}`)
    printCommandFooter('savings')
    outro('Savings report written.')
    return
  }

  console.log(content)
}

/** `kaddo savings init` — write an editable `.kaddo/savings.yml`. */
export function runSavingsInit(opts: { force?: boolean } = {}): void {
  const dir = cwd()
  requireConfig(dir)
  intro('kaddo savings init')

  const rel = '.kaddo/savings.yml'
  const full = join(dir, rel)
  if (exists(full) && !opts.force) {
    log.warn(`${rel} already exists. Use --force to overwrite.`)
    outro('Nothing changed.')
    return
  }
  writeFile(full, savingsTemplate())
  log.success(`Wrote ${rel}`)
  log.info('Edit the assumptions, then run `kaddo savings`.')
  outro('Savings assumptions ready.')
}
