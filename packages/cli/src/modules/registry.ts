import { adrModule } from './adr.js'
import { incidentModule } from './incident.js'
import { rfcModule } from './rfc.js'
import { migrationModule } from './migration.js'
import { legacyModule } from './legacy.js'
import { contractsModule } from './contracts.js'
import { capabilitiesModule } from './capabilities.js'
import { guardAdvancedModule } from './guard-advanced.js'
import { agentsModule } from './agents.js'
import { skillsModule } from './skills.js'
import { standardsModule, securityModule, stackModule, gitStrategyModule } from './global-docs.js'
import type { KaddoModule, ModuleWorkItemType } from './types.js'

export const MODULES: Record<string, KaddoModule> = {
  adr: adrModule,
  incident: incidentModule,
  rfc: rfcModule,
  migration: migrationModule,
  legacy: legacyModule,
  contracts: contractsModule,
  capabilities: capabilitiesModule,
  'guard-advanced': guardAdvancedModule,
  agents: agentsModule,
  skills: skillsModule,
  standards: standardsModule,
  security: securityModule,
  stack: stackModule,
  'git-strategy': gitStrategyModule,
}

export function getModule(name: string): KaddoModule | undefined {
  return MODULES[name]
}

export function listModules(): KaddoModule[] {
  return Object.values(MODULES)
}

export function findWorkItemType(typeName: string): ModuleWorkItemType | undefined {
  for (const mod of Object.values(MODULES)) {
    const found = mod.workItemTypes.find((t) => t.name === typeName)
    if (found) return found
  }
  return undefined
}
