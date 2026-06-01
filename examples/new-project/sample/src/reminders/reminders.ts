// Task Pilot — sample source (illustrative, not a runnable app).
// This file exists so the WI-001 `code:` glob (sample/src/reminders/**) has a target.

export interface Reminder {
  taskId: string
  remindAt: Date
  enabled: boolean
}

export function scheduleReminder(taskId: string, dueAt: Date): Reminder {
  // Remind one hour before the task is due.
  const remindAt = new Date(dueAt.getTime() - 60 * 60 * 1000)
  return { taskId, remindAt, enabled: true }
}
