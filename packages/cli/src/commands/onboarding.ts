import { cwd, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { printCommandFooter } from '../core/command-help.js'
import { buildOnboardingReport, renderOnboardingMarkdown, serializeOnboardingJson, type OnboardingReport } from '../core/onboarding.js'

type OnboardingOpts = { json?: boolean }

function printConsole(r: OnboardingReport): void {
  const s = r.signals
  console.log('')
  console.log('Pre-AI Onboarding')
  console.log('')
  console.log(`Project: ${r.project_name}`)
  console.log(`Project type: ${r.project_type}`)
  console.log('')
  console.log('Status:')
  console.log(`  overall: ${r.status}`)
  if (r.status !== 'not-initialized' && r.status !== 'not-applicable' && r.status !== 'legacy-project') {
    console.log(`  scan: ${s.scan}`)
    console.log(`  understand: ${s.understand}`)
    console.log(`  current-state: ${s.current_state}`)
    console.log(`  codebase: ${s.codebase}`)
    console.log(`  capabilities: ${s.capabilities}`)
    console.log(`  roadmap: ${s.roadmap}`)
    console.log(`  work-items: ${s.work_items}`)
    console.log(`  adapters: ${s.adapters.length > 0 ? s.adapters.join(', ') + ' installed' : 'none installed'}`)
    console.log(`  blocking open questions: ${s.blocking_open_questions}`)
    console.log(`  assumptions: ${s.assumed_questions}`)
    console.log(`  deferred: ${s.deferred_questions}`)
  }
  console.log('')
  console.log('Recommended next step:')
  console.log(`  ${r.recommended_next_step.label}`)
}

/** `kaddo onboarding` (alias `kaddo onboard`) — diagnose a pre-AI project. Read-only, no files written. */
export function runOnboarding(opts: OnboardingOpts = {}): void {
  const dir = cwd()
  const report = buildOnboardingReport(dir)
  if (opts.json) {
    console.log(serializeOnboardingJson(report))
    return
  }
  printConsole(report)
  printCommandFooter('onboarding')
}

/** `kaddo report onboarding` — write the onboarding report under `.kaddo/reports/`. */
export function runOnboardingReport(opts: OnboardingOpts = {}): void {
  const dir = cwd()
  const report = buildOnboardingReport(dir)

  if (report.status === 'not-initialized') {
    console.error('Kaddo is not initialized here. Run `kaddo init` first.')
    return
  }

  intro('kaddo report onboarding')
  const base = '.kaddo/reports'
  writeFile(join(dir, base, 'onboarding-report.md'), renderOnboardingMarkdown(report))
  writeFile(join(dir, base, 'onboarding-report.json'), serializeOnboardingJson(report))
  log.success(`Wrote ${base}/onboarding-report.md and ${base}/onboarding-report.json`)
  log.info(`Status: ${report.status} — ${report.recommended_next_step.label}`)
  printCommandFooter('onboarding')
  outro('Onboarding report written.')
}
