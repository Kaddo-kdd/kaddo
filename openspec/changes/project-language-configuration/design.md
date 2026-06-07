# Design: Project Language Configuration

## Config (`core/config.ts`)
- `ProjectLanguage = 'en' | 'es'`, `PROJECT_LANGUAGES`, `languageSchema` (default en).
- `project.language` added to the schema; `projectLanguage(config)` and `languageLabel(lang)`.

## Surfaces
- context-pack: `project.language` = `languageLabel(projectLanguage(config))`; template prints
  `- Language:` under Project Metadata.
- explain: `project.language` field + `- Project language:` line.
- understand: prints `Project language: <label>` in the handoff.
- agents: `withResponsibilityTrace` appends a standard `## Project Language` rule to every prompt
  (single source of truth, DRY).
- bootstrap: `withLanguageDirective` inserts an `es` directive after the front matter of generated
  seed files; English is unchanged. The CLI never translates template prose.

## Compatibility
Additive + back-compatible: missing `language` resolves to `en`. No automatic migration. File
names are independent of language.
