# Proposal: Align Module Generation with Template Registry

## Problem

Kaddo supports multirepo module mapping through `kaddo modules map`. The command
registers secondary repositories in `.kaddo/modules.yml` and creates a module knowledge
folder under `architecture/modules/<module-id>/`.

However, the generated module artifacts currently use **inline templates** instead of the
official template registry. As a result, generated module artifacts:

- do not include front matter,
- do not include `code:` ownership globs,
- do not include the same quality checklist as registry templates,
- diverge from the documented template system,
- are not useful for ownership-based workflows.

This makes multirepo support functional for scaffolding, but weak for the Kaddo
knowledge loop.

## Proposed Change

Update `kaddo modules map` so it generates module artifacts using the centralized
template registry, prefilling module metadata into front matter: module id, name, repo
path, module type, owner, capabilities and `code:` globs.

## Why Now

Module mapping, the template registry, module templates, operational agents, ownership
and Guard all exist — but they are not connected. Aligning module generation with the
registry closes the first multirepo consistency gap without changing Guard or adding new
behavior.

## Scope

- Replace inline module artifact generation with registry-based templates.
- Inject module metadata into front matter, including `code:` globs.
- Preserve no-overwrite behavior.
- Keep `.kaddo/modules.yml` behavior unchanged.
- Add tests for generated front matter, `code:` globs and quality checklists.
- Update the multirepo example/docs to clarify artifacts are template-based.

## Out of Scope

- Changing Guard behavior; cross-repo / workspace Guard.
- Making `scan`, `context` or `explain` module-aware.
- Deprecating `kaddo module --init`.
- Scanning secondary repositories; remote Git/GitHub integration.
- Calling LLMs; auto-generating diagrams.

## Expected Value

Module artifacts become consistent with the rest of Kaddo, creating a cleaner foundation
for later slices (module-aware context/explain, workspace-level Guard, richer examples).

## Risks

- Template interpolation may become too custom → keep it minimal (front matter + body).
- Existing tests may depend on old inline content → update them.
- Users with existing module artifacts must not lose work → keep no-overwrite.
- Generated files may be longer than before → acceptable; still lightweight.

## Success Criteria

A newly mapped module generates artifacts from the registry with front matter, `code:`
globs, module metadata and quality checklists, while preserving no-overwrite behavior and
without changing Guard, scanning other repos, or calling an LLM.
