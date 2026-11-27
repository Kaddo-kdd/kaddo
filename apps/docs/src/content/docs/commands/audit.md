---
title: kaddo audit run
description: Run an evidence-based technical audit and write a structured, reproducible report.
---

## Link an existing Work Item

Use `kaddo audit plan [AUD-001]` (or `--json`) to preview remediation actions, their evidence, coverage and existing Work Item links without writing files. Review suggestions before using `audit link`.

After reviewing a finding and an existing Work Item, explicitly approve their association:

```sh
kaddo audit link AUD-001 AF-0123456789abcdef WI-001 --yes
```

The finding must exist in the specified stored audit and the Work Item must be active. Kaddo records its stable finding ID on the Work Item; repeating the association does not duplicate it. Audit reports distinguish approved links from path or module suggestions. This command does not create Work Items.

`kaddo audit run` runs an evidence-based technical audit of the project and writes a structured,
reproducible report. It wires the whole audit flow end to end: discover the project, resolve the scope,
run the analyzers, correlate findings with existing knowledge, and render a report.

```bash
kaddo audit run
```

By default it audits the whole project, writes **derived** artifacts under `.kaddo/audits/` and prints a
summary. It never writes to `knowledge/` unless you ask it to with `--publish`.

## Options

| Option | Description |
|---|---|
| `--module <id...>` | Audit only these module(s). Matched by package name (`@scope/pkg`) or short id (`pkg`). |
| `--paths <glob...>` | Audit only these path(s). Mutually exclusive with `--module`. |
| `--json` | Emit the `AuditRun` JSON to stdout instead of the human summary. |
| `--publish` | Also write the canonical report under `knowledge/tech/audits/` (asks you to confirm first). |
| `--yes` | Skip the `--publish` confirmation prompt. |

## What it produces

- `.kaddo/audits/AUD-xxx.json` — the derived, machine-readable `AuditRun` (deterministic).
- `.kaddo/audits/AUD-xxx.md` — the derived Markdown report.
- With `--publish` (confirmed): `knowledge/tech/audits/AUD-xxx.md` — the canonical human report.

## Honest coverage

The report separates **confirmed findings**, **inferences** and **not-evaluated areas**. If a tool is missing
or fails, the run is marked `partial` (or `failed`) and the tool is listed under not-evaluated — never a clean
result. The command never reclassifies a finding: severity, confidence and provenance come from the analyzer.

## Exit codes

- `0` — the run executed (`completed` or `partial`). **Findings do not fail the command**, so it is safe to run
  in CI.
- `1` — the run `failed` (every tool failed to execute).
- `2` — a usage error (ambiguous scope, or an unknown module).

## Examples

```bash
# Audit a single module
kaddo audit run --module cli

# Emit the run as JSON for tooling
kaddo audit run --json

# Audit and publish the canonical report (asks to confirm)
kaddo audit run --publish
```

The scope you pick resolves to the audit contract's `AuditScope`; the report and artifacts are reproducible, so
diffs between two audits are clean.

## kaddo audit report

Query past audits (read-only — it never re-runs or writes).

```bash
kaddo audit report [id]
```

- `--list` — list the persisted audits (id, date, status, finding counts).
- No id — show the latest audit; `[id]` — show a specific one.
- `--severity <list>` / `--category <list>` / `--confidence <list>` — filter findings (comma-separated;
  OR within a filter, AND across filters).
- `--module <id...>` — filter findings to a module.
- `--json` — emit JSON instead of a summary.

```bash
# List all audits
kaddo audit report --list

# Show the latest audit's critical findings
kaddo audit report --severity critical

# A specific audit, dependency findings only, as JSON
kaddo audit report AUD-001 --category dependency --json
```

Audits are read from `.kaddo/audits/`, written by `kaddo audit run`. A missing id is a clear error and writes
nothing.
