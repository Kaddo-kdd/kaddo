---
title: Domain Owners
description: Map domains to owners for guard notifications.
---

Declare domain owners in `.kaddo/config.yml`:

```yaml
owners:
  payments: "@alice"
  orders: "@bob"
```

List them:

```bash
kaddo owners                 # all domains
kaddo owners --domain payments
```

When `kaddo guard` matches touched code to an artifact's domains, the affected
owners are surfaced (and included in `--ci` JSON under `domain_owners`), so the
right person knows the knowledge may need a review.

## Declare code ownership with the assistant

Guard only acts on artifacts that declare `code:` globs. Instead of editing YAML by hand,
run the ownership assistant:

```bash
kaddo owners suggest
```

It lists Work Items missing ownership, suggests candidate globs from your scan baseline
(`.kaddo/scan.json`) and the artifact's `domains`/`capabilities`, and lets you pick or type
globs. After you confirm, it updates only the front matter — your body stays untouched:

```yaml
# before
code: []

# after
code:
  - src/payments/**
```

The assistant is **deterministic**: Kaddo suggests, you confirm. It never calls an LLM and
never edits source code. If `.kaddo/scan.json` is missing, you can still enter globs manually.

## Assisted manual entry

When you type a glob by hand, Kaddo helps you avoid common mistakes:

- **Normalizes** a directory path to a glob — `src/cli` → `src/cli/**`.
- **Validates the path** and offers a near match — `src/shares/**` → *"Path does not exist. Did you
  mean `src/shared/**`?"*.
- **Warns on broad globs** — `src/**` → *"This glob is broad and may reduce Guard usefulness."*

## Agent-assisted ownership

For a precise, project-wide proposal, use the **`ownership-agent`**: it reads the context pack,
Work Items, `codebase.md` and inventory and proposes narrow `code:` globs. You then confirm and
apply them with `kaddo owners suggest` — the agent never modifies files. Think of
`owners suggest` as the manual/override tool and the ownership-agent as the proposer.

**Workflow:** `kaddo scan` → `kaddo context` → ownership-agent → human confirms →
`kaddo owners suggest` → `kaddo guard`.
