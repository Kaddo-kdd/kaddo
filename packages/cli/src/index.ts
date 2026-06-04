import { Command } from 'commander'
import { runInit } from './commands/init.js'
import { runScan } from './commands/scan.js'
import { runCreate } from './commands/create.js'
import { runGuard } from './commands/guard.js'
import { runIgnore, runIgnoreList, runIgnoreRemove } from './commands/ignore.js'
import { runExplain } from './commands/explain.js'
import { runContext } from './commands/context.js'
import { runUnderstand } from './commands/understand.js'
import { runClassify } from './commands/classify.js'
import { runStatus } from './commands/status.js'
import { runLearn } from './commands/learn.js'
import { runHistory } from './commands/history.js'
import { runAdd } from './commands/add.js'
import { runOwners, runOwnersSuggest } from './commands/owners.js'
import { runModuleDescriptor } from './commands/module-descriptor.js'
import { runModulesMap, runModulesList } from './commands/modules-map.js'
import { runBootstrap } from './commands/bootstrap.js'

const program = new Command()

program
  .name('kaddo')
  .description('Knowledge Driven Development toolkit')
  .version('3.0.0')

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
  .command('bootstrap')
  .description('Build the initial knowledge base for a new project (Business → Product → Tech → Delivery)')
  .action(async () => {
    await runBootstrap()
  })

program
  .command('create [type]')
  .description('Create a work item (feature, bugfix, hotfix, spike). Use --from roadmap to create from a roadmap candidate.')
  .option('--from <source>', 'Create from a source artifact (currently: roadmap)')
  .action(async (type: string | undefined, opts: { from?: string }) => {
    await runCreate(type ?? '', opts)
  })

program
  .command('guard')
  .description('Check if modified code has related artifacts that were not updated')
  .option('--staged', 'Check only staged files')
  .option('--no-interactive', 'Disable interactive ignore prompts')
  .option('--ci', 'CI mode: output JSON, no prompts, non-blocking')
  .option('--json', 'Output JSON (alias for --ci)')
  .option('--workspace', 'Also check local mapped module repos from .kaddo/modules.yml (opt-in)')
  .action(async (opts: { staged?: boolean; interactive?: boolean; ci?: boolean; json?: boolean; workspace?: boolean }) => {
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
  .option('--type <type>', 'Limit to a specific artifact type (adr, rfc, feature, etc.)')
  .option('--since <date>', 'Limit to artifacts created since date (YYYY-MM-DD)')
  .action((opts: { for?: string; scope?: string; type?: string; since?: string }) => {
    runExplain({ for: opts.for as 'human' | 'agent' | undefined, scope: opts.scope, type: opts.type, since: opts.since })
  })

program
  .command('context')
  .description('Generate an LLM context pack (.kaddo/context-pack.md + .json) for agent handoff')
  .option('--format <format>', 'Output format: markdown, json (default: both)')
  .action((opts: { format?: string }) => {
    runContext(opts)
  })

program
  .command('understand')
  .description('Guide the CLI → LLM handoff: refresh the context pack and recommend agents by project state')
  .action(() => {
    runUnderstand()
  })

program
  .command('status')
  .description('Show the current state of the Knowledge Repository')
  .action(() => { runStatus() })

program
  .command('learn [artifact-id]')
  .description('Close a work item and record what was learned')
  .action(async (artifactId?: string) => { await runLearn(artifactId) })

program
  .command('history')
  .description('List work items with optional filters')
  .option('--domain <domain>', 'Filter by domain')
  .option('--type <type>', 'Filter by type (feature, bugfix, hotfix, spike...)')
  .option('--status <status>', 'Filter by status (in-progress, done, cancelled)')
  .option('--limit <n>', 'Limit number of results', parseInt)
  .action((opts: { domain?: string; type?: string; status?: string; limit?: number }) => {
    runHistory(opts)
  })

program
  .command('classify')
  .description('Check if the declared work item type is consistent with observed signals in the diff')
  .option('--type <type>', 'Declared work item type (overrides active work item)')
  .option('--level <level>', 'Declared knowledge level (used with --type)')
  .option('--staged', 'Check only staged files')
  .action(async (opts: { type?: string; level?: string; staged?: boolean }) => {
    await runClassify(opts)
  })

program
  .command('owners [action]')
  .description('List domain owners, or run `owners suggest` to declare code ownership on artifacts')
  .option('--domain <domain>', 'Show owners for a specific domain')
  .action(async (action: string | undefined, opts: { domain?: string }) => {
    if (action === 'suggest') {
      await runOwnersSuggest()
    } else {
      runOwners(opts)
    }
  })

program
  .command('module')
  .description('Show or initialize the multirepo module descriptor (knowledge/module.yml)')
  .option('--init', 'Create the module descriptor interactively')
  .option('--show', 'Print the current module descriptor')
  .action(async (opts: { init?: boolean; show?: boolean }) => { await runModuleDescriptor(opts) })

const modulesCmd = program
  .command('modules')
  .description('Map and list secondary repositories as modules of the system (multirepo)')

modulesCmd
  .command('map')
  .description('Register a secondary repository as a module and generate its knowledge structure')
  .action(async () => { await runModulesMap() })

modulesCmd
  .command('list')
  .description('List mapped modules')
  .action(() => { runModulesList() })

program
  .command('add [module]')
  .description('Install an optional Kaddo module (adr, incident, rfc, migration, legacy, agents, standards, security, stack, git-strategy)')
  .action((moduleName?: string) => { runAdd(moduleName ?? '') })

program.parseAsync(process.argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
