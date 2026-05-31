# Kaddo Basic Example

This is a minimal project showing Kaddo's structure and how `kaddo guard` works.

## Structure

```
.kaddo/config.yml                          ← project config
architecture/
  knowledge.md                             ← current product state
  roadmap.md                               ← intentions
  work-items/
    WI-001-add-payment-retry-logic.md      ← K2 feature, owns src/payments/**
    WI-002-fix-order-pagination.md         ← K2 bugfix, owns src/orders/**
```

## Testing kaddo guard

From within this directory (must be inside a Git repo):

```bash
# 1. Create a fake source file that WI-001 owns
mkdir -p src/payments
echo "// payment service" > src/payments/payment.service.ts

# 2. Stage the file
git add src/payments/payment.service.ts

# 3. Run guard — WI-001 owns src/payments/** but was not modified
kaddo guard --staged

# Expected output:
#   Touched files:
#     - src/payments/payment.service.ts
#
#   FYI: src/payments/payment.service.ts matches WI-001
#   WI-001 was not modified in this diff.
#   Consider reviewing whether WI-001 still reflects the implementation.
```

## Activating ownership

The `code:` field in each work item's front matter is what Guard Lite reads:

```yaml
---
type: feature
id: WI-001
code:
  - src/payments/**
  - src/shared/payment/**
---
```

If `code: []` (empty), Guard Lite stays silent for that artifact.
