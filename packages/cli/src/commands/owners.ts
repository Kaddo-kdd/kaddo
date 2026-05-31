import { cwd, exists, join } from '../utils/fs.js'
import { loadOwners } from '../services/owners.js'

const CONFIG_PATH = '.kaddo/config.yml'

export function runOwners(opts: { domain?: string }): void {
  const dir = cwd()

  if (!exists(join(dir, CONFIG_PATH))) {
    console.error('No .kaddo/config.yml found. Run `kaddo init` first.')
    process.exit(1)
  }

  const ownerMap = loadOwners(dir)
  const domains = Object.keys(ownerMap)

  if (domains.length === 0) {
    console.log('')
    console.log('No domain owners configured.')
    console.log('')
    console.log('Add owners to .kaddo/config.yml:')
    console.log('')
    console.log('  owners:')
    console.log('    payments: [alice, bob]')
    console.log('    orders: [carol]')
    console.log('')
    return
  }

  if (opts.domain) {
    const owners = ownerMap[opts.domain]
    if (!owners || owners.length === 0) {
      console.log(`No owners configured for domain "${opts.domain}".`)
      return
    }
    console.log('')
    console.log(`Domain: ${opts.domain}`)
    console.log(`Owners: ${owners.join(', ')}`)
    console.log('')
    return
  }

  console.log('')
  console.log('Domain owners:')
  console.log('')
  const maxLen = Math.max(...domains.map((d) => d.length))
  for (const domain of domains) {
    const owners = ownerMap[domain]
    console.log(`  ${domain.padEnd(maxLen)}  ${owners.join(', ')}`)
  }
  console.log('')
}
