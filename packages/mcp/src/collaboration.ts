import { getWorkItemCollaboration, WorkItemNotFoundError } from '@kaddo/cli/core'
import type { ToolResult } from './tools.js'

/** Bounded, read-only evidence. It never changes responsibility or Git state. */
export async function getWorkItemCollaborationTool(root: string, id: string): Promise<ToolResult> {
  try {
    return { ok: true, data: await getWorkItemCollaboration(root, id) }
  } catch (err) {
    return { ok: false, message: err instanceof WorkItemNotFoundError ? err.message : (err instanceof Error ? err.message : String(err)) }
  }
}
