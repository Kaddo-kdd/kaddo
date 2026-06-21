import { writeFile, exists, join, cwd } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { loadConfig, ConfigError } from '../core/config.js'
import { buildContextPack, serializeContextPackJson } from '../core/context-pack.js'
import { renderContextPack } from '../templates/context-pack-template.js'
import { buildUnderstandPlan } from '../core/understand.js'
import { renderUnderstand, renderUnderstandTerminal } from '../templates/understand-template.js'
import { activeWorkItems, renderDeliveryLifecycle } from '../core/delivery.js'
import { buildProjectExplanation } from '../core/project-explain.js'
import { assessPhase } from '../core/delivery-phase.js'
import { loadGraphHints } from '../core/graph-hints.js'
import { discoverInstalledSkills, skillsForAgents } from '../services/installed-skills.js'
import { printCommandFooter } from '../core/command-help.js'

export function runUnderstand(): void {
  const dir = cwd()

  intro('kaddo understand')

  // 1. Require an initialized project.
  let config
  try {
    config = loadConfig(dir)
  } catch (err) {
    const message = err instanceof ConfigError ? err.message : String(err)
    console.error(message)
    process.exit(1)
  }

  if (!config) {
    console.error('Kaddo is not initialized in this project.')
    console.error('Run `kaddo init` first.')
    process.exit(1)
  }

  // 2. Check the scan baseline (non-blocking — continue with an incomplete pack).
  const scanAvailable = exists(join(dir, '.kaddo', 'scan.json'))
  if (!scanAvailable) {
    log.warn('No scan baseline found. Run `kaddo scan` first for a richer context pack.')
  }

  // 3. Generate / refresh the context pack (reuse the VS-004 builder).
  const pack = buildContextPack(dir, config)
  writeFile(join(dir, '.kaddo', 'context-pack.json'), serializeContextPackJson(pack))
  writeFile(join(dir, '.kaddo', 'context-pack.md'), renderContextPack(pack))
  log.success('Refreshed .kaddo/context-pack.md')

  // 4. Build the state-aware plan and check installed agents.
  const plan = buildUnderstandPlan(dir, config)
  if (plan.missingAgents.length > 0) {
    log.warn(
      `Agents are not installed (${plan.missingAgents.map((a) => a.replace(/\.md$/, '')).join(', ')}). Run \`kaddo add agents\`.`
    )
  }

  // 5. Print the concise handoff and write the reusable guide.
  console.log(renderUnderstandTerminal(plan))
  // Knowledge language for the handoff (VS-051) — the CLI stays in English.
  console.log(`Project language: ${pack.project.language} (knowledge artifacts are written in this language)`)

  // 5b. State-aware recommendation (VS-047): phase + reason + next step from the REAL knowledge
  // state (layers, roadmap, Work Items, ownership) — not only the configured project.state.
  const exp = buildProjectExplanation(dir)
  const assessment = assessPhase(exp)
  console.log('')
  console.log(`Current phase: ${assessment.phase}`)
  if (assessment.reasons.length > 0) {
    console.log('Reason:')
    for (const r of assessment.reasons) console.log(`  - ${r}`)
  }
  if (assessment.recommendedAgents.length > 0) {
    console.log(`Recommended: ${assessment.recommendedAgents.join(', ')}`)
  }
  if (assessment.nextStep) {
    console.log(`Next step: ${assessment.nextStep}`)
  }

  // Recommended reusable skills (VS-059) for the recommended agents, if any are installed.
  const installedSkills = discoverInstalledSkills(dir)
  if (installedSkills.length > 0 && assessment.recommendedAgents.length > 0) {
    const recSkills = skillsForAgents(installedSkills, assessment.recommendedAgents)
    if (recSkills.length > 0) {
      console.log('Recommended skills:')
      for (const s of recSkills) console.log(`  - ${s}`)
    }
  }

  // 5b-ext. External Knowledge Capsules (VS-054) — remind the agent of external dependencies.
  if (exp.externalCapsules.length > 0) {
    console.log('')
    console.log('External knowledge:')
    for (const cap of exp.externalCapsules) {
      console.log(`  - ${cap.system}${cap.owner ? ` (owner: ${cap.owner})` : ''}`)
    }
    console.log('  → Review the relevant capsule before changing integration behavior with it.')
  }

  // 5b-graph. Graph hints (VS-056): only nudge during Active Delivery and only when hints affect
  // active Work Items, so the recommendation stays relevant to current work.
  const graphHints = loadGraphHints(dir)
  if (assessment.phase === 'Active Delivery' && graphHints && graphHints.activeWorkItemHints > 0) {
    console.log('')
    console.log(
      `Graph hints: ${graphHints.activeWorkItemHints} active Work Item(s) have limited graph relationships (quality: ${graphHints.quality}).`
    )
    console.log('  → Review graph hints before continuing with implementation.')
    console.log('  Suggested agent: graph-agent (see .kaddo/graph-hints.md)')
  }

  // 5c. If a Work Item is active, show the official delivery lifecycle.
  const active = activeWorkItems(dir)
  if (active.length > 0) {
    console.log('')
    for (const line of renderDeliveryLifecycle(active[0])) console.log(line)
    if (active.length > 1) {
      console.log('')
      console.log(`Other active work items: ${active.slice(1).map((w) => w.id).join(', ')}`)
    }
  }

  writeFile(join(dir, '.kaddo', 'understand.md'), renderUnderstand(plan))
  log.success('Wrote .kaddo/understand.md')

  printCommandFooter('understand')
  outro('Handoff ready. CLI prepares context — your LLM creates the understanding.')
}
