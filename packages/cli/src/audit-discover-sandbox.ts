// Trusted, standalone entry point executed inside the read-only audit container.
// The container exposes only the selected project and this executable bundle.
import { discoverProject } from './core/discovery.js'
import { discoverKnowledge } from './services/knowledge-artifacts.js'
import { loadOwners } from './services/owners.js'
import { loadConfig } from './core/config.js'

try {
  const dir = '/workspace'
  const discovery = discoverProject(dir)
  const artifacts = discoverKnowledge(dir)
  const owners = loadOwners(dir)
  process.stdout.write(JSON.stringify({ discovery, artifacts, owners, configured: Boolean(loadConfig(dir)) }))
} catch {
  process.stderr.write('Isolated discovery failed.\n')
  process.exitCode = 1
}
