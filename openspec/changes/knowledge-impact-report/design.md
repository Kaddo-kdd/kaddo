# Design: Knowledge Impact Report (VS-061)

## Core (core/impact-report.ts)

`buildImpactReport(dir, { scope? }, now?)` is pure and reuses existing builders:
`buildProjectExplanation` (layers, work items by state, ownership, roadmap, graph/graphHints
summaries, knowledge flags), `discoverWorkItems` (per-WI source/initiative/level/code globs + body
sections for acceptance/DoD), `discoverInstalledSkills`. When `scope` is given the graph section is
computed fresh via `buildGraph` + `buildGraphHints` at that scope; otherwise it reflects the last
exported graph (`exp.graph` / `exp.graphHints`), and degrades to "not available" when none exists.

Outputs a stable `ImpactReport` object → `renderImpactMarkdown` / `serializeImpactJson`.

Metrics are rule-based and transparent: coverage ratios per Work Item; ownership coverage %, owned
code paths (sum of globs), broad globs (`^[^/*]+/\*\*$`), overlaps (globs declared by >1 WI);
traceability from roadmap stats + connections + graph; Context Readiness level from layer maturity +
context pack + graph; Impact Signals from simple thresholds (e.g. AI context readiness = High when
context pack + non-empty graph + skills + traceable delivery). Optional 0–100 score blends six
buckets (Health 20, Coverage 20, Ownership 15, Traceability 20, Graph 15, Context 10); `null` when
there are no Work Items.

Reads only knowledge artifacts and `.kaddo/` derived JSON — never `src/`, never an LLM.

## Command (commands/report.ts)

`runReportImpact({ json?, output? })`: build → render (Markdown or JSON) → print to stdout, or write
to `--output` (the only path that writes). `report impact` subcommand + `impact` alias in index.ts;
command-help entry `report impact`.

## MCP

- `project.ts`: add `.kaddo/reports/*.{md,json}` to the derived-write allowlist.
- `generate.ts`: `generateImpactReport(root, { format, scope, output })` (imports the CLI core
  builder; bundled by tsup) → writes via `writeDerived` (default `.kaddo/reports/impact-report.md`).
- `resources.ts`: `kaddo://impact-report` returns a saved report or builds one in memory (read-only).
- `server.ts`: register `kaddo_generate_impact_report` (format/scope/output).

## Out of scope

Money/ROI, individual productivity, persisted metric history, time trends, Jira/Linear/GitHub,
LLM interpretation, web dashboard, email/Slack delivery.
