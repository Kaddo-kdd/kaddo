import { Command } from 'commander'
import { runInit } from './commands/init.js'
import { runScan } from './commands/scan.js'

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
  .action(() => {
    console.log('kaddo create — coming in Slice 3')
  })

program
  .command('guard')
  .description('Check if modified code has related artifacts that were not updated')
  .action(() => {
    console.log('kaddo guard — coming in Slice 4')
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
