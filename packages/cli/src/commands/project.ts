import { cwd } from '../utils/fs.js'
import { ConfigError, loadConfig, projectMode, setProjectMode, type ProjectMode } from '../core/config.js'
import { ensurePocArtifact } from '../core/poc.js'

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
    const config = setProjectMode(dir, mode as ProjectMode)
    if (mode === 'poc' && ensurePocArtifact(dir, config.project.name)) {
      console.log('Created knowledge/delivery/poc.md')
    }
    console.log(`Project mode set to: ${mode}`)
  } catch (err) {
    console.error(err instanceof ConfigError ? err.message : String(err))
    process.exitCode = 1
  }
}
