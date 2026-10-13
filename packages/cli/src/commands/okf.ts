import { cwd } from '../utils/fs.js'
import { exportOkf } from '../core/okf/export.js'
import { validateOkf } from '../core/okf/validate.js'
import { OkfExportError } from '../core/okf/types.js'
import { intro, outro, log } from '../utils/ui.js'

// Open Knowledge Format (OKF v0.2) surfaces (WI-065/WI-066). Optional interoperability: a read-only
// projection of Kaddo's canonical knowledge into a portable bundle. Kaddo stays the source of truth.

export function runOkfExport(opts: { output?: string; withReports?: boolean; withAgents?: boolean; json?: boolean } = {}, dir: string = cwd()): void {
  let res
  try {
    res = exportOkf(dir, { output: opts.output, withReports: opts.withReports, withAgents: opts.withAgents })
  } catch (e) {
    if (e instanceof OkfExportError) { console.error(`okf export refused (${e.code}): ${e.message}`); process.exit(1) }
    throw e
  }
  if (opts.json) { console.log(JSON.stringify(res, null, 2)); return }
  intro('kaddo okf export')
  log.success(`Exported ${res.conceptCount} concept(s) + ${res.indexCount} index(es) to ${res.outputDir}`)
  if (res.omitted.length > 0) log.info(`Omitted by type: ${res.omitted.map((o) => `${o.count}× ${o.type}`).join(', ')}`)
  if (res.omittedConcepts.length > 0) {
    log.warn(`Omitted ${res.omittedConcepts.length} concept(s) with potentially sensitive content:`)
    for (const o of res.omittedConcepts) console.log(`    · ${o.id} — ${o.reason}`)
  }
  for (const w of res.warnings) log.warn(w)
  outro('Review the bundle before sharing it externally (it may contain project knowledge).')
}

export function runOkfValidate(location: string | undefined, opts: { json?: boolean } = {}, dir: string = cwd()): void {
  const res = validateOkf(dir, { location })
  if (opts.json) { console.log(JSON.stringify(res, null, 2)); process.exit(res.conformant ? 0 : 1) }
  intro('kaddo okf validate')
  log.info(`Bundle: ${res.dir}`)
  log.info(`Concepts: ${res.conceptCount}`)
  console.log('')
  console.log(`Conformance errors: ${res.counts.conformance}  ·  Warnings: ${res.counts.warning}  ·  Info: ${res.counts.info}`)
  if (res.findings.length > 0) {
    console.log('')
    for (const f of res.findings) {
      const icon = f.level === 'conformance' ? '✗' : f.level === 'warning' ? '!' : '·'
      console.log(`  ${icon} [${f.level}] ${f.file ? f.file + ': ' : ''}${f.message}`)
    }
  }
  console.log('')
  if (res.conformant) outro('Bundle is OKF v0.2 conformant.')
  else { outro('Bundle has conformance errors.'); process.exit(1) }
}
