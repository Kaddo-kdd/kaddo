import crypto from 'node:crypto'
import { KADDO_VERSION } from './version.js'

/** Collector 1.1 source catalogue; UI adapters report as adapter. */
export type TelemetryInterface = 'cli' | 'mcp' | 'power' | 'adapter' | 'unknown'

/** Events accepted by collector 1.1. Version 1.0 remains only for buffered records. */
export type KnownTelemetryEvent =
  | 'command_executed' | 'work_item_created' | 'work_item_refined'
  | 'work_item_completed' | 'project_technologies_detected' | 'ai_interaction'
  | 'work_item_ready' | 'handoff_generated' | 'verification_completed'
  | 'knowledge_generated' | 'knowledge_updated' | 'capsule_exported' | 'capsule_imported'

export type LegacyTelemetryEvent = Exclude<KnownTelemetryEvent, 'work_item_refined' | 'project_technologies_detected' | 'ai_interaction'>

const COMMANDS = new Set([
  'init', 'scan', 'bootstrap', 'create', 'ready', 'start', 'learn', 'verify',
  'context', 'explain', 'understand', 'guard', 'report', 'impact', 'drift',
  'savings', 'questions', 'knowledge', 'capsule', 'work-item', 'plan', 'epic',
  'initiative', 'resources', 'deprecation', 'topology', 'modules', 'collaboration',
])
const LABEL = /^[a-z0-9][a-z0-9._-]{0,63}$/

export type TelemetryProperties = {
  command?: string; durationMs?: number; projectContext?: true
  workItemIdAnon?: string; workItemType?: string; knowledgeLevel?: string
  languages?: string[]; frameworks?: string[]; runtimes?: string[]; clouds?: string[]
  provider?: string; model?: string; inputTokens?: number; outputTokens?: number; totalTokens?: number
  usageSource?: 'observed' | 'reported' | 'estimated'; tokenReportingCapable?: boolean; synthetic?: boolean
}

export type TelemetryEventV11 = {
  schemaVersion: '1.1'; id: string; timestamp: string; event: KnownTelemetryEvent
  installationId: string; source: TelemetryInterface; kaddoVersion: string; projectId?: string
  properties: TelemetryProperties
}

/** Durable compatibility shape for records written by v1.0 clients. */
export type TelemetryEventV10 = {
  schemaVersion: '1.0'; id: string; timestamp: string; event: LegacyTelemetryEvent
  installationId: string; source: TelemetryInterface; properties: Record<string, unknown>
}

export type TelemetryEvent = TelemetryEventV11 | TelemetryEventV10

function validLabel(value: unknown): value is string {
  return typeof value === 'string' && LABEL.test(value)
}

/** Validate locally before queueing: malformed telemetry must never poison delivery. */
export function validateEvent(event: TelemetryEvent): string | null {
  if (event.schemaVersion === '1.0') return null
  if (!validLabel(event.kaddoVersion)) return 'kaddoVersion must be a public version label.'
  if (event.properties.command !== undefined && !COMMANDS.has(event.properties.command)) return 'command must be catalogued and argument-free.'
  for (const key of ['languages', 'frameworks', 'runtimes', 'clouds'] as const) {
    const values = event.properties[key]
    if (values !== undefined && (!Array.isArray(values) || !values.every(validLabel))) return `${key} contains an unallowlisted label.`
  }
  for (const key of ['provider', 'model', 'workItemType'] as const) {
    const value = event.properties[key]
    if (value !== undefined && !validLabel(value)) return `${key} contains an unallowlisted value.`
  }
  if (event.properties.knowledgeLevel !== undefined && !/^K[0-4]$/.test(event.properties.knowledgeLevel)) return 'knowledgeLevel is invalid.'
  for (const key of ['durationMs', 'inputTokens', 'outputTokens', 'totalTokens'] as const) {
    const value = event.properties[key]
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) return `${key} must be a non-negative number.`
  }
  return null
}

export function createEvent(
  name: KnownTelemetryEvent,
  installationId: string,
  source: TelemetryInterface,
  properties: TelemetryProperties,
  options: { projectId?: string; kaddoVersion?: string } = {},
): TelemetryEventV11 {
  const event: TelemetryEventV11 = {
    schemaVersion: '1.1', id: crypto.randomUUID(), timestamp: new Date().toISOString(),
    event: name, installationId, source, kaddoVersion: options.kaddoVersion ?? KADDO_VERSION,
    ...(options.projectId ? { projectId: options.projectId } : {}), properties,
  }
  const error = validateEvent(event)
  if (error) throw new Error(`Invalid telemetry event: ${error}`)
  return event
}
