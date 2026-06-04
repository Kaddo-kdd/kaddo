// kaddo start — begin development on a Work Item (VS work-item-start-branch).
//
// Creates (and switches to) the work-item branch following the project's Git strategy, so
// you never accidentally build on the default branch. This is the only Git action Kaddo
// performs, and it is non-destructive (no commits, no history change). Kaddo NEVER commits,
// pushes or merges.

import { cwd, exists, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { isGitRepo, currentBranch, createOrSwitchBranch } from '../services/git.js'
import {
  resolveStartTarget,
  branchNameFor,
  renderDeliveryLifecycle,
} from '../core/delivery.js'

const CONFIG_PATH = '.kaddo/config.yml'
const DEFAULT_BRANCHES = new Set(['main', 'master'])

export async function runStart(id: string | undefined, dir: string = cwd()): Promise<void> {
  intro('kaddo start')

  if (!exists(join(dir, CONFIG_PATH))) {
    console.error('Kaddo is not initialized in this project.')
    console.error('Run `kaddo init` first.')
    process.exit(1)
  }

  if (!(await isGitRepo(dir))) {
    console.error('Not a Git repository. `kaddo start` needs Git to create the work-item branch.')
    process.exit(1)
  }

  const target = resolveStartTarget(dir, id)
  if ('error' in target) {
    console.error(target.error)
    process.exit(1)
  }
  const wi = target.wi

  const branch = branchNameFor(dir, wi)
  const before = await currentBranch(dir)
  if (before && DEFAULT_BRANCHES.has(before)) {
    log.info(`You are on "${before}". Creating a work-item branch so changes stay off ${before}.`)
  }

  let result
  try {
    result = await createOrSwitchBranch(dir, branch)
  } catch (err) {
    console.error(`Could not create branch "${branch}": ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  if (result.action === 'created') log.success(`Created and switched to branch "${branch}"`)
  else if (result.action === 'switched') log.success(`Switched to existing branch "${branch}"`)
  else log.info(`Already on branch "${branch}"`)

  console.log('')
  for (const line of renderDeliveryLifecycle(wi)) console.log(line)

  outro(
    'Branch ready. Implement the work item, then run scan / owners suggest / guard before ' +
      'committing. Kaddo never commits, pushes or merges — you do that.'
  )
}
