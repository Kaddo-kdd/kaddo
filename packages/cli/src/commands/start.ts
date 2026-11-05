import { getWorkItemForEdit, transitionWorkItem, WorkItemWriteError } from '../core/work-item-write.js'
import { intro, outro, log, confirm, cancel } from '../utils/ui.js'

/** Explicit, human-confirmed ready → in-progress lifecycle transition. */
export async function runStart(id: string, opts: { yes?: boolean } = {}) {
  intro(`kaddo start ${id}`)
  let edit
  try { edit = getWorkItemForEdit(process.cwd(), id) }
  catch (error) { log.error((error as Error).message); return }
  if (edit.status !== 'ready') { log.error(`Work Item ${id} is "${edit.status}". Only ready Work Items can be started.`); return }
  if (!opts.yes && !await confirm({ message: 'Start implementation and move this Work Item to in-progress?' })) { cancel('Cancelled.'); return }
  try {
    const result = transitionWorkItem(process.cwd(), id, 'in-progress', edit.revision)
    log.success(`Updated status: ${result.status}`)
    log.success(`Moved file: ${result.path}`)
    outro(`Work Item ${id} is in progress.`)
  } catch (error) { log.error(error instanceof WorkItemWriteError ? error.message : (error as Error).message) }
}
