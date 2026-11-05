import { getWorkItemCollaboration, getInitiativeCollaboration, getEpicCollaboration, getPlanCollaboration, WorkItemNotFoundError } from '@kaddo/cli/core'
import type { ToolResult } from './tools.js'

/** Bounded, read-only evidence. It never changes responsibility or Git state. */
export async function getWorkItemCollaborationTool(root: string, id: string): Promise<ToolResult> {
  try {
    return { ok: true, data: await getWorkItemCollaboration(root, id) }
  } catch (err) {
    return { ok: false, message: err instanceof WorkItemNotFoundError ? err.message : (err instanceof Error ? err.message : String(err)) }
  }
}

export async function getPlanningCollaborationTool(root: string, kind: 'initiative' | 'epic' | 'plan', id: string): Promise<ToolResult> {
  try {
    const read = kind === 'initiative' ? getInitiativeCollaboration : kind === 'epic' ? getEpicCollaboration : getPlanCollaboration
    return { ok: true, data: await read(root, id) }
  } catch (err) { return { ok: false, message: err instanceof Error ? err.message : String(err) } }
}
