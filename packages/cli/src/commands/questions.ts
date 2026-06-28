import { cwd, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import { buildOpenQuestionsReport, renderOpenQuestionsMarkdown, serializeOpenQuestionsJson } from '../core/open-questions.js'

type QuestionsOpts = { json?: boolean; output?: string }

/** `kaddo questions` (alias `kaddo readiness`) — open-questions readiness gate (optional, not in the main flow). */
export function runQuestions(opts: QuestionsOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)

  const report = buildOpenQuestionsReport(dir)

  if (opts.output) {
    intro('kaddo questions')
    writeFile(join(dir, opts.output), opts.json ? serializeOpenQuestionsJson(report) : renderOpenQuestionsMarkdown(report))
    log.success(`Wrote ${opts.output.replace(/\\/g, '/')}`)
    printCommandFooter('questions')
    outro('Questions report written.')
    return
  }

  if (opts.json) {
    console.log(serializeOpenQuestionsJson(report))
    return
  }

  // Concise human summary (not the full Markdown report).
  const s = report.summary
  console.log('')
  console.log(`Open questions detected: ${s.open_questions}`)
  console.log(`By resolution — open: ${s.resolution.open}, resolved: ${s.resolution.resolved}, assumed: ${s.resolution.assumed}, deferred: ${s.resolution.deferred}`)
  console.log(`Roadmap readiness: ${s.roadmap_readiness === 'needs_decisions' ? 'needs decisions' : s.roadmap_readiness} (blocking open: ${s.blocking_open}, important open: ${s.important_open})`)
  const list = (title: string, qs: { question: string; resolution_note?: string }[]) => {
    if (qs.length === 0) return
    console.log('')
    console.log(`${title}:`)
    for (const q of qs.slice(0, 8)) console.log(`- ${q.question}${q.resolution_note ? ` — ${q.resolution_note}` : ''}`)
    if (qs.length > 8) console.log(`  …and ${qs.length - 8} more`)
  }
  list('Blocking (open)', report.blocking_questions.filter((q) => q.resolution_status === 'open'))
  list('Resolved', report.resolved_questions)
  list('Assumed', report.assumed_questions)
  list('Deferred', report.deferred_status_questions)
  console.log('')
  console.log('Suggested next:')
  console.log(report.recommended_next_step)
  printCommandFooter('questions')
}
