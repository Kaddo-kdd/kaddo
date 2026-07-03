import { cwd } from '../utils/fs.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import { buildTechDecisions } from '../core/decisions.js'

type AdrOpts = { json?: boolean }

/**
 * `kaddo adr` (alias `kaddo decisions`) — read-only handoff: list technical decision candidates and
 * the ADR files to create from them. Never writes ADRs, never marks anything accepted, no LLM, no git.
 */
export function runAdr(opts: AdrOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)

  const td = buildTechDecisions(dir)

  if (opts.json) {
    console.log(JSON.stringify(td, null, 2))
    return
  }

  console.log('')
  console.log('Tech Decisions')
  console.log(`  Decision candidates: ${td.candidates}`)
  console.log(`  ADRs: ${td.adrs} (draft: ${td.draft_adrs}, accepted: ${td.accepted_adrs})`)
  console.log(`  Status: ${td.status}`)
  if (td.candidates_source) console.log(`  Source: ${td.candidates_source}`)
  if (td.candidates_both_exist) {
    console.log('')
    console.log('  Note: both decision-candidate files exist.')
    console.log('    Using: knowledge/tech/discovery/decision-candidates.md')
    console.log('    Legacy file also found: knowledge/tech/decision-candidates.md')
  } else if (td.candidates_legacy_location) {
    console.log('  (legacy location — consider `kaddo tech organize` to move it to knowledge/tech/discovery/)')
  }

  if (td.candidate_list.length > 0 && td.adrs === 0) {
    console.log('')
    console.log('ADR candidates found:')
    td.candidate_list.forEach((c, i) => {
      console.log('')
      console.log(`${i + 1}. ${c.title}`)
      console.log(`   Source: ${c.source}`)
      console.log(`   Suggested ADR: ${c.suggestedAdrFile}`)
    })
    console.log('')
    console.log('Next:')
    console.log('  Use the adr-writing skill to create ADR drafts from these candidates')
    console.log('  (copy context + options; leave the decision/consequences as [open] for human review).')
  } else if (td.candidates === 0) {
    console.log('')
    console.log('No decision candidates found. Run the architecture-agent to produce')
    console.log('`knowledge/tech/decision-candidates.md`, or add ADRs under `knowledge/tech/decisions/`.')
  } else {
    console.log('')
    console.log('ADRs already exist. Review drafts and mark them `accepted` when confirmed.')
  }

  printCommandFooter('adr')
}
