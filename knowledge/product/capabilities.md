---
type: capabilities
project_state: ai-assisted
generated_by: kaddo-bootstrap
template_version: 1
refined_by: capability-agent
---

> Idioma del proyecto: **español**. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Capacidades de Kaddo

Inventario basado en el Context Pack y en rutas comprobadas del monorepo. Describe comportamiento actual, no promesas de producto.

## Resumen

Kaddo es un toolkit local-first de Knowledge-Driven Development. Gestiona conocimiento versionable en las capas Business, Product, Tech y Delivery; estructura el lifecycle de Work Items y permite explorar el mismo estado mediante CLI, MCP y Admin. Actualmente existen 59 Work Items materializados, cinco iniciativas y módulos para CLI, MCP, Admin, API local, integraciones y documentación.

## Capability Map

### Gestión de conocimiento y contexto

**Descripción:** inicializa, escanea, estructura y entrega conocimiento persistente como contexto para personas y agentes.

**Evidence:**

- `packages/cli/src/index.ts`: comandos `init`, `scan`, `bootstrap`, `context`, `understand`, `explain`, `status` y `questions`.
- `packages/cli/src/core/context-pack.ts`, `project-route.ts` y `next-step.ts`.
- Salidas locales `.kaddo/context-pack.md` y `.kaddo/understand.md`.

**Related folders or modules:** `packages/cli`, `.kaddo/`, `knowledge/`.

**Possible domain:** Gestión de conocimiento.

**Confidence:** High.

**Open questions:**

- [open] ¿Qué métricas permitirán medir si el Context Pack reduce ambigüedad durante la entrega?

---

### Lifecycle de Work Items y evidencia

**Descripción:** captura intención, permite refinamiento, transiciones del lifecycle, handoff y evidencia verificable.

**Evidence:**

- `packages/cli/src/index.ts`: `create`, `ready`, `work-item import`, `verify`, `learn`, `history` y `classify`.
- `packages/cli/src/core/work-items.ts`, `implementation-handoff.ts` y `reporting-evidence.ts`.
- `knowledge/delivery/work-items/` incluye los WIs 060–068; `WI-068` documenta la revisión e integración de Kaddo Power.
- `packages/admin-server/src/core-adapter.ts` y `packages/admin/src/routes/WorkItemDetail.tsx`.

**Related folders or modules:** `packages/cli`, `packages/admin-server`, `packages/admin`, `knowledge/delivery/work-items/`.

**Possible domain:** Delivery y trazabilidad.

**Confidence:** High.

**Open questions:**

- [open] ¿Qué evidencia mínima debe exigirse según el knowledge level de un Work Item?

---

### Agentes, skills y acceso MCP

**Descripción:** provee instrucciones y flujos reutilizables para agentes, además de herramientas MCP para conocimiento y lifecycle controlado.

**Evidence:**

- `knowledge/agents/` y `knowledge/skills/`, incluidos `work-item-refinement` y `evidence-verification`.
- `packages/cli/src/commands/agents.ts` y `packages/cli/src/commands/skills.ts`.
- `packages/mcp/src/server.ts` registra herramientas para recursos, integraciones, evidencia, iniciativas y telemetría.
- `packages/mcp/src/resources.ts` y `packages/mcp/tests/tools.test.ts`.

**Related folders or modules:** `packages/mcp`, `packages/cli`, `knowledge/agents/`, `knowledge/skills/`.

**Possible domain:** Automatización asistida por IA.

**Confidence:** High.

**Open questions:**

- [open] ¿Qué señales deben decidir el subconjunto de agentes y skills a instalar por tipo de proyecto?

---

### Reportes de impacto, drift y savings

**Descripción:** genera reportes para priorizar trabajo, revisar riesgos de desalineación y explicar estimaciones conservadoras de ahorro.

**Evidence:**

- `packages/cli/src/index.ts`: `report impact`, `impact`, `savings` y `drift`.
- `packages/cli/src/core/impact-report.ts`, `drift-report.ts`, `savings.ts`, `reporting-evidence.ts` y `graph-hints.ts`.
- `packages/admin/src/routes/Reports.tsx`, `packages/admin-server/src/core-adapter.ts` y `packages/admin-server/tests/reports.test.ts`.
- WIs 060–064 en `knowledge/delivery/work-items/completed/`.

**Related folders or modules:** `packages/cli`, `packages/mcp`, `packages/admin-server`, `packages/admin`, `.kaddo/reports/`.

**Possible domain:** Inteligencia de entrega.

**Confidence:** High.

**Open questions:**

- [open] ¿Cómo se calibrarán las estimaciones de Savings con datos reales manteniendo su carácter conservador?

---

### Administración visual del proyecto

**Descripción:** permite explorar conocimiento, Work Items, integraciones, deprecaciones, grafo y reportes desde una interfaz local sin duplicar la fuente de verdad.

**Evidence:**

- `packages/admin/src/App.tsx` y `components/Sidebar.tsx`.
- Rutas `KnowledgeArtifact.tsx`, `WorkItemDetail.tsx`, `Deprecations.tsx` y `Reports.tsx`.
- `packages/admin-server/src/server.ts`, `core-adapter.ts` y `contracts/schemas.ts`.
- `packages/admin/src/components/MarkdownRenderer.tsx` y `markdown.css` para lectura Markdown en light/dark.

**Related folders or modules:** `packages/admin`, `packages/admin-server`.

**Possible domain:** Experiencia operativa.

**Confidence:** High.

**Open questions:**

- [open] ¿Qué flujos requieren validación adicional con equipos que utilicen Kaddo fuera de este repositorio?

---

### Integraciones, recursos e iniciativas

**Descripción:** conecta sistemas externos, normaliza Work Items para importación confirmada por personas y modela recursos e iniciativas como contexto.

**Evidence:**

- `packages/integrations/` implementa adapters, provider registry, secret management y normalización de external work items.
- `packages/cli/src/index.ts` registra `integrations`, `resources` e `initiative`; la lógica está en `packages/cli/src/core/resources.ts` y los archivos `initiative*.ts`.
- `packages/mcp/src/server.ts` expone estas superficies al MCP.
- `.kaddo/modules.yml` declara el módulo `integrations`; `knowledge/tech/resources/` almacena Project Resources.

**Related folders or modules:** `packages/integrations`, `packages/cli`, `packages/mcp`, `knowledge/tech/resources/`.

**Possible domain:** Conectividad y planificación.

**Confidence:** High.

**Open questions:**

- [open] ¿Qué segundo provider validará que la foundation es independiente de Jira?

---

### Documentación, distribución y extensiones

**Descripción:** publica documentación bilingüe, proyecta conocimiento para herramientas de agentes y distribuye las capacidades de Kaddo.

**Evidence:**

- `apps/docs/` y `apps/docs/src/content/docs/es/`.
- `packages/cli/src/commands/adapters.ts` genera adaptadores para Codex, Claude, Kiro, OpenCode y Antigravity.
- `kaddo-power/dev.kiro/steering/` fue actualizado por la PR #5.
- `README.md`, `.github/workflows/ci.yml` y `.github/workflows/release.yml`.

**Related folders or modules:** `apps/docs`, `kaddo-power`, `packages/cli`, `.github/workflows/`.

**Possible domain:** Adopción y ecosistema.

**Confidence:** High.

**Open questions:**

- [open] ¿Qué contrato de compatibilidad se ofrecerá a extensiones de terceros?

## Cross-cutting Concerns

- **Local-first:** CLI, MCP y Admin operan sobre los mismos artifacts versionables; no existe una base de datos paralela.
- **Control humano:** importaciones y mutaciones relevantes del lifecycle requieren confirmación explícita.
- **Evidencia y seguridad:** Project Resources guardan referencias de autenticación, no secretos; la telemetría es opcional y el capsule `kaddo-telemetry` documenta protección criptográfica y ausencia de PII.
- **Accesibilidad:** el sistema visual usa tokens semánticos y soporta light/dark para sitio, blog y Admin.

## Risks

- La cobertura de ownership es 64%; rutas sin ownership reducen la precisión de Guard e Impact.
- Los módulos están mapeados pero aparecen como `not_configured` en el Context Pack, por lo que todavía faltan señales de contexto por módulo.
- Savings aún no está calibrado con datos reales.

## Open Questions

- [open] ¿Cómo debe evolucionar el System Graph/Map como fuente de contexto para agentes?
- [open] ¿Qué artifacts son obligatorios u opcionales según el tipo y nivel de un Work Item?
- [open] ¿Qué mecanismos de source drift aportan valor sin convertir a Kaddo en un issue tracker externo?

## Suggested Next Step

Usar `roadmap-agent` para revisar candidatos existentes con esta taxonomía y asociar cada uno a un dominio y una capacidad antes de materializar trabajo nuevo.

────────────────────────
Agent: capability-agent

Produced:
knowledge/product/capabilities.md

Next:
roadmap-agent
────────────────────────
