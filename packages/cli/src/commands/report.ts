import { cwd, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import { buildImpactReport, renderImpactMarkdown, serializeImpactJson } from '../core/impact-report.js'

type ReportOpts = { json?: boolean; output?: string; scope?: string }

/** `kaddo report impact` (alias `kaddo impact`) — deterministic knowledge impact report. */
export function runReportImpact(opts: ReportOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)

  // Impact reports default to `all` (accumulated knowledge impact); `--scope active` is explicit.
  const scope = opts.scope === 'active' ? 'active' : opts.scope === 'all' ? 'all' : undefined
  const report = buildImpactReport(dir, { scope })
  const content = opts.json ? serializeImpactJson(report) : renderImpactMarkdown(report)

  // Default: print to stdout, write nothing. Only write when --output is given (AC17).
  if (opts.output) {
    intro('kaddo report impact')
    const rel = opts.output
    writeFile(join(dir, rel), content)
    log.success(`Wrote ${rel.replace(/\\/g, '/')}`)
    printCommandFooter('report impact')
    outro('Impact report written.')
    return
  }

  console.log(content)
}
