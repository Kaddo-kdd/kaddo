import { createRequire } from 'node:module'
import { Command } from 'commander'
import { cwd } from './utils/fs.js'
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
import { runModulesDiscover, runModulesValidate } from './commands/modules-discover.js'
import { runBootstrap } from './commands/bootstrap.js'
import { runCapsuleExport, runCapsuleAdd } from './commands/capsule.js'
import { runGraphExport } from './commands/graph.js'
import { runTopologyValidate, runTopologyApply } from './commands/topology.js'
import {
  runIntegrationsList,
  runIntegrationsStatus,
  runIntegrationsVerify,
  runIntegrationsWorkItems,
  runIntegrationsWorkItem,
  runIntegrationsImport,
} from './commands/integrations.js'
import { runReportImpact } from './commands/report.js'
import { runSavings, runSavingsInit } from './commands/savings.js'
import { runDrift } from './commands/drift.js'
import { runQuestions } from './commands/questions.js'
import { runAdaptersInstall, runAdaptersList, runAdaptersStatus } from './commands/adapters.js'
import { runAdr } from './commands/adr.js'
import { runTechOrganize } from './commands/tech.js'
import { runAssetsStatus, runAssetsUpdate } from './commands/assets.js'
import { runReady } from './commands/ready.js'
import { runAdmin } from './commands/admin.js'
import { runWorkItemImport } from './commands/work-item.js'

// Single source of truth for the version: read it from package.json at runtime so the CLI
// `--version` can never drift from the published package version. `../package.json` resolves
// relative to dist/index.js (npm always ships package.json). createRequire keeps esbuild from
// trying to inline it at build time.
const require = createRequire(import.meta.url)
const { version } = require('../package.json') as { version: string }

const program = new Command()

program
  .name('kaddo')
  .description('Knowledge Driven Development toolkit')
  .version(version)

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
  .description('Create a work item (feature, bugfix, hotfix, spike, chore). Use --from roadmap to create from a roadmap candidate.')
  .option('--from <source>', 'Create from a source artifact (currently: roadmap)')
  .action(async (type: string | undefined, opts: { from?: string }) => {
    await runCreate(type ?? '', opts)
  })

program
  .command('ready <id>')
  .description('Mark a draft Work Item as ready for implementation after human review')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (id: string, opts: { yes?: boolean }) => {
    await runReady(id, opts)
  })

const capsuleCmd = program
  .command('capsule')
  .description('Export this project as a Knowledge Capsule, or import an external one as context')

capsuleCmd
  .command('export')
  .description('Write a Knowledge Capsule about this project to .kaddo/exports/')
  .option('--scope <scope>', 'Export scope: "system" includes all mapped modules')
  .option('--module <id>', 'Export a capsule for a specific mapped module')
  .action((opts: { scope?: string; module?: string }) => {
    runCapsuleExport(opts)
  })

capsuleCmd
  .command('add <path>')
  .description('Register an external Knowledge Capsule as project context (.kaddo/external.yml)')
  .action((path: string) => {
    runCapsuleAdd(path)
  })

const graphCmd = program
  .command('graph')
  .description('Export the lightweight, file-based knowledge graph of the project')

graphCmd
  .command('export')
  .description('Write the knowledge graph to .kaddo/graph.json and .kaddo/graph.mmd')
  .option('--scope <scope>', 'Graph scope: active (default) or all')
  .option('--format <format>', 'Output format: json, mermaid (default: both)')
  .action((opts: { scope?: string; format?: string }) => {
    runGraphExport(opts)
  })

const topologyCmd = program
  .command('topology')
  .description('Validate and apply a semantic system topology proposal (agent proposes, human confirms, Core applies)')

topologyCmd
  .command('validate <file>')
  .description('Validate a topology proposal file deterministically (no write)')
  .action((file: string) => {
    runTopologyValidate(file)
  })

topologyCmd
  .command('apply <file>')
  .description('Apply a validated topology proposal to the canonical artifact after human confirmation')
  .option('-y, --yes', 'Skip the confirmation prompt (for already-approved automation)')
  .action((file: string, opts: { yes?: boolean }) => {
    runTopologyApply(file, opts)
  })

const integrationsCmd = program
  .command('integrations')
  .description('Connect Kaddo to external work systems (read-first; import requires human confirmation)')

integrationsCmd
  .command('list')
  .description('List configured integrations and their capabilities')
  .option('--json', 'Output JSON')
  .action((opts: { json?: boolean }) => runIntegrationsList(cwd(), opts))

integrationsCmd
  .command('status')
  .description('Verify each enabled integration and report its connection status')
  .option('--json', 'Output JSON')
  .action(async (opts: { json?: boolean }) => { await runIntegrationsStatus(cwd(), opts) })

integrationsCmd
  .command('verify <id>')
  .description('Verify one integration can actually connect (distinguishes configured from usable)')
  .option('--json', 'Output JSON')
  .action(async (id: string, opts: { json?: boolean }) => { await runIntegrationsVerify(cwd(), id, opts) })

integrationsCmd
  .command('work-items <id>')
  .description('List external work items from an integration (paginated, read-only)')
  .option('--json', 'Output JSON')
  .option('--cursor <cursor>', 'Pagination cursor from a previous page')
  .option('--page-size <n>', 'Items per page')
  .option('--status <status>', 'Filter by external status')
  .option('--query <text>', 'Free-text filter')
  .action(async (id: string, opts: { json?: boolean; cursor?: string; pageSize?: string; status?: string; query?: string }) => {
    await runIntegrationsWorkItems(cwd(), id, opts)
  })

integrationsCmd
  .command('work-item <id> <external-id>')
  .description('Read a single external work item (read-only)')
  .option('--json', 'Output JSON')
  .action(async (id: string, externalId: string, opts: { json?: boolean }) => { await runIntegrationsWorkItem(cwd(), id, externalId, opts) })

integrationsCmd
  .command('import <id> <external-id>')
  .description('Preview and, after confirmation, import an external work item as a Draft Work Item')
  .option('--type <type>', 'Kaddo Work Item type (required to create; never inferred from the external type)')
  .option('-y, --yes', 'Skip the confirmation prompt (for already-approved automation)')
  .action(async (id: string, externalId: string, opts: { type?: string; yes?: boolean }) => {
    await runIntegrationsImport(cwd(), id, externalId, opts)
  })

const workItemCmd = program
  .command('work-item')
  .description('Work Item operations')

workItemCmd
  .command('import [file]')
  .description('Import a Work Item from text or file into Kaddo as a Draft (import ≠ execute)')
  .option('--text <content>', 'Import from inline text instead of a file')
  .option('--type <type>', 'Kaddo Work Item type (feature/bugfix/hotfix/spike/chore)')
  .option('-y, --yes', 'Skip the confirmation prompt')
  .action(async (file: string | undefined, opts: { text?: string; type?: string; yes?: boolean }) => {
    await runWorkItemImport(cwd(), file, opts)
  })

const reportCmd = program
  .command('report')
  .description('Generate Kaddo reports')

reportCmd
  .command('impact')
  .description('Knowledge Impact Report: knowledge health, coverage, traceability, readiness (deterministic, no LLM)')
  .option('--json', 'Output JSON instead of Markdown')
  .option('--scope <scope>', 'Scope: all (default — accumulated impact) or active')
  .option('--output <path>', 'Write the report to a file (e.g. .kaddo/reports/impact-report.md)')
  .action((opts: { json?: boolean; output?: string; scope?: string }) => {
    runReportImpact(opts)
  })

// Convenience alias: `kaddo impact`.
program
  .command('impact')
  .description('Alias for `kaddo report impact`')
  .option('--json', 'Output JSON instead of Markdown')
  .option('--scope <scope>', 'Scope: all (default — accumulated impact) or active')
  .option('--output <path>', 'Write the report to a file')
  .action((opts: { json?: boolean; output?: string; scope?: string }) => {
    runReportImpact(opts)
  })

reportCmd
  .command('savings')
  .description('Estimated Savings Report: evidence-based time/effort/value estimates (deterministic, no LLM)')
  .option('--json', 'Output JSON instead of Markdown')
  .option('--scope <scope>', 'Scope: all (default) or active')
  .option('--output <path>', 'Write the report to a file (e.g. .kaddo/reports/savings-report.md)')
  .action((opts: { json?: boolean; output?: string; scope?: string }) => {
    runSavings(opts)
  })

const savingsCmd = program
  .command('savings')
  .description('Estimated Savings Report from impact evidence + configurable assumptions')
  .option('--json', 'Output JSON instead of Markdown')
  .option('--scope <scope>', 'Scope: all (default) or active')
  .option('--output <path>', 'Write the report to a file')
  .action((opts: { json?: boolean; output?: string; scope?: string }) => {
    runSavings(opts)
  })

savingsCmd
  .command('init')
  .description('Create an editable `.kaddo/savings.yml` with savings assumptions')
  .option('--force', 'Overwrite an existing .kaddo/savings.yml')
  .action((opts: { force?: boolean }) => {
    runSavingsInit(opts)
  })

reportCmd
  .command('drift')
  .description('Drift Trend Report from recorded guard history (deterministic, no LLM)')
  .option('--json', 'Output JSON instead of Markdown')
  .option('--output <path>', 'Write the report to a file (e.g. .kaddo/reports/drift-report.md)')
  .action((opts: { json?: boolean; output?: string }) => {
    runDrift(opts)
  })

program
  .command('drift')
  .description('Drift Trend Report from recorded `kaddo guard --record` history')
  .option('--json', 'Output JSON instead of Markdown')
  .option('--output <path>', 'Write the report to a file')
  .action((opts: { json?: boolean; output?: string }) => {
    runDrift(opts)
  })

const questionsAction = (opts: { json?: boolean; output?: string }) => runQuestions(opts)
program
  .command('questions')
  .description('Open-questions readiness gate: blocking/important/deferred decisions before the roadmap')
  .option('--json', 'Output JSON instead of a summary')
  .option('--output <path>', 'Write the report to a file (e.g. .kaddo/reports/questions-report.md)')
  .action(questionsAction)

program
  .command('readiness')
  .description('Alias for `kaddo questions`')
  .option('--json', 'Output JSON instead of a summary')
  .option('--output <path>', 'Write the report to a file')
  .action(questionsAction)

const agentsCmd = program
  .command('agents')
  .description('Inspect and update installed Kaddo agents (version status)')
agentsCmd
  .command('status')
  .description('Show installed agents, their version and whether they are up to date')
  .option('--json', 'Output JSON')
  .action((opts: { json?: boolean }) => runAssetsStatus('agent', opts))
agentsCmd
  .command('update')
  .description('Refresh outdated agents (never overwrites modified files without --force)')
  .option('--force', 'Overwrite unknown-version / locally-modified agents')
  .action((opts: { force?: boolean }) => runAssetsUpdate('agent', opts))

const skillsCmd = program
  .command('skills')
  .description('Inspect and update installed Kaddo skills (version status)')
skillsCmd
  .command('status')
  .description('Show installed skills, their version and whether they are up to date')
  .option('--json', 'Output JSON')
  .action((opts: { json?: boolean }) => runAssetsStatus('skill', opts))
skillsCmd
  .command('update')
  .description('Refresh outdated skills (never overwrites modified files without --force)')
  .option('--force', 'Overwrite unknown-version / locally-modified skills')
  .action((opts: { force?: boolean }) => runAssetsUpdate('skill', opts))

const techCmd = program
  .command('tech')
  .description('Organize the knowledge/tech/ structure (core vs discovery vs decisions)')
techCmd
  .command('organize')
  .description('Move discovery artifacts into knowledge/tech/discovery/ (never overwrites, no content change)')
  .action(() => {
    runTechOrganize()
  })

program
  .command('adr')
  .alias('decisions')
  .description('List technical decision candidates and the ADR files to create from them (read-only)')
  .option('--json', 'Output JSON')
  .action((opts: { json?: boolean }) => {
    runAdr(opts)
  })

const adaptersCmd = program
  .command('adapters')
  .description('Generate adapters that project Kaddo knowledge for external coding agents')

adaptersCmd
  .command('install <adapter>')
  .description('Generate an adapter file (codex/opencode/antigravity/kiro → AGENTS.md, claude → CLAUDE.md) from Kaddo knowledge')
  .option('--force', 'Overwrite an existing output file')
  .option('--inject', 'Add or update only the Kaddo block in an existing file, preserving the rest')
  .option('--dry-run', 'Print the content without writing files')
  .action((adapter: string, opts: { force?: boolean; inject?: boolean; dryRun?: boolean }) => {
    runAdaptersInstall(adapter, opts)
  })

adaptersCmd
  .command('list')
  .alias('ls')
  .description('List the supported adapters and their target files')
  .option('--json', 'Output JSON')
  .action((opts: { json?: boolean }) => {
    runAdaptersList(opts)
  })

adaptersCmd
  .command('status')
  .alias('check')
  .description('Show the install state of each adapter in this project (read-only)')
  .option('--json', 'Output JSON')
  .action((opts: { json?: boolean }) => {
    runAdaptersStatus(opts)
  })

// Alias: `kaddo export <adapter>`.
program
  .command('export <adapter>')
  .description('Alias for `kaddo adapters install <adapter>` (codex/opencode/antigravity/kiro → AGENTS.md, claude → CLAUDE.md)')
  .option('--force', 'Overwrite an existing output file')
  .option('--inject', 'Add or update only the Kaddo block in an existing file, preserving the rest')
  .option('--dry-run', 'Print the content without writing files')
  .action((adapter: string, opts: { force?: boolean; inject?: boolean; dryRun?: boolean }) => {
    runAdaptersInstall(adapter, opts)
  })

program
  .command('guard')
  .description('Check if modified code has related artifacts that were not updated')
  .option('--staged', 'Check only staged files')
  .option('--no-interactive', 'Disable interactive ignore prompts')
  .option('--ci', 'CI mode: output JSON, no prompts, non-blocking')
  .option('--json', 'Output JSON (alias for --ci)')
  .option('--workspace', 'Also check local mapped module repos from .kaddo/modules.yml (opt-in)')
  .option('--include-archived', 'Include archived Work Items in ownership matching (excluded by default)')
  .option('--record', 'Record this run to .kaddo/history/ for drift trend reporting')
  .action(async (opts: { staged?: boolean; interactive?: boolean; ci?: boolean; json?: boolean; workspace?: boolean; includeArchived?: boolean; record?: boolean }) => {
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

// VS-093: singular `kaddo module` redirects to `kaddo modules`.
program
  .command('module')
  .description('(deprecated) Use `kaddo modules` instead')
  .allowUnknownOption()
  .action(() => {
    console.log('Unknown command `module`.')
    console.log('Did you mean `kaddo modules list`?')
  })

const modulesCmd = program
  .command('modules')
  .description('Discover, map, list and validate multirepo modules')

modulesCmd
  .command('discover')
  .description('Discover sibling repositories configured as Kaddo modules')
  .option('--apply', 'Persist discovered modules to .kaddo/modules.yml')
  .action(async (opts: { apply?: boolean }) => { await runModulesDiscover(opts) })

modulesCmd
  .command('map [path]')
  .description('Register a repository as a module manually')
  .action(async (modulePath: string | undefined) => { await runModulesMap(undefined, modulePath) })

modulesCmd
  .command('list')
  .description('List mapped modules from .kaddo/modules.yml')
  .action(() => { runModulesList() })

modulesCmd
  .command('validate')
  .description('Validate registered modules against their current configuration')
  .action(() => { runModulesValidate() })

program
  .command('add [module]')
  .description('Install an optional Kaddo module (adr, incident, rfc, migration, legacy, agents, skills, standards, security, stack, git-strategy)')
  .option('--all', 'For `add agents` / `add skills`: install every item (not just the recommended set)')
  .option('--group <name>', 'For `add agents`: business|product|tech|delivery|utilities. For `add skills`: delivery|tech|integration')
  .action((moduleName: string | undefined, opts: { all?: boolean; group?: string }) => {
    runAdd(moduleName ?? '', { all: opts.all, group: opts.group })
  })

program
  .command('admin')
  .description('Start Kaddo Admin — a local web interface for the project knowledge')
  .option('--port <port>', 'Server port (default: 4173)', parseInt)
  .option('--host <host>', 'Server host (default: 127.0.0.1)')
  .option('--no-open', 'Do not open the browser automatically')
  .action(async (opts: { port?: number; host?: string; open?: boolean }) => {
    await runAdmin({ port: opts.port, host: opts.host, noOpen: opts.open === false })
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
