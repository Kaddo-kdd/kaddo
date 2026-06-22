import { cwd, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import { buildDriftReport, renderDriftMarkdown, serializeDriftJson } from '../core/drift-report.js'

type DriftOpts = { json?: boolean; output?: string }

/** `kaddo drift` (alias `kaddo report drift`) — drift trend report from recorded guard history. */
export function runDrift(opts: DriftOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)

  const report = buildDriftReport(dir)
  const content = opts.json ? serializeDriftJson(report) : renderDriftMarkdown(report)

  if (opts.output) {
    intro('kaddo drift')
    writeFile(join(dir, opts.output), content)
    log.success(`Wrote ${opts.output.replace(/\\/g, '/')}`)
    printCommandFooter('drift')
    outro('Drift report written.')
    return
  }

  console.log(content)
}
