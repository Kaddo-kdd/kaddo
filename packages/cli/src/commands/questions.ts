import { cwd, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig, projectLanguage } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import { buildOpenQuestionsReport, renderOpenQuestionsMarkdown, serializeOpenQuestionsJson, type OpenQuestion } from '../core/open-questions.js'

type QuestionsOpts = { json?: boolean; output?: string }

/** `kaddo questions` (alias `kaddo readiness`) — open-questions readiness gate (optional, not in the main flow). */
export function runQuestions(opts: QuestionsOpts = {}): void {
  const dir = cwd()
  const config = requireConfig(dir)
  const es = projectLanguage(config) === 'es'

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
  // Detailed, actionable list: each question shows where it lives and how to update it (VS-073.3).
  const list = (title: string, qs: OpenQuestion[], opts2: { example?: boolean } = {}) => {
    if (qs.length === 0) return
    console.log('')
    console.log(`${title}:`)
    console.log('')
    qs.slice(0, 12).forEach((q, i) => {
      console.log(`${i + 1}. ${q.question}`)
      console.log(`   Source: ${q.sourcePath}:${q.line}`)
      console.log(`   Status: ${q.resolution_status}`)
      console.log(`   Severity: ${q.classification}`)
      if (q.note) console.log(`   Note: ${q.note}`)
      if (opts2.example && q.resolution_status === 'open') {
        console.log('   Suggested action:')
        console.log(`     ${es ? 'Cambia [open] por [resolved], [assumed] o [deferred].' : 'Change [open] to [resolved], [assumed] or [deferred].'}`)
        console.log('   Example:')
        console.log(`     - [assumed] ${q.question}`)
        console.log(`       - note: ${es ? '<supuesto editable para el MVP>' : '<editable assumption for the MVP>'}`)
      }
      console.log('')
    })
    if (qs.length > 12) console.log(`  …and ${qs.length - 12} more`)
  }
  list('Blocking (open)', report.blocking_questions.filter((q) => q.resolution_status === 'open'), { example: true })
  list('Important (open)', report.important_questions.filter((q) => q.resolution_status === 'open'))
  list('Resolved', report.resolved_questions)
  list('Assumed', report.assumed_questions)
  list('Deferred', report.deferred_status_questions)

  printResolutionGuide(es)

  console.log('')
  console.log('Suggested next:')
  console.log(report.recommended_next_step)
  printCommandFooter('questions')
}

/** Print the deterministic how-to-resolve guide (localized). Never edits files. */
function printResolutionGuide(es: boolean): void {
  console.log('')
  if (es) {
    console.log('Cómo resolver')
    console.log('')
    console.log('Edita el archivo indicado en Source y cambia el marcador:')
    console.log('  [open]     → sigue abierta')
    console.log('  [resolved] → respuesta confirmada')
    console.log('  [assumed]  → supuesto seguro por ahora')
    console.log('  [deferred] → decisión aplazada')
    console.log('')
    console.log('Agrega una nota debajo de la pregunta cuando sea posible:')
    console.log('  - [assumed] ¿Pregunta?')
    console.log('    - note: Se asume X para el MVP porque Y.')
  } else {
    console.log('How to resolve')
    console.log('')
    console.log('Edit the file shown in Source and change the marker:')
    console.log('  [open]     → still unresolved')
    console.log('  [resolved] → confirmed answer')
    console.log('  [assumed]  → safe assumption for now')
    console.log('  [deferred] → intentionally postponed')
    console.log('')
    console.log('Add a note below the question when possible:')
    console.log('  - [assumed] Question?')
    console.log('    - note: Assume X for the MVP because Y.')
  }
}
