import { prismaPlugin } from './prisma.js'
import { openapiPlugin } from './openapi.js'
import type { KaddoPlugin, PluginSignal } from './types.js'

export type { KaddoPlugin, PluginSignal }

const AVAILABLE_PLUGINS: Record<string, KaddoPlugin> = {
  prisma: prismaPlugin,
  openapi: openapiPlugin,
}

export function getPlugin(name: string): KaddoPlugin | undefined {
  return AVAILABLE_PLUGINS[name]
}

export function listAvailablePlugins(): KaddoPlugin[] {
  return Object.values(AVAILABLE_PLUGINS)
}

export function resolvePlugins(enabledNames: string[]): KaddoPlugin[] {
  return enabledNames
    .map((name) => AVAILABLE_PLUGINS[name])
    .filter((p): p is KaddoPlugin => p !== undefined)
}

export function runPlugins(
  plugins: KaddoPlugin[],
  touchedFiles: string[],
  readFile: (path: string) => string | null
): PluginSignal[] {
  const signals: PluginSignal[] = []
  for (const plugin of plugins) {
    try {
      signals.push(...plugin.detect(touchedFiles, readFile))
    } catch {
      // plugin failure is non-fatal
    }
  }
  return signals
}
