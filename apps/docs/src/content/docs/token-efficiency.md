---
title: Token efficiency
description: How Kaddo's deterministic output scales in tokens as a real project grows.
---

A fair question for any AI-assisted tool: **does the context it produces stay efficient as the
project grows?** Because Kaddo's output is deterministic, this is measurable — not a guess. The
numbers below come from generating `kaddo context` and `kaddo explain` over synthetic projects of
increasing size.

## Measured growth

| Scenario | Work items | Modules | `context` tokens | `explain` tokens | tokens / work item |
|----------|-----------|---------|------------------|------------------|--------------------|
| empty    | 0   | 0  | 619    | 305   | — |
| small    | 5   | 0  | 846    | 399   | 169 |
| medium   | 25  | 2  | 1,909  | 724   | 76 |
| large    | 100 | 5  | 5,545  | 1,870 | 55 |
| xlarge   | 500 | 20 | 25,229 | 8,040 | **50** |

> Tokens ≈ characters ÷ 4 (the rough average for English + Markdown).

## What the numbers mean

**Growth is linear, not explosive.** The marginal cost settles at **~50 tokens per work item** —
a single metadata line (`id`, `type`, knowledge level, `status`, `domains`). The fixed overhead of
an empty project is small (~620 tokens: operating rules, the knowledge-layer table, and section
headers).

**Kaddo never ships bodies or source code.** The context pack uses bounded summaries
(`firstParagraph`) for documents and only the **front matter** of work items. In the `xlarge`
case, the raw knowledge files on disk are **~134,000 tokens**, while the pack is **25,229** — an
**~81% reduction**. Source code is never read into the pack at all.

**It is deterministic.** The same project always produces the same pack. There is zero token
variance between runs, which makes the output cacheable and auditable.

## Keeping it bounded at scale

The figures above are for the **whole project, unfiltered**. A multi-year codebase with hundreds
of closed work items will produce a large pack if you ask for everything — but you rarely need
everything for a single task.

`kaddo explain` already supports focusing the output, which is why its numbers stay far lower than
`context` at the same project size:

```bash
kaddo explain --scope payments      # only one domain
kaddo explain --type adr            # only one artifact type
kaddo explain --since 2026-01-01    # only recent work
```

### Practical guidance

- For day-to-day agent handoffs, scope to the **domain or work item you are touching** rather than
  dumping the entire history.
- Closed work items add up over time. Treat the full, unfiltered pack as an **onboarding / audit**
  artifact, not the thing you paste into every chat.
- Because the output is deterministic and front-matter-only, the pack is a **lower bound** on what
  an equivalent hand-written briefing would cost — and it never leaks source code into the prompt.

## Why this matters

Kaddo's two-layer model (deterministic CLI → interpreting LLM) exists partly for this reason: the
CLI does the cheap, repeatable packaging so your tokens are spent on **interpretation**, not on
re-deriving project structure every time. Efficient context is a side effect of keeping the CLI
deterministic and free of source code.
