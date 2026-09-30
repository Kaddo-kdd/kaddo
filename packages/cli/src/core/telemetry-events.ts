import crypto from 'node:crypto'

export type TelemetryInterface = 'cli' | 'mcp' | 'admin' | 'agent'

export type KnownTelemetryEvent =
  | 'command_executed'
  | 'work_item_created'
  | 'work_item_ready'
  | 'work_item_completed'
  | 'handoff_generated'
  | 'verification_completed'
  | 'knowledge_generated'
  | 'knowledge_updated'
  | 'capsule_exported'
  | 'capsule_imported'

type CommandProperties = {
  command: string
  durationMs: number
  interface: TelemetryInterface
}

type LifecycleProperties = {
  interface: TelemetryInterface
}

type KnowledgeProperties = {
  layer: string
  interface: TelemetryInterface
}

type CapsuleProperties = {
  interface: TelemetryInterface
}

export type AllowlistedProperties =
  | CommandProperties
  | LifecycleProperties
  | KnowledgeProperties
  | CapsuleProperties

export type TelemetryEvent = {
  schemaVersion: '1.0'
  id: string
  timestamp: string
  event: KnownTelemetryEvent
  installationId: string
  source: TelemetryInterface
  properties: AllowlistedProperties
}

export function createEvent(
  name: KnownTelemetryEvent,
  installationId: string,
  source: TelemetryInterface,
  properties: AllowlistedProperties,
): TelemetryEvent {
  return {
    schemaVersion: '1.0',
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event: name,
    installationId,
    source,
    properties,
  }
}
