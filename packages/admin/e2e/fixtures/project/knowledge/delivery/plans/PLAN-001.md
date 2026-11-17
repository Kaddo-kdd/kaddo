---
type: delivery-plan
id: PLAN-001
title: Wasma Technical Roadmap
status: in-progress
objective: Build the Wasma runtime across RM-01..RM-09.
milestones:
  - id: RM-01
    title: Foundations
    exit_criteria:
      - Schema defined
      - Bootstrap script runs
    exit_verifications:
      - criterion: Schema defined
        status: passed
        evidence: Schema reviewed and merged
        reference: schema.md
        verified_by: ana
      - criterion: Bootstrap script runs
        status: passed
        evidence: CI boot job green
        reference: ci-run-2043
        verified_by: ana
  - id: RM-02
    title: Data Model
    exit_criteria:
      - Entities modeled
      - Migrations reversible
    exit_verifications:
      - criterion: Entities modeled
        status: passed
        evidence: ERD approved
        reference: erd.md
      - criterion: Migrations reversible
        status: failed
        evidence: Down migration drops a column with data
        reference: mig-0007
  - id: RM-03
    title: API Surface
    exit_criteria:
      - Endpoints documented
      - Contract tests green
  - id: RM-04
    title: Authentication
    exit_criteria:
      - Threat model reviewed
    exit_verifications:
      - criterion: Threat model reviewed
        status: manual-review-required
        evidence: Awaiting security team sign-off
  - id: RM-05
    title: Observability
    exit_criteria:
      - Dashboards live
    exit_verifications:
      - criterion: Dashboards live
        status: passed
        evidence: Grafana board published
        reference: obs-12
        verified_by: lee
  - id: RM-06
    title: Migration
    exit_criteria:
      - Cutover rehearsed
      - legacy_structured: true
  - id: RM-07
    title: Integrations
    exit_criteria: []
  - id: RM-08
    title: Performance & Concurrency
    exit_criteria:
      - Benchmark evidence reviewed
      - Worker isolation verified
  - id: RM-09
    title: Hardening
    exit_criteria:
      - Security review signed off
success_criteria:
  - All milestones closed
  - legacy_structured: true
---
# Wasma Technical Roadmap
