---
type: feature
id: WI-002
title: Admin MVP Hardening & Release
status: completed
completed_at: '2026-09-27'
work_type: feature
created_at: '2026-09-27'
knowledge_level: K3
source:
  type: external
  imported_at: '2026-09-27'
  source_format: markdown-frontmatter
  source_hash: 8ed02667769b79a4b13a21c523a3dba55d0ca24890604c00945e6e31884cb3a7
  inferred: false
generated_by: kaddo-admin
depends_on:
  - VS-102
  - VS-103
  - VS-103A
  - VS-104
  - VS-105
  - VS-106
  - VS-106A
milestone:
  - Kaddo Admin MVP
domains:
  - Admin UI
  - Admin Server
  - CLI & System Context
  - Integrations
affected_modules:
  - packages/admin
  - packages/admin-server
  - packages/cli
  - packages/integrations
  - apps/docs
scope_confidence:
  level: high
  reasons:
    - All dependencies (VS-102 through VS-106A) are completed
    - Codebase explored — gaps are concrete and enumerable
    - No new domain capabilities — hardening only
ready_at: '2026-09-27'
---

# Admin MVP Hardening & Release

## Actor and outcome

**Actor:** Developer administering a Kaddo project through the Admin UI.

**Outcome:** The Admin MVP can be declared complete — all existing sections work together reliably, errors are isolated, security boundaries are enforced, states are clear, and documentation allows a user to complete the full journey without knowing the implementation.

## Current behavior

- Admin has 6 sections (Overview, Knowledge, Work Items, System, Integrations, External Items) — all functional on happy paths.
- **No ErrorBoundary** — a JS error in one section crashes the entire app.
- **No path traversal protection** in admin-server — route params (`workItemId`, `artifactId`, `integrationId`) passed to core without sanitization.
- **No admin-server tests** — zero test files.
- Empty states exist as a component (`EmptyState.tsx`) but coverage across all views is unverified.
- Loading states exist in route files but not audited for completeness.
- `.kaddo/` is gitignored at directory level (covers secrets implicitly, not explicitly).
- CSRF protection exists (VS-099), session auth with SameSite=strict cookies.
- 4 admin frontend test files exist, covering presentation and layout.
- Admin docs exist for integrations (EN/ES) but no unified Admin MVP guide.

## Target behavior

- Every section works together — a failure in Integrations doesn't break Knowledge or Work Items.
- Path parameters are validated before reaching core functions — no path traversal possible.
- Empty, loading, error, and success states are present in all main views.
- Destructive actions require confirmation.
- Secrets never leak into API responses, logs, or error messages.
- Browser refresh and direct route access work.
- CLI and Admin operate on the same source of truth without sync.
- Admin-server has test coverage for critical paths.
- Documentation covers the full MVP journey.
- All existing test suites continue passing (regression safety).

## Problem

The Admin has all the features for an MVP but has not been hardened as a product. Security gaps (path traversal), stability gaps (no error boundary), and operational gaps (no admin-server tests, incomplete documentation) prevent declaring it complete.

## Expected result

After closing this WI, Kaddo Admin can be declared:

```
Kaddo Admin MVP ✅ Complete
```

The full journey works on a real project: `kaddo admin` → Overview → Knowledge → Work Items → System → Integrations → Jira → External Items → Import → Kaddo Work Item → Refinement Handoff.

## Entry points

1. `kaddo admin` — CLI command that starts the admin server
2. Browser at `http://localhost:<port>` — all routes
3. Admin Server API at `/api/v1/admin/*` — all endpoints

## End-to-end flow

```
User → kaddo admin → Validate project → Start server → Display URL
  → Browser → Overview (project context)
  → Knowledge (navigate artifacts)
  → Work Items (list → detail → refinement)
  → System (topology view)
  → Integrations (add Jira → configure → verify → save)
  → External Items (discover → filter → search → paginate)
  → Import (select → import → draft WI created)
  → Work Item detail (provenance + snapshot + refinement handoff)
```

## Surfaces review

| Surface | Status | Notes |
|---------|--------|-------|
| Admin UI (React) | affected | ErrorBoundary, empty/loading/error states, UI consistency, a11y baseline, responsive |
| Admin Server (Fastify) | affected | Path traversal protection, error contract, error sanitization, log safety |
| Admin API types | reviewed-not-affected | Schemas already cover current needs |
| CLI (`kaddo admin`) | reviewed-not-affected | Startup command already exists |
| Kaddo Core | reviewed-not-affected | Core functions are stable; hardening is at Admin layer |
| Integrations | reviewed-not-affected | Jira adapter already hardened in VS-106A |
| Database | not-applicable | No domain database — artifacts are source of truth |
| Documentation | affected | Admin guide, Jira quickstart, MVP limitations |
| Operations/Release | affected | Version bump, release notes |

## Module coverage

| Module | Status | What changes |
|--------|--------|-------------|
| `packages/admin` | affected | ErrorBoundary, empty/loading/error states audit, UI consistency pass, a11y, responsive, button hierarchy |
| `packages/admin-server` | affected | Path traversal guard, API error contract, error sanitization, log safety, tests |
| `packages/cli` | reviewed-not-affected | Startup already works |
| `packages/integrations` | reviewed-not-affected | Already hardened |
| `packages/mcp` | reviewed-not-affected | Not in scope |
| `apps/docs` | affected | Admin documentation EN/ES |

## Scope

1. **Security:** path traversal protection on all endpoints accepting IDs/paths; secret leak audit on API responses, errors, logs; verify `.gitignore` covers secrets
2. **Error isolation:** React ErrorBoundary wrapping each route section; error states in all views
3. **View states:** audit and complete empty, loading, error, success states across all 6 sections
4. **UI consistency:** button hierarchy (primary/secondary/destructive), status badges, spacing, typography pass
5. **Navigation:** browser refresh works on detail routes; browser back behaves correctly; detail views have back navigation
6. **Destructive actions:** delete integration confirmation dialog; imported WIs survive integration deletion
7. **Admin-server tests:** security tests (path traversal, secret safety), persistence tests, API contract
8. **Admin UI tests:** navigation, empty/loading/error states, provider catalog, integration CRUD, import flow
9. **CLI/Admin interoperability test:** verify shared source of truth
10. **Responsive baseline:** desktop + narrow desktop usable
11. **Accessibility baseline:** labels on inputs, focusable buttons, keyboard navigation, visible focus
12. **Documentation:** Admin guide EN/ES, Jira quickstart, MVP limitations, release notes
13. **Release:** version bump, release notes

## Out of scope

- New providers (GitHub, Azure DevOps, Linear)
- OAuth/OIDC/SSO/advanced RBAC
- Enterprise secret managers (AWS Secrets Manager, Vault)
- Webhooks, background sync, bidirectional sync, auto-import
- Real-time collaboration, multi-project management
- Plugin marketplace, adapter SDK
- Filesystem live watching (refresh is sufficient for MVP)
- Mobile-first (desktop + tablet is sufficient)
- WCAG certification (baseline only)

## Acceptance criteria

### Functional

- [ ] AC-01: Admin starts via `kaddo admin` with clear output
- [ ] AC-02: Invalid project produces a clear error message
- [ ] AC-03: All 6 sections accessible via navigation; active section identifiable
- [ ] AC-04: Overview shows project, knowledge, WIs, system, integrations state
- [ ] AC-05: Knowledge loads from project artifacts (not a database copy)
- [ ] AC-06: Work Items list, detail, status, refinement work for native and imported WIs
- [ ] AC-07: System handles present, partial, absent, and invalid system context
- [ ] AC-08: Integration full lifecycle: catalog → configure → verify → save → enable/disable → delete
- [ ] AC-09: External Items: discovery, filters, search, pagination, import
- [ ] AC-10: Import shows loading/success/already-imported/failure feedback
- [ ] AC-11: Imported WIs preserve provenance, original snapshot, and refinement handoff

### Architectural

- [ ] AC-12: Admin reads from project artifacts — no domain database
- [ ] AC-13: Mutations go through Kaddo Core, not direct file writes
- [ ] AC-14: CLI and Admin operate on same `integrations.yml` — changes visible after refresh
- [ ] AC-15: Restart reconstructs state from project artifacts

### Security

- [ ] AC-16: Path traversal prevented on all endpoints accepting IDs or paths
- [ ] AC-17: Secrets not exposed in API responses, errors, or logs
- [ ] AC-18: `.kaddo/.secrets.json` excluded from git
- [ ] AC-19: Error details sanitized — no credentials, tokens, or filesystem secrets

### Stability

- [ ] AC-20: ErrorBoundary isolates section failures — Jira down doesn't break Knowledge
- [ ] AC-21: All 6 sections have empty states
- [ ] AC-22: Operations with latency show loading feedback
- [ ] AC-23: Destructive actions (delete integration) require confirmation
- [ ] AC-24: Confirmation dialog states imported WIs are not deleted
- [ ] AC-25: Imported WIs work after integration deletion

### Navigation

- [ ] AC-26: Browser refresh works on detail routes (`/work-items/WI-005`)
- [ ] AC-27: Browser back works without errors
- [ ] AC-28: Detail views have breadcrumbs or back navigation
- [ ] AC-29: Direct route access works

### UI Quality

- [ ] AC-30: Button hierarchy: primary, secondary, destructive
- [ ] AC-31: Status badges consistent across all views
- [ ] AC-32: Provider identity (name + icon) consistent across all views
- [ ] AC-33: Form validation on required fields before submit
- [ ] AC-34: Responsive at desktop and narrow desktop
- [ ] AC-35: Accessibility baseline: labels, focus, keyboard navigation

### Tests

- [ ] AC-36: Admin-server security tests (path traversal, secret safety)
- [ ] AC-37: Admin-server API contract tests
- [ ] AC-38: Admin UI test coverage for main flows
- [ ] AC-39: CLI/Admin interoperability test
- [ ] AC-40: All existing test suites pass (regression)

### Documentation & Release

- [ ] AC-41: Admin documentation EN/ES covers full MVP journey
- [ ] AC-42: Jira quickstart guide
- [ ] AC-43: MVP limitations explicitly documented
- [ ] AC-44: Release notes declare Kaddo Admin MVP

## Validation

1. **Security:** write path-traversal payloads (`../../../etc/passwd`, absolute paths) against each endpoint — all rejected
2. **Secret safety:** grep API response schemas and error handlers for secret fields — none found
3. **Error isolation:** kill Jira connectivity → External Items shows error → Knowledge/WIs still work
4. **View states:** navigate each section with empty project, partial project, full project — no crashes, meaningful messages
5. **Navigation:** refresh each detail route — content reconstructs from project
6. **Persistence:** make changes → restart admin → verify state intact
7. **Interoperability:** edit `integrations.yml` via CLI → refresh Admin → see changes
8. **Smoke test:** complete the full MVP journey on this Kaddo project
9. **Tests:** `npx vitest run` → all pass; `pnpm run build` → all pass

## Release gates

| Gate | Criteria |
|------|----------|
| Functional | All 6 sections + import + refinement work e2e |
| Architectural | Single source of truth, no domain database |
| Security | Path safety, secret safety, git safety, error sanitization |
| Operational | Startup, restart, navigation, states, docs, smoke test |

## Scope unknowns

- Exact number of endpoints needing path traversal guards (need to audit all route registrations)
- Whether any existing error messages leak internal paths or secrets (need grep audit)
- Whether all 6 sections actually use the EmptyState component consistently

## Open questions

None blocking — all dependencies are complete and the scope is enumerable.

## Dependencies

All resolved:
- VS-102 (Admin Foundation) ✅
- VS-103 (Integration Foundation) ✅
- VS-103A (Schema Validation) ✅
- VS-104 (System Map) ✅
- VS-105 (Import Provenance) ✅
- VS-106 (Jira Adapter) ✅
- VS-106A (Jira Hardening) ✅

## Definition of done

- All 44 acceptance criteria pass
- All 4 release gates pass
- Full MVP smoke test passes on this project
- Documentation EN/ES published
- Version bumped and tagged
- Release notes published

## Learning

Hardening a multi-package Admin MVP across 12 phases and 44 acceptance criteria produced several reusable insights:

1. **Path traversal guards belong in the adapter layer, not in route handlers.** Placing `assertIntegrationId` and `assertSecretName` in `core-adapter.ts` means every route is protected without per-handler discipline. Framework-level URL normalization (Fastify strips `../` before the handler) is not sufficient — payloads like `my..int`, `.hidden`, and embedded `/` or `\` survive URL routing and must be caught at the application layer.

2. **React ErrorBoundary must be a class component.** `getDerivedStateFromError` and `componentDidCatch` have no hooks equivalent. TanStack Router's `errorComponent` prop on each route definition is the correct integration point — it receives `{ error, reset }` and composes naturally with the router.

3. **Shared style constants eliminate per-file drift.** Extracting `btnStyle`, `primaryBtnStyle`, `dangerBtnStyle` into `primitives.tsx` removed 3 redundant definitions and ensured visual consistency across Integrations, ExternalWorkItems, and future views.

4. **`kaddo learn` cannot find WIs in subdirectories.** `findWorkItemFile` only reads the top-level of `work-items/`, not `ready/`, `completed/`, etc. WIs transitioned via `kaddo ready` become invisible to `kaddo learn`. This is a known bug to fix in a future iteration.

5. **Test infrastructure for admin-server using `app.inject()` + `fakeStorage()` is lightweight and effective.** 25 security tests covering input validation, session protection, CSRF, and error envelope shape run in under 2 seconds with no external dependencies.

6. **Documentation mirroring (EN/ES) at guide level catches terminology drift early.** Writing both languages in the same session ensures consistency in command names, section structure, and technical terms.
