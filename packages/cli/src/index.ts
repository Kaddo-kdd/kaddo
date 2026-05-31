import { Command } from 'commander'
import { runInit } from './commands/init.js'
import { runScan } from './commands/scan.js'
import { runCreate } from './commands/create.js'
import { runGuard } from './commands/guard.js'

const program = new Command()

program
  .name('kaddo')
  .description('Knowledge Driven Development toolkit')
  .version('0.1.0')

program
  .command('init')
  .description('Initialize Kaddo in the current project')
  .action(async () => {
    await runInit()
  })

// Placeholder for upcoming commands — implemented in later slices
program
  .command('scan')
  .description('Detect project stack and suggest domains')
  .action(async () => {
    await runScan()
  })

program
  .command('create <type>')
  .description('Create a work item (feature, bugfix, hotfix, spike)')
  .action(async (type: string) => {
    await runCreate(type)
  })

program
  .command('guard')
  .description('Check if modified code has related artifacts that were not updated')
  .option('--staged', 'Check only staged files')
  .action(async (opts: { staged?: boolean }) => {
    await runGuard(opts)
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
