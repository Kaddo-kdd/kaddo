import { Command } from 'commander'
import { runInit } from './commands/init.js'
import { runScan } from './commands/scan.js'
import { runCreate } from './commands/create.js'
import { runGuard } from './commands/guard.js'
import { runIgnore, runIgnoreList, runIgnoreRemove } from './commands/ignore.js'
import { runExplain } from './commands/explain.js'

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
  .option('--no-interactive', 'Disable interactive ignore prompts')
  .action(async (opts: { staged?: boolean; interactive?: boolean }) => {
    await runGuard(opts)
  })

const ignoreCmd = program
  .command('ignore')
  .description('Manage guard ignore list')

ignoreCmd
  .command('add <artifact-id> <reason>')
  .description('Ignore an artifact in future guard runs')
  .action((artifactId: string, reason: string) => {
    runIgnore(artifactId, reason)
  })

ignoreCmd
  .command('list')
  .description('List all active ignores')
  .action(() => {
    runIgnoreList()
  })

ignoreCmd
  .command('remove <artifact-id>')
  .description('Remove an artifact from the ignore list')
  .action((artifactId: string) => {
    runIgnoreRemove(artifactId)
  })

program
  .command('explain')
  .description('Explain the Knowledge Repository for humans or agents')
  .option('--for <audience>', 'Output format: human (default) or agent')
  .option('--scope <domain>', 'Limit to a specific domain or keyword')
  .option('--since <date>', 'Limit to artifacts created since date (YYYY-MM-DD)')
  .action((opts: { for?: string; scope?: string; since?: string }) => {
    runExplain({ for: opts.for as 'human' | 'agent' | undefined, scope: opts.scope, since: opts.since })
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
