---
type: module-design
module: platform-infra
status: draft
owner: platform-team
repoPath: ../infra
capabilities: [provisioning, event-bus]
code:
  - ../infra/**
---

# Platform Infra — Design

> Illustrative: refined output of the `module-design-agent` over the CLI scaffold,
> aligned to the Kaddo `module-design` template. Review before using.

**Type:** infrastructure
**Repository:** ../infra
**Main technology:** Terraform
**Owner:** platform-team

## Purpose

Provisions the shared substrate: managed Postgres, the event bus, and service
networking. The other three modules depend on what this repo defines.

## Boundaries

- Owns cloud resources and the event-bus topology.
- Does not contain application logic.

## Inputs / Outputs

- **In:** Terraform variables per environment.
- **Out:** provisioned database, event bus, DNS, secrets wiring.

## Dependencies

- None internal — this is the base layer.

## Related capabilities

- provisioning
- event-bus

## Risks & open questions

- Bus retention/DLQ policy is not yet documented (open question).

## Quality checklist

- [x] Boundaries make clear what is in and out of the module.
- [x] Dependencies on other modules are listed.
