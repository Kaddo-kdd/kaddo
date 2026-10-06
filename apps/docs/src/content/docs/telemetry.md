---
title: Telemetry
description: Anonymous usage telemetry — what it is, how to enable it, what data is sent and what is never sent.
---

Kaddo can optionally send **anonymous usage metadata** to `telemetry.kaddo.org`.
Telemetry is **disabled by default** and requires explicit consent.

:::note[Website analytics ≠ product telemetry]
This page is about **product telemetry** (the Kaddo CLI/MCP, sent to `telemetry.kaddo.org`). It is
separate from **website analytics** on `kaddo.org`, which uses Google Analytics 4 (property
`G-Y4DND8TG81`) to understand site traffic only, with consent and no cookies until you opt in. The two
systems share no identity and are never correlated.
:::

## Consent model

Kaddo uses a three-state consent model:

| State | Meaning |
|---|---|
| **unset** | No decision has been made — Kaddo may ask once |
| **enabled** | User accepted — telemetry operates |
| **disabled** | User declined — no telemetry, no further prompts |

On the first interactive command after initialization, Kaddo asks once whether to enable
telemetry. The decision is persisted and Kaddo does not ask again.

In non-interactive environments (CI, scripts, piped input) Kaddo never prompts
and never enables telemetry by default.

### MCP / LLM interfaces

When Kaddo is used via MCP (the primary LLM integration path), consent is managed through
dedicated MCP tools instead of interactive prompts:

- **`kaddo_telemetry_status`** — returns the current consent state, registration status,
  and pending events. Includes a consent notice when telemetry has not been configured.
- **`kaddo_set_telemetry_consent`** — sets consent to `enabled`, `disabled`, or `not-now`
  (defer for 24 hours). Requires `confirm: true` to apply.
- **`kaddo_project_status`** — includes a telemetry consent notice when consent is `unset`
  and no deferral is active.

The "not-now" option defers the notice for 24 hours without enabling or disabling telemetry.
After the deferral expires, the notice reappears in status responses.

Consent is shared across all interfaces: enabling via CLI is visible from MCP and vice versa.

## What data is sent

Only operational metadata:

- Event type (e.g. `command_executed`, `work_item_created`)
- Anonymous installation identifier (UUID, no personal identity)
- Kaddo version
- Interface (`cli`, `mcp`, `admin`, `agent`)
- Command name and duration
- Timestamps
- Boolean flags and safe enumerations

## What data is never sent

- Source code, file contents or diffs
- Work Item descriptions, acceptance criteria or knowledge content
- Prompts, LLM responses or Knowledge Capsule content
- Repository URLs, user names, emails or credentials
- API keys, tokens, private keys or environment variables

> **Principle:** observe how Kaddo is used without observing what users build.

## How to enable

```bash
kaddo telemetry enable
```

This persists `consent: enabled` in `.kaddo/config.yml`.

## How to disable

```bash
kaddo telemetry disable
```

When disabled, no network requests are made and no events are buffered.
Kaddo will not ask again after an explicit disable.

## How to check status

```bash
kaddo telemetry status
```

Shows the consent state (`unset`, `enabled` or `disabled`), whether the installation is
registered, and how many events are pending delivery.

## How it works

1. **Consent:** on the first interactive command, Kaddo asks once. The choice is stored as
   `consent: enabled` or `consent: disabled` with a `consentVersion`.
2. **Identity:** when enabled, Kaddo creates an anonymous installation identity
   (UUID + Ed25519 key pair) stored locally in `.kaddo/telemetry/`.
3. **Registration:** the public key is registered once with `telemetry.kaddo.org`.
4. **Signing:** every request is signed with Ed25519 to prove authenticity and prevent replay.
5. **Delivery:** events are sent in batches (up to 25) after each command. Failed deliveries
   are buffered locally (up to 100 events) and retried on the next command.
6. **Best-effort:** a telemetry failure never affects the command that generated it. Kaddo
   works fully offline.

## Re-enabling after disable

Disabling telemetry does not delete the anonymous identity. If you re-enable later, the same
installation ID is reused for continuity:

```bash
kaddo telemetry enable
```

## Non-interactive environments

Kaddo detects non-interactive execution by checking:

- `CI` environment variable
- `stdin` / `stdout` not attached to a TTY

In these cases, `unset` consent is treated as `disabled` — no prompt, no telemetry, no
interruption.

## Initialization

When running `kaddo init` interactively, the consent prompt is offered immediately after
project setup. This ensures the first opportunity to opt in happens at the earliest point.

## Existing projects

Projects created before the consent feature are migrated automatically:

| Previous config | Interpreted as |
|---|---|
| `telemetry.enabled: true` | `enabled` |
| `telemetry.enabled: false` (explicit) | `disabled` |
| No `telemetry` section | `unset` (prompt once) |

## Security

- The private key never leaves your machine (`.kaddo/telemetry/identity.json`).
- Requests use Ed25519 signatures with nonce-based anti-replay protection.
- The telemetry service validates signatures and rejects tampered or replayed requests.
- `.kaddo/telemetry/` is gitignored (under `.kaddo/`).

## Configuration

```yaml
# .kaddo/config.yml
telemetry:
  consent: enabled    # or: disabled
  consentVersion: 1
```
