# Proposal: Module-aware Context and Explain

## Problem

Kaddo supports multirepo module mapping through `.kaddo/modules.yml` and module-level
artifacts under `architecture/modules/<id>/`. However, the knowledge loop does not fully
surface mapped modules: `kaddo context` has no dedicated mapped-modules section, and
`kaddo explain` does not report mapped modules as part of the project state (it only knew
about add-on modules installed with `kaddo add`). Multirepo is visible in scaffolding but
weak in project understanding.

## Proposed Change

Make `kaddo context` and `kaddo explain` module-aware. The context pack includes mapped
modules from `.kaddo/modules.yml` plus per-module artifact coverage; the project
explanation reports mapped modules separately from installed add-on modules, in both the
human and agent outputs.

## Why Now

Module generation now produces registry-based artifacts with front matter and `code:`
globs (previous VS). The next step is making these mapped modules visible to humans and
LLM agents through the existing context and explain commands.

## Scope

- Read `.kaddo/modules.yml`.
- Add mapped modules to `.kaddo/context-pack.md` and `.kaddo/context-pack.json`.
- Add mapped modules to `kaddo explain` (human) and `--for agent` / `.kaddo/explain.json`.
- Distinguish mapped modules from installed add-on modules.
- Summarize per-module artifact coverage.
- Add tests and update docs (EN/ES).

## Out of Scope

- Changing Guard; cross-repo Guard.
- Scanning secondary repos or reading their source code.
- Calling LLMs; GitHub/GitLab API integration.
- Deprecating `kaddo module --init`.
- Generating or modifying module artifacts.

## Expected Value

Users in multirepo systems generate context packs that include the module map and can
explain project state with module awareness — making the architecture repo a more useful
global knowledge repository.

## Risks

- Context packs may get verbose → include metadata summaries, not artifact bodies.
- Module artifacts may be missing/partial → report coverage, never fail.
- Users may assume Kaddo scans secondary repos → explicit limitation note.

## Success Criteria

A multirepo project with `.kaddo/modules.yml` produces context and explain outputs that
clearly include mapped modules and their artifact coverage, without scanning secondary
repos or changing Guard.
