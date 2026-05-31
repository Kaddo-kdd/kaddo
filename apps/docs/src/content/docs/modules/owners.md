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

**Workflow:** `kaddo create` (or `kaddo create --from roadmap`) → `kaddo owners suggest` →
`kaddo guard`.
