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
