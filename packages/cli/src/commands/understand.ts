import { writeFile, exists, join, cwd } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { loadConfig, ConfigError } from '../core/config.js'
import { buildContextPack, serializeContextPackJson } from '../core/context-pack.js'
import { renderContextPack } from '../templates/context-pack-template.js'
import { buildUnderstandPlan } from '../core/understand.js'
import { renderUnderstand, renderUnderstandTerminal } from '../templates/understand-template.js'
import { knowledgeLayers, currentPhase } from '../core/layers.js'
import { roadmapHasUnmaterializedCandidates } from '../core/knowledge-discovery.js'
import { AGENT_GROUPS, type AgentGroup } from '../agents/groups.js'
import { activeWorkItems, renderDeliveryLifecycle } from '../core/delivery.js'

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

  // 5b. Contextual recommendation: current phase + concrete next steps for it.
  const phase = currentPhase(knowledgeLayers(dir))
  const group = phase.toLowerCase() as AgentGroup
  const groupAgents = (AGENT_GROUPS[group] ?? []).map((a) => a.replace(/\.md$/, ''))
  const NEXT_STEPS: Record<AgentGroup, string[]> = {
    business: ['Use business-agent → refine knowledge/business/business.md'],
    product: [
      'Use bootstrap-agent → refine knowledge/product/product.md',
      'Use capability-agent → knowledge/product/capabilities.md',
    ],
    tech: [
      'Use architecture-agent → knowledge/tech/current-state.md (reality)',
      'Use codebase-agent → knowledge/tech/codebase.md (intent)',
      'Record decisions as ADRs in knowledge/tech/decisions/',
    ],
    delivery: [
      'Use roadmap-agent → knowledge/delivery/roadmap.md',
      'Run `kaddo create --from roadmap`, then `kaddo owners suggest`',
    ],
    utilities: ['Use legacy-agent to surface risks and unknowns'],
  }
  // Embedded Work Items: roadmap has candidates but none are materialized yet.
  if (roadmapHasUnmaterializedCandidates(dir)) {
    console.log('')
    console.log('The roadmap has Work Item candidates that are not materialized yet.')
    console.log('  → Run `kaddo create --from roadmap`, or use the work-item-agent to')
    console.log('    materialize them into knowledge/delivery/work-items/.')
  }

  console.log('')
  console.log(`Current phase: ${phase}`)
  console.log('Recommended next steps:')
  console.log('  1. Run `kaddo scan`   (technical signals → knowledge/inventory.md)')
  console.log('  2. Run `kaddo context`  (package knowledge for your LLM)')
  let n = 3
  for (const step of NEXT_STEPS[group] ?? []) console.log(`  ${n++}. ${step}`)
  if (groupAgents.length > 0) {
    console.log(`Agents for this phase: ${groupAgents.join(', ')}`)
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

  outro('Handoff ready. CLI prepares context — your LLM creates the understanding.')
}
