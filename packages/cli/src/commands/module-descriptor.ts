import { cwd, exists, join, writeFile, readFile } from '../utils/fs.js'
import { intro, outro, log, text, select } from '../utils/ui.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const DESCRIPTOR_PATH = 'architecture/module.yml'

type ModuleDescriptor = {
  name: string
  purpose: string
  stack: string[]
  responsibilities: string[]
  contracts: string[]
  dependencies: string[]
  boundaries: string[]
  ownership: string
  related_artifacts: string[]
}

function readDescriptor(dir: string): ModuleDescriptor | null {
  const path = join(dir, DESCRIPTOR_PATH)
  if (!exists(path)) return null
  try {
    return parseYaml(readFile(path)) as ModuleDescriptor
  } catch {
    return null
  }
}

function writeDescriptor(dir: string, descriptor: ModuleDescriptor): void {
  writeFile(join(dir, DESCRIPTOR_PATH), stringifyYaml(descriptor))
}

export async function runModuleDescriptor(opts: { show?: boolean; init?: boolean }): Promise<void> {
  const dir = cwd()

  if (opts.show || (!opts.init && exists(join(dir, DESCRIPTOR_PATH)))) {
    const descriptor = readDescriptor(dir)
    if (!descriptor) {
      console.log('No module descriptor found. Run `kaddo module --init` to create one.')
      return
    }
    printDescriptor(descriptor)
    return
  }

  // Init / create
  intro('kaddo module --init')
  log.info('Creates architecture/module.yml — declares this repository\'s identity for multirepo contexts.')

  const name = await text({
    message: 'Module name (this repository)',
    placeholder: 'e.g. payments-service',
    validate: (v) => (v.trim().length === 0 ? 'Name is required.' : undefined),
  })

  const purpose = await text({
    message: 'Purpose — what does this module do?',
    placeholder: 'e.g. Handles subscription billing, invoicing, and payment processing',
    validate: (v) => (v.trim().length === 0 ? 'Purpose is required.' : undefined),
  })

  const stack = await text({
    message: 'Stack (comma-separated)',
    placeholder: 'e.g. TypeScript, Node.js, PostgreSQL, Stripe',
  })

  const responsibilities = await text({
    message: 'Key responsibilities (comma-separated)',
    placeholder: 'e.g. Charge customers, Issue refunds, Manage subscriptions',
  })

  const contracts = await text({
    message: 'Contracts exposed (APIs, events, comma-separated)',
    placeholder: 'e.g. POST /charge, event:payment.succeeded, event:payment.failed',
  })

  const dependencies = await text({
    message: 'Dependencies on other modules (comma-separated)',
    placeholder: 'e.g. auth-service, user-service',
  })

  const boundaries = await text({
    message: 'What does this module NOT own?',
    placeholder: 'e.g. User identity, Email delivery, Inventory',
  })

  const ownership = await text({
    message: 'Team or owner',
    placeholder: 'e.g. platform-team',
  })

  const splitTrimmed = (s: string) =>
    s.split(',').map((x) => x.trim()).filter(Boolean)

  const descriptor: ModuleDescriptor = {
    name: name.trim(),
    purpose: purpose.trim(),
    stack: splitTrimmed(stack),
    responsibilities: splitTrimmed(responsibilities),
    contracts: splitTrimmed(contracts),
    dependencies: splitTrimmed(dependencies),
    boundaries: splitTrimmed(boundaries),
    ownership: ownership.trim(),
    related_artifacts: [],
  }

  writeDescriptor(dir, descriptor)
  log.success(`Created ${DESCRIPTOR_PATH}`)
  outro(`Module descriptor ready. Share architecture/module.yml with dependent repositories.`)
}

function printDescriptor(d: ModuleDescriptor): void {
  console.log('')
  console.log(`Module: ${d.name}`)
  console.log(`Purpose: ${d.purpose}`)
  if (d.stack?.length) console.log(`Stack: ${d.stack.join(', ')}`)
  if (d.ownership) console.log(`Owner: ${d.ownership}`)
  if (d.responsibilities?.length) {
    console.log('Responsibilities:')
    d.responsibilities.forEach((r) => console.log(`  - ${r}`))
  }
  if (d.contracts?.length) {
    console.log('Contracts:')
    d.contracts.forEach((c) => console.log(`  - ${c}`))
  }
  if (d.dependencies?.length) {
    console.log('Dependencies:')
    d.dependencies.forEach((dep) => console.log(`  - ${dep}`))
  }
  if (d.boundaries?.length) {
    console.log('Boundaries (not owned):')
    d.boundaries.forEach((b) => console.log(`  - ${b}`))
  }
  if (d.related_artifacts?.length) {
    console.log('Related artifacts:')
    d.related_artifacts.forEach((a) => console.log(`  - ${a}`))
  }
  console.log('')
}
