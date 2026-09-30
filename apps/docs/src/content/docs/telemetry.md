---
title: Telemetry
description: Anonymous usage telemetry — what it is, how to enable it, what data is sent and what is never sent.
---

Kaddo can optionally send **anonymous usage metadata** to `telemetry.kaddo.org`.
Telemetry is **disabled by default** and must be explicitly enabled.

## What telemetry is

Telemetry helps the Kaddo team understand how the toolkit is used — which commands run most
often, how long they take, and which lifecycle stages are adopted. This data informs where to
invest development effort.

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

This sets `telemetry.enabled: true` in `.kaddo/config.yml`.

## How to disable

```bash
kaddo telemetry disable
```

When disabled, no network requests are made and no events are buffered.

## How to check status

```bash
kaddo telemetry status
```

Shows whether telemetry is enabled, whether the installation is registered, and how many
events are pending delivery.

## How it works

1. **Identity:** when enabled, Kaddo creates an anonymous installation identity
   (UUID + Ed25519 key pair) stored locally in `.kaddo/telemetry/`.
2. **Registration:** the public key is registered once with `telemetry.kaddo.org`.
3. **Signing:** every request is signed with Ed25519 to prove authenticity and prevent replay.
4. **Delivery:** events are sent in batches (up to 25) after each command. Failed deliveries
   are buffered locally (up to 100 events) and retried on the next command.
5. **Best-effort:** a telemetry failure never affects the command that generated it. Kaddo
   works fully offline.

## Security

- The private key never leaves your machine (`.kaddo/telemetry/identity.json`).
- Requests use Ed25519 signatures with nonce-based anti-replay protection.
- The telemetry service validates signatures and rejects tampered or replayed requests.
- `.kaddo/telemetry/` is gitignored (under `.kaddo/`).

## Configuration

```yaml
# .kaddo/config.yml
telemetry:
  enabled: false  # default
```
