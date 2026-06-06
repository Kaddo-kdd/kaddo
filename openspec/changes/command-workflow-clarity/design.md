# Design: Command Workflow Clarity

## `core/command-help.ts`

```ts
COMMAND_HELP: Record<string, { question: string; next: string }>
commandFooterLines(name): string[]      // ['', 'Question answered: …', 'Suggested next: …']
printCommandFooter(name): void
renderCommandMatrixMarkdown(): string    // docs table
```

Single source of truth for the responsibility matrix. Commands and docs both read from it.

## Footer wiring

`scan`, `context`, `explain` (human mode only) and `understand` call `printCommandFooter` near the
end. Guard is intentionally excluded — its `--ci/--json` output must stay machine-clean and it has
multiple early returns; it is covered by the docs matrix. Interactive (clack) commands rely on the
matrix too, to avoid noise across their many exit paths.

## Docs

- README + Getting Started: "which command, when" quick table + recovery path.
- Commands Overview: full matrix + recommended workflows (new / active / lost).
- Visual Guide: command-roles diagram + Question → Command → Output → Next framing.
- EN/ES parity.

## Compatibility

Additive. No command behavior changes besides the trailing footer lines on four orientation
commands. JSON/agent outputs are untouched.
