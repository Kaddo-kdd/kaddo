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
  console.log('')
  console.log(`Open questions detected: ${report.summary.open_questions}`)
  console.log(`Roadmap readiness: ${report.summary.roadmap_readiness === 'needs_decisions' ? 'needs decisions' : report.summary.roadmap_readiness}`)
  const list = (title: string, qs: { question: string }[]) => {
    if (qs.length === 0) return
    console.log('')
    console.log(`${title}:`)
    for (const q of qs.slice(0, 8)) console.log(`- ${q.question}`)
    if (qs.length > 8) console.log(`  …and ${qs.length - 8} more`)
  }
  list('Blocking', report.blocking_questions)
  list('Important', report.important_questions)
  list('Deferred', report.deferred_questions)
  console.log('')
  console.log('Suggested next:')
  console.log(report.recommended_next_step)
  printCommandFooter('questions')
}
