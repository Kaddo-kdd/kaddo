// @kaddo/integrations — Integration Adapter Foundation (VS-102 + VS-103).
//
// A provider-agnostic boundary between Kaddo and external work systems. This package owns the adapter
// contract, registry, normalized models, configuration + secret-reference model, error/status model,
// import-preview mapping, secret provider abstraction and a reference (mock) adapter. It contains NO
// Work Item domain rules, Graph semantics, Knowledge rules or lifecycle rules — those stay in Kaddo
// Core, above this boundary.

export * from './contract.js'
export * from './errors.js'
export * from './identity.js'
export * from './config.js'
export * from './status.js'
export * from './preview.js'
export * from './secrets.js'
export { IntegrationRegistry, DuplicateAdapterError } from './registry.js'
export { createMockAdapter, MOCK_ADAPTER_ID, type MockSimulation } from './mock-adapter.js'
export { createJiraAdapter, JIRA_ADAPTER_ID } from './jira-adapter.js'

import { IntegrationRegistry } from './registry.js'
import { createMockAdapter } from './mock-adapter.js'
import { createJiraAdapter } from './jira-adapter.js'

/**
 * A registry pre-loaded with the reference adapters that ship with Kaddo. Concrete provider adapters
 * (github, jira, …) register themselves on top of this without any change to Core or the surfaces.
 */
export function createDefaultRegistry(): IntegrationRegistry {
  const registry = new IntegrationRegistry()
  registry.register(createMockAdapter())
  registry.register(createJiraAdapter())
  return registry
}
