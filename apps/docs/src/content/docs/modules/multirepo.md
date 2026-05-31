---
title: Multirepo descriptor
description: Describe a repo as a module in a larger system.
---

In a multirepo setup, each repository can describe itself as a module so its
knowledge can be composed across the system.

```bash
kaddo module --init   # create architecture/module.yml interactively
kaddo module --show   # print the current descriptor
```

The descriptor (`architecture/module.yml`) records the module name, its domains,
and the contracts it exposes or consumes — the seed for cross-repo knowledge.
