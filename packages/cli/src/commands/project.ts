import { cwd } from '../utils/fs.js'
import { ConfigError, loadConfig, projectMode, setProjectMode, type ProjectMode } from '../core/config.js'

export function runProjectMode(mode?: string): void {
  const dir = cwd()
  try {
    if (mode === undefined) {
      const config = loadConfig(dir)
      if (!config) throw new ConfigError('No .kaddo/config.yml found. Run `kaddo init` first.')
      console.log(`Project mode: ${projectMode(config)}`)
      return
    }
    if (mode !== 'standard' && mode !== 'poc') {
      console.error('Project mode must be `standard` or `poc`.')
      process.exitCode = 1
      return
    }
    setProjectMode(dir, mode as ProjectMode)
    console.log(`Project mode set to: ${mode}`)
  } catch (err) {
    console.error(err instanceof ConfigError ? err.message : String(err))
    process.exitCode = 1
  }
}
