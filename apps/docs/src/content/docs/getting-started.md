---
title: Getting started
description: Install Kaddo and initialize it in your project.
---

## Install

```bash
npx kaddo init
```

Or install globally:

```bash
npm install -g kaddo
kaddo --help
```

## Initialize

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

## Next steps

1. Run `kaddo scan` to detect your stack and suggest domains.
2. Run `kaddo create feature` to create your first Work Item.
3. Add `code:` globs to the front matter to activate Guard Lite.
4. Run `kaddo guard` before committing.
