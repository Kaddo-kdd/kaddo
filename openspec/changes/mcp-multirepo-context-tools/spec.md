# MCP Multirepo Core/Module Context Tools (VS-092)

## Summary

Adds 6 MCP tools for multirepo context: module listing, module context retrieval,
Work Item module validation, composite WI context, branch strategy suggestions, and
scoped capsule export. All tools are read-only (except capsule export which writes
derived files under `.kaddo/exports/`). None executes git, deploys, installs
dependencies, or calls an LLM.

## Tools

1. `kaddo_modules_list` — list mapped modules and configuration status (core only).
2. `kaddo_get_module_context` — get module-context.md, tech summaries and warnings.
3. `kaddo_validate_work_item_modules` — validate affected_modules coherence and ownership.
4. `kaddo_get_work_item_context` — composite context for multirepo WI implementation.
5. `kaddo_suggest_branch_strategy` — suggest branch names, commit messages, checklist.
6. `kaddo_export_capsule` — export project/system/module capsule under `.kaddo/exports/`.

## Constraints

- MCP remains read-only except derived paths under `.kaddo/`.
- No git execution, no deploy, no LLM calls.
- All tools reuse deterministic logic — no AI interpretation.
- EN/ES doc parity maintained.
