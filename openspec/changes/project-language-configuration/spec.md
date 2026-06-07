# Spec: Project Language Configuration

## Config
- `project.language` enum `en|es`, default `en`; missing field → `en` (no migration).
- Helpers `projectLanguage(config)`, `languageLabel(lang)`.

## Surfaces
- init asks the knowledge language. context Project Metadata, explain, understand show it.
- every agent prompt includes the project-language rule.
- bootstrap injects a language directive into generated files; file names unchanged.

## Out of scope
- CLI translation, auto-translation of existing projects, full i18n, more languages, localized
  commands.

## Acceptance criteria
- AC1 init asks the project language. AC2 config stores project.language.
- AC3 bootstrap generates knowledge in the configured language (directive; agent writes body).
- AC4 context shows it. AC5 explain shows it. AC6 understand shows it.
- AC7 all agents are instructed to respect it. AC8 file names stay stable.
- AC9 the CLI stays fully English. AC10 docs distinguish CLI vs knowledge language.
