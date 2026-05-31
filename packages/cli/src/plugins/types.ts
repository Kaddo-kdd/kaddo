export type PluginSignalSeverity = 'info' | 'warn' | 'critical'

export type PluginSignal = {
  plugin: string
  file: string
  message: string
  severity: PluginSignalSeverity
}

export type KaddoPlugin = {
  name: string
  description: string
  detect(touchedFiles: string[], readFile: (path: string) => string | null): PluginSignal[]
}
