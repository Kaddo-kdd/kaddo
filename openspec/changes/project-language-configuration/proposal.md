# Proposal: Project Language Configuration (VS-051)

## Why

Kaddo implicitly assumed knowledge would be written in English. LATAM/other teams keep their
docs, roadmaps and Work Items in Spanish, but templates, agent prompts and bootstrap output are
born in English, forcing constant translation.

## What

Make the **knowledge language** a project property (`project.language: en|es`), set at `kaddo init`.
The CLI itself stays English — only generated knowledge is affected.

- config: `project.language` (enum en|es, default en); back-compat (missing → en).
- `kaddo init` asks "Project knowledge language".
- context pack (Project Metadata), explain and understand report the language.
- every agent prompt carries a standard rule: write knowledge in the configured language; never
  translate code, file names, CLI commands or config keys.
- bootstrap is language-aware: it injects a language directive into generated seed files (the
  deterministic CLI does not translate template prose; the bootstrap-agent writes the body in the
  configured language).
- file names stay stable regardless of language.
- docs (EN/ES) distinguish CLI language from project knowledge language.

## Impact

Teams work in their natural language without affecting the CLI or technical consistency. Out of
scope: CLI i18n, auto-translating existing projects, more languages, localized commands.
