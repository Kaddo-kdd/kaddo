import { getWorkItemCollaboration, WorkItemNotFoundError } from '../core/collaboration.js'

/** Read-only local Git evidence for a single Work Item. */
export async function runCollaborationShow(dir: string, id: string): Promise<void> {
  try {
    console.log(JSON.stringify(await getWorkItemCollaboration(dir, id), null, 2))
  } catch (err) {
    if (err instanceof WorkItemNotFoundError) {
      console.error(err.message)
      process.exitCode = 1
      return
    }
    throw err
  }
}
