import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createWorkItem, getWorkItemForEdit, updateWorkItem, completeWorkItem, transitionWorkItem } from '../src/core/work-item-write.js'
import { persistConsent } from '../src/core/telemetry-consent.js'
import { setTelemetryEventObserver } from '../src/core/telemetry.js'
import type { TelemetryEvent } from '../src/core/telemetry-events.js'

const dirs: string[] = []
function project(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-lifecycle-'))
  dirs.push(dir); fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo', 'config.yml'), 'project:\n  name: test\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  persistConsent(dir, 'enabled'); return dir
}
const tick = () => new Promise(resolve => setTimeout(resolve, 20))
afterEach(() => { setTelemetryEventObserver(); for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }) })

describe('WI-084 lifecycle telemetry', () => {
  it('persists create, two refinements and completion without duplicate events', async () => {
    const dir = project(); const events: TelemetryEvent[] = []; setTelemetryEventObserver(e => events.push(e))
    const oldFetch = globalThis.fetch; globalThis.fetch = (async () => { throw new Error('offline') }) as typeof fetch
    try {
      const created = createWorkItem(dir, { intent: 'Lifecycle telemetry', type: 'feature' })
      await tick(); expect(events.filter(e => e.event === 'work_item_created')).toHaveLength(1)
      let edit = getWorkItemForEdit(dir, created.id)
      const first = { ...edit, title: 'Lifecycle telemetry refined' }
      updateWorkItem(dir, created.id, first, edit.revision); await tick()
      edit = getWorkItemForEdit(dir, created.id)
      const second = { ...edit, summary: 'second refinement' }
      updateWorkItem(dir, created.id, second, edit.revision); await tick()
      edit = getWorkItemForEdit(dir, created.id)
      updateWorkItem(dir, created.id, edit, edit.revision); await tick()
      const ready = transitionWorkItem(dir, created.id, 'ready', edit.revision)
      transitionWorkItem(dir, created.id, 'in-progress', ready.revision)
      completeWorkItem(dir, created.id, 'Completed through Core'); await tick()
      expect(events.map(e => e.event)).toEqual(['work_item_created', 'work_item_refined', 'work_item_refined', 'work_item_completed'])
      const ids = events.map(e => e.schemaVersion === '1.1' ? e.properties.workItemIdAnon : undefined)
      expect(new Set(ids).size).toBe(1)
      expect(events.every(e => e.schemaVersion === '1.1' && e.properties.workItemType === 'feature' && e.properties.knowledgeLevel)).toBe(true)
      const completed = fs.readdirSync(path.join(dir, 'knowledge/delivery/work-items/completed'))[0]
      expect(fs.readFileSync(path.join(dir, 'knowledge/delivery/work-items/completed', completed), 'utf8')).toContain('Completed through Core')
    } finally { globalThis.fetch = oldFetch }
  })
})
