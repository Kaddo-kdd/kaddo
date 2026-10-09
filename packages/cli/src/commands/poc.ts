import { cwd } from '../utils/fs.js'
import { buildPocReportContext } from '../core/poc-report.js'

/** Prepare an LLM-neutral report handoff. This command never calls a provider or writes a report. */
export function runPocReport(opts: { json?: boolean } = {}): void {
  const report = buildPocReportContext(cwd())
  if (opts.json) { console.log(JSON.stringify(report, null, 2)); return }
  console.log('')
  console.log(`POC conclusion: ${report.conclusion}`)
  console.log(`Final report: ${report.status}`)
  if (!report.eligible) { console.log(`\n${report.handoff}\n`); process.exitCode = 1; return }
  if (report.latestReport) console.log(`Latest report: v${report.latestReport.version} (${report.latestReport.path})`)
  console.log(`Next report: ${report.nextPath}`)
  console.log(`Sources: ${report.sources.length}`)
  console.log(`\n${report.handoff}\n`)
}
