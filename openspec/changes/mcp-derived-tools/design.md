# Design: MCP Derived Tools (VS-058)

## Reusing CLI core

`packages/mcp/src/generate.ts` imports the CLI core builders directly from `@kaddo/cli` **source**
(`../../cli/src/...`) and tsup bundles them into the self-contained `dist/index.js`. The imported
builders are pure (read-only): `buildContextPack`/`serializeContextPackJson`/`renderContextPack`,
`buildProjectExplanation`/`renderExplanationHuman`/`renderExplanationAgent`, `buildUnderstandPlan`/
`renderUnderstand`, `buildGraph`/`serializeGraphJson`/`renderGraphMermaid`, `buildGraphHints`/
`renderGraphHintsMarkdown`/`serializeGraphHintsJson`, `buildCapsule`/`renderCapsuleMarkdown`/
`serializeCapsuleJson`, plus `loadConfig`. None of these pull in execa/clack/git, so the bundle
stays clean. The MCP package's runtime deps (gray-matter, yaml, zod, SDK) remain external.

## Write safety

`assertMcpDerivedWritePath(rel)` (in `project.ts`) accepts only:

- the fixed derived files: `context-pack.{md,json}`, `explain.{md,json}`, `understand.{md,json}`,
  `graph.json`, `graph.mmd`, `graph-hints.{md,json}` (all under `.kaddo/`);
- `\.kaddo/exports/<name>.capsule.(md|json)`.

Anything else — `knowledge/`, `src/`, `external/`, `.kaddo/external.yml`, `.kaddo/config.yml`,
absolute paths, `..` traversal — throws `Blocked unsafe MCP derived write path.` `writeDerived`
re-validates and confirms the resolved path stays within the project root before writing.

## Tool contract

Each generator returns `GenerateResult { status:'ok', files_written, summary, warnings,
next_suggested_resources }`. The server wraps it: success → JSON content; `KaddoMcpError` →
`isError` text (e.g. "Kaddo project not found…", "Knowledge repository not found…", "Blocked unsafe
…"); unexpected → "Could not <label>. <err>". Generators require config + `knowledge/` first.

Tool descriptions carry the explicit note: *"Writes only derived files under .kaddo/. Does not
modify knowledge, source code, external context or git."*

## Versioning

`SERVER_VERSION` is read from `package.json` at runtime (createRequire) to avoid drift. CLI + MCP
share 3.20.0; release.yml already checks both package versions against the tag.

## Out of scope

Writes to `knowledge/`/`src/`/`external/`, Work Item/ADR/front-matter edits, `kaddo learn/create/
owners suggest/capsule add/scan/add`, git, LLM, watch mode, HTTP transport, auth.
