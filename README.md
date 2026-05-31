# Kaddo — Knowledge Driven Development

> Preserve and evolve product knowledge close to the code.

Kaddo is an open source CLI toolkit based on **Knowledge Driven Development (KDD)**. It helps teams keep the minimum necessary context alive next to the code — without turning development into bureaucracy.

```
Classify → Capture → Structure → Build → Learn
```

## Why Kaddo

Projects fail or degrade because knowledge is scattered across meetings, chats, tickets, emails, and outdated documents. With AI, this problem gets worse: agents build on assumptions when they lack context.

Kaddo puts knowledge first, then lets AI help you build.

**The central question:** *How does Kaddo know the right knowledge was impacted by this change?*

## What Kaddo is not

- Not a code generator
- Not an agent framework
- Not a replacement for Jira, Linear, or documentation tools
- Not a platform

Kaddo occupies a different layer:

```
Execution tools
      ↓
Agent frameworks
      ↓
Specifications
      ↓
Kaddo
      ↓
Product knowledge
```

## Install

```bash
npx kaddo init
```

Or install globally:

```bash
npm install -g kaddo
kaddo --help
```

## Commands

### `kaddo init`

Initialize Kaddo in the current project.

```bash
kaddo init
```

Creates:
```
architecture/
  knowledge.md      ← current state of the product
  roadmap.md        ← intentions and priorities
  work-items/       ← one file per work item
.kaddo/
  config.yml        ← project config
```

---

### `kaddo scan`

Detect your project stack deterministically.

```bash
kaddo scan
```

Detects language, framework, package manager, code dirs, migration dirs, contract files, and infra. Suggests domains for human confirmation — never assumes.

---

### `kaddo create`

Create a Work Item with the minimum context for its Knowledge Level.

```bash
kaddo create feature   # K2: 4 questions
kaddo create bugfix    # K2: 4 questions
kaddo create hotfix    # K1: 2 questions
kaddo create spike     # K3: 4 questions
```

**Knowledge Levels:**

| Level | When | Questions |
|---|---|---|
| K0 | Trivial change | None |
| K1 | Hotfix / simple fix | Problem + expected result |
| K2 | Feature or bugfix with functional impact | + impact + acceptance criteria |
| K3 | Capability or significant change | + design |
| K4 | Architecture change or migration | + risks |

The generated file includes front matter, Definition of Done, and a Learning section.

**To activate Guard Lite**, add code globs to the `code:` field of the generated front matter:

```yaml
---
type: feature
id: WI-001
code:
  - src/payments/**
  - src/shared/payment/**
---
```

---

### `kaddo guard`

Check if modified code has related artifacts that were not updated.

```bash
kaddo guard           # checks staged + unstaged files
kaddo guard --staged  # checks only staged files
```

Guard Lite reads `git diff`, finds artifacts with matching `code:` globs, and shows a **non-blocking FYI** if the artifact was not updated in the same diff.

```
Touched files:
  - src/payments/payments.service.ts

  FYI: src/payments/payments.service.ts matches WI-001
  WI-001 was not modified in this diff.
  Consider reviewing whether WI-001 still reflects the implementation.
```

Guard is **silent** when no artifacts declare ownership. No noise on day one.

---

## How ownership works

Ownership is declared in the front matter of each artifact — no central mapping file.

```yaml
---
type: feature
id: WI-001
title: "Add payment retry logic"
knowledge_level: K2
status: in-progress
code:
  - src/payments/**
  - src/shared/payment/**
summary: "Adds retry policy for failed payment attempts."
---
```

Kaddo builds a simple Knowledge Graph from these front matters at runtime:

```
artifact → code globs → git diff intersection
```

## Roadmap

| Version | Commands |
|---|---|
| v1.0 | `init`, `scan`, `create`, `guard` |
| v1.1 | `status`, `explain`, `learn` |
| v1.2 | `classify`, `history` |
| v2.x | CI mode, semantic plugins, domain rules |

**Modules (added with `kaddo add`):**
`adr` · `rfc` · `incident` · `migration` · `contracts` · `capabilities` · `agents`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
