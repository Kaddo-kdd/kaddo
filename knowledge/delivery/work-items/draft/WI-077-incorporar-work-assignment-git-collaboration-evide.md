---
type: feature
id: WI-077
title: Incorporar Work Assignment & Git Collaboration Evidence en Kaddo
status: draft
work_type: feature
created_at: '2026-11-04'
source:
  type: external
  imported_at: '2026-11-04'
  source_format: kaddo-frontmatter
  source_hash: 15437c8a776dda8eec7ced010d060c825c156b6fe6c31498e0d6974a32198003
  inferred: false
generated_by: kaddo-admin
knowledge_level: K4
domains: [Product, Tech, Delivery]
affected_modules: [cli, mcp, admin-server, admin, docs]
code:
  - packages/cli/src/core/collaboration.ts
  - packages/cli/src/services/git.ts
  - packages/cli/src/core/work-items.ts
  - packages/cli/src/core/work-item-write.ts
  - packages/cli/src/commands/collaboration.ts
  - packages/mcp/src/collaboration.ts
  - packages/mcp/src/server.ts
  - packages/admin-server/src/core-adapter.ts
  - packages/admin-server/src/server.ts
  - packages/admin/src/routes/WorkItemDetail.tsx
  - packages/admin/src/routes/WorkItemEditor.tsx
  - packages/admin/src/routes/InitiativeDetail.tsx
scope_confidence:
  level: high
  reason: Existing planning, Work Item persistence, CLI, MCP and Admin layers provide the required extension points; Git evidence remains deliberately read-only and bounded.
refined_by: work-item-agent
summary: Incorporar Work Assignment & Git Collaboration Evidence en Kaddo
original_snapshot:
  title: Incorporar Work Assignment & Git Collaboration Evidence en Kaddo
  type: feature
  status: draft
---

# WI-077 — Work Assignment & Git Collaboration Evidence

## Refinement

**Outcome:** a person can declare owners and contributors on a Work Item or Initiative, then compare that planning responsibility with bounded, local Git evidence without treating Git authorship as ownership.

**Implementation boundary:** Core owns parsing and writing canonical metadata. CLI, MCP and Admin Server expose Core projections; Admin consumes those APIs. Git inspection is local, read-only, time-bounded and restricted to the core repository plus repositories explicitly mapped in `.kaddo/modules.yml`. Commits need an exact Work Item identifier; branch matches are contextual only; file overlap never creates attribution.

**Verification boundary:** no remote APIs, no Git mutations, no lifecycle transition from observed activity, and no generated collaboration evidence is persisted into canonical Work Item or Initiative artifacts. The final closure remains gated on API/CLI/MCP validation and Admin light, dark and narrow-screen review.

## 1. Context

Kaddo incorporó una estructura de planificación mediante:

- WI-074: Delivery Plans y Epics.
- WI-075: Unified Planning Experience.
- WI-076: Planning Management desde Admin.

Actualmente es posible estructurar el trabajo como:

```text
Delivery Plan
  └── Milestone
       └── Epic
            └── Initiative
                 └── Work Item
```

Las Initiatives pueden declarar `owners` y `contributors`, pero la asignación desde Admin todavía es limitada y los Work Items no cuentan con un contrato uniforme de responsabilidad individual.

Además, Kaddo no dispone de una proyección que relacione explícitamente las contribuciones observadas en Git con las entidades de planificación.

Esto impide responder de manera fiable quién es responsable de una feature, quién ha contribuido a su implementación y qué evidencia respalda esa actividad.

## 2. Problem

En proyectos colaborativos, especialmente aquellos desarrollados por varias personas o agentes, la información de responsabilidad y actividad está distribuida entre:

- Work Items.
- Initiatives.
- Branches.
- Commits.
- Historial de implementación.
- Metadatos de Git.

Actualmente, observar un Work Item en Admin no permite distinguir con claridad su responsabilidad declarada de la actividad efectivamente registrada.

Las Epics y Delivery Plans tampoco permiten obtener una vista consolidada de colaboradores y contribuciones vinculadas.

El objetivo no es transformar Kaddo en un sistema de seguimiento de empleados ni replicar GitHub Projects, sino incorporar trazabilidad de colaboración al flujo de desarrollo.

## 3. Expected Outcome

El usuario podrá:

1. Asignar responsables y colaboradores a un Work Item.
2. Gestionar los responsables y colaboradores de una Initiative.
3. Consultar quién tiene asignada una feature.
4. Consultar contribuciones Git vinculadas explícitamente a un Work Item.
5. Identificar autores, fechas, commits y branches locales asociadas.
6. Diferenciar responsabilidad declarada de contribución observada.
7. Identificar trabajo sin responsable declarado.
8. Consultar actividad agregada en Initiatives, Epics y Plans.
9. Actualizar la información Git bajo demanda.
10. Navegar desde una contribución hacia el Work Item relacionado.

El comportamiento será local-first, determinístico y de solo lectura respecto a Git.

---

# 4. Conceptual Model

Separar tres dimensiones.

## 4.1 Declared Responsibility

Representa quién tiene responsabilidad formal o participación prevista en el trabajo.

Fuente: metadata canónica.

Campos:

- `owners`: responsables declarados.
- `contributors`: colaboradores declarados.

Son independientes del lifecycle y no confieren permisos.

## 4.2 Observed Git Activity

Representa actividad verificable obtenida desde repositorios Git.

Señales:

- Commit SHA.
- Autor registrado.
- Committer, cuando sea relevante.
- Fecha.
- Branch local asociada.
- Repositorio.
- Archivos modificados.
- Referencias a Work Items.

La identidad Git no equivale automáticamente a una persona asignada.

## 4.3 Work Item Attribution

Representa el vínculo entre una contribución y una unidad ejecutable de Kaddo.

El vínculo requiere evidencia identificable, no simples coincidencias semánticas.

Ejemplo:

```text
Work Item: AN-065

Declared responsibility
  Owners:
    developer-a
  Contributors:
    developer-b

Observed Git activity
  3 linked commits
  2 observed authors
  1 related local branch

Attribution
  Explicit WI reference: 2 commits
  Branch association: 1 possible contribution
```

Los valores son ilustrativos.

La información agregada debe indicar la procedencia y nivel de certeza.

---

# 5. Work Item Assignment

## 5.1 Canonical Metadata

Extender el contrato opcional de Work Items:

```yaml
---
type: feature
id: WI-077
title: Work Assignment & Git Collaboration Evidence
status: in-progress

owners:
  - developer-a

contributors:
  - developer-b
---
```

Los campos serán opcionales.

Los Work Items existentes sin estos campos deben seguir siendo válidos.

No incorporar un campo `assigned_to` adicional que replique el concepto de `owners`.

## 5.2 Semantics

**Owner**

Persona o equipo responsable de coordinar el resultado del Work Item.

**Contributor**

Persona o equipo que tiene una participación declarada en su desarrollo.

No asumir que un Contributor realizó commits.

No convertir al autor de un commit automáticamente en Contributor declarado.

## 5.3 Core Integration

Extender:

- Work Item read model.
- Work Item edit model.
- Work Item serialization.
- Work Item validation.
- Work Item update operations.

Conservar la edición existente sin pérdida de información y con optimistic concurrency.

No modificar automáticamente:

- Status.
- Acceptance Criteria.
- Implementation Status.
- Validation Status.
- Release Status.
- Completion Readiness.

## 5.4 Initiative Responsibility

Reutilizar los campos existentes:

```yaml
owners:
  - developer-a
contributors:
  - developer-b
```

Permitir editarlos desde Admin.

Los Work Items asociados a una Initiative **no deben heredar automáticamente sus responsables como asignaciones canónicas**.

Admin puede mostrar el contexto de responsabilidad de la Initiative, claramente identificado como tal.

Diferenciar la responsabilidad de trabajo de los ownership globs y responsables de dominio que Kaddo utiliza para Guard.

---

# 6. Git Observation Architecture

## 6.1 Architectural Boundary

Preservar la separación de responsabilidades:

```text
Local Git Repositories
         |
         v
Read-only Git Adapter
         |
         v
Normalized Git Evidence
         |
         v
Deterministic Correlation Core
         |
         v
Work Item Collaboration Projection
         |
         v
Admin / CLI / MCP
```

El Git Adapter realiza operaciones de lectura.

El Core de correlación transforma y relaciona datos normalizados, sin ejecutar directamente procesos Git.

Reutilizar o extender `packages/cli/src/services/git.ts` y la infraestructura existente cuando corresponda.

Documentar explícitamente que Kaddo puede realizar operaciones Git de lectura, pero nunca mutaciones de repositorio en este flujo.

## 6.2 Allowed Operations

Permitir únicamente operaciones de consulta equivalentes a:

- `git rev-parse`.
- `git log`.
- `git show`.
- `git for-each-ref`.
- `git diff --name-only`, cuando resulte necesario.

Prohibir:

- Commit.
- Push.
- Pull.
- Fetch.
- Checkout.
- Merge.
- Rebase.
- Reset.
- Branch creation/deletion.
- Modificaciones del índice o working tree.

Ejecutar argumentos de Git de forma estructurada, sin interpolación de shell.

## 6.3 Repository Scope

Soportar inicialmente:

- Repositorio Git local del proyecto.
- Repositorios locales adicionales declarados mediante mappings existentes, cuando sean accesibles.

Cada evidencia debe conservar un identificador de repositorio.

En proyectos multirepo, no mezclar commits de repositorios diferentes aunque tengan referencias similares.

No descubrir ni consultar repositorios arbitrarios fuera del alcance declarado del proyecto.

Validar las rutas antes de iniciar cualquier lectura Git.

## 6.4 Bounded Collection

La observación debe tener límites configurables.

Definir:

- Máximo de commits evaluados.
- Ventana temporal opcional.
- Branches locales incluidas.
- Tiempo máximo de ejecución.
- Límite de tamaño de resultados.

Usar valores predeterminados conservadores.

La ausencia de Git o un repositorio inaccesible no debe impedir que Planning funcione.

No escanear indefinidamente toda la historia en cada navegación.

No instalar hooks, procesos residentes ni monitoreo automático.

---

# 7. Git-to-Work-Item Correlation

Implementar una correlación determinística, explicable y conservadora.

## 7.1 Explicit Commit Reference

Considerar una referencia explícita cuando el mensaje de commit contiene un identificador exacto de un Work Item existente.

Ejemplos:

```text
feat(runtime): implement bounded worker pool (AN-065)

fix(auth): correct token expiration (WI-032)
```

Los identificadores deben obtenerse de los Work Items existentes.

No asumir que todos usan el prefijo `WI-`.

Validar límites del token para evitar coincidencias parciales.

La evidencia debe mostrar qué referencia produjo el vínculo.

Una referencia explícita demuestra que el commit menciona el trabajo, pero no certifica por sí sola que toda su implementación corresponda a ese Work Item.

## 7.2 Branch Association

Detectar asociaciones desde nombres de branches locales compatibles con la Git Strategy declarada.

Ejemplo:

```text
feature/AN-065-bounded-worker-pool
```

Clasificar estas asociaciones como evidencia contextual, diferenciándolas de una referencia explícita dentro del commit.

Una branch con un ID válido no demuestra que todos sus commits pertenezcan exclusivamente a ese Work Item.

No atribuir commits ambiguos automáticamente por estar contenidos en esa branch.

## 7.3 File Overlap

La coincidencia entre archivos modificados y `affected_modules` o globs de un Work Item puede utilizarse como pista de revisión futura.

No debe establecer por sí sola una atribución confirmada.

No presentar un commit como implementador de una feature únicamente porque modificó un archivo relacionado.

## 7.4 Attribution Classification

Proponer el siguiente modelo:

- `explicit-reference`: referencia exacta del Work Item en un commit.
- `branch-associated`: asociación contextual de una branch local.
- `unattributed`: no existe evidencia suficiente para relacionar la actividad con un Work Item.

No crear una clasificación `confirmed-implementation` basada únicamente en Git.

Mantener la información necesaria para explicar cada resultado.

## 7.5 Identity Handling

Distinguir:

- Commit author.
- Committer.
- Co-author, cuando esté registrado mediante convenciones reconocidas.

No asumir que todos representan personas diferentes.

No unificar identidades por coincidencias parciales de nombre.

No exponer direcciones de correo electrónico innecesariamente en Admin.

No realizar evaluaciones individuales de productividad ni rankings de colaboradores.

---

# 8. Collaboration Projection

Crear un contrato de lectura sobre Core.

Modelo conceptual:

```typescript
type WorkItemCollaboration = {
  workItemId: string

  responsibility: {
    owners: string[]
    contributors: string[]
  }

  git: {
    availability: 'available' | 'partial' | 'unavailable'
    repositories: string[]
    observedAuthors: string[]
    linkedCommits: GitCommitEvidence[]
    relatedBranches: GitBranchEvidence[]
    unattributedActivityCount: number
    inspectedAt: string | null
    coverage: GitCoverage
  }
}
```

Los tipos definitivos deben seguir las convenciones públicas de Core.

Cada evidencia de commit debe conservar al menos:

- Repositorio.
- SHA.
- Autor.
- Fecha.
- Subject.
- Rutas modificadas, dentro de límites.
- Clasificación de atribución.
- Referencia que fundamentó la asociación.

Evitar guardar duplicadamente el historial Git en los artifacts canónicos.

La observación puede mantenerse en memoria o en una proyección derivada regenerable, nunca como segunda fuente de verdad.

---

# 9. Aggregated Collaboration

Permitir consultar colaboración en diferentes niveles.

## 9.1 Work Item

Mostrar asignaciones directas y contribuciones Git vinculadas.

## 9.2 Initiative

Mostrar:

- Owners y Contributors declarados en la Initiative.
- Work Items asociados.
- Responsables declarados de esos Work Items.
- Autores observados mediante contribuciones vinculadas.

No transformar los autores observados en Owners de la Initiative.

## 9.3 Epic

Agregar información desde los Work Items e Initiatives relacionados.

Mostrar colaboradores únicos sin contar dos veces el mismo commit o Work Item.

Preservar la procedencia de cada relación.

Si una Epic no tiene trabajo asociado, no inventar colaboradores.

## 9.4 Delivery Plan

Agregar las contribuciones de las Epics relacionadas.

No introducir listas persistidas de colaboradores en Plan o Epic cuando puedan derivarse.

La agregación debe ser read-only.

---

# 10. Kaddo Admin

## 10.1 Work Item Detail

Incorporar una sección:

**Collaboration**

Dividirla en:

### Assigned responsibility

- Owners.
- Contributors.
- Edit assignments.

### Observed Git activity

- Linked commits.
- Observed authors.
- Related local branches.
- Last observed contribution.
- Attribution evidence.

Mostrar claramente:

**Declared responsibility is not inferred from Git.**

## 10.2 Assignment Editor

Utilizar un drawer o modal.

Permitir:

- Agregar responsable.
- Quitar responsable.
- Agregar colaborador.
- Quitar colaborador.
- Guardar cambios.

No requerir un directorio corporativo de usuarios.

Permitir identificadores libres, normalizados y validados como metadata de planificación.

Conservar los campos existentes que no se están editando.

Utilizar control de revisión para impedir sobrescrituras concurrentes.

## 10.3 Initiative Detail

Agregar la gestión visual de Owners y Contributors.

Mostrar la responsabilidad declarada de la Initiative separada de la de sus Work Items.

## 10.4 Epic Detail

Incorporar una sección:

**Collaboration Overview**

Mostrar:

- Responsables declarados en los frentes relacionados.
- Work Items con y sin responsable.
- Autores observados de contribuciones vinculadas.
- Última actividad Git disponible.

Permitir navegar al Work Item que respalda cada contribución.

## 10.5 Plan Detail

Agregar un resumen compacto de colaboración derivada de sus Epics.

No introducir un dashboard independiente de personas.

## 10.6 Work Items List

Agregar filtros opcionales:

- Assigned to.
- Unassigned.
- Git activity available.
- No linked Git activity.

No interpretar ausencia de commits como ausencia de trabajo realizado.

## 10.7 Data Freshness

Mostrar cuándo se consultó Git.

Acción:

**Refresh Git Activity**

Esta acción debe ejecutar únicamente una nueva lectura.

No modificar artifacts, lifecycle ni repositorios.

Mostrar los estados:

- Git available.
- Git partially available.
- Git unavailable.
- No linked contributions found.

No confundir repositorio inaccesible con ausencia de contribuciones.

---

# 11. CLI and MCP

Agregar interfaces de consulta sobre el mismo contrato Core.

## CLI

Comando sugerido:

```bash
kaddo collaboration show AN-065
```

Debe presentar:

- Owners y Contributors declarados.
- Estado de disponibilidad Git.
- Commits vinculados.
- Autores observados.
- Branches relacionadas.
- Cobertura y limitaciones.

Mantener las operaciones de asignación canónica mediante las funciones de escritura existentes o extendidas.

## MCP

Agregar una herramienta de lectura equivalente:

`kaddo_get_work_item_collaboration`

Exponer únicamente evidencia del proyecto autorizado.

Las herramientas MCP no deben ejecutar operaciones Git de mutación.

No permitir que un agente cambie la responsabilidad declarada como consecuencia de observar commits.

---

# 12. Admin Server

Agregar endpoints especializados, reutilizando el Core Adapter.

Contrato sugerido:

```http
GET   /api/v1/admin/work-items/:id/collaboration
PATCH /api/v1/admin/work-items/:id/assignment

GET   /api/v1/admin/initiatives/:id/collaboration
PATCH /api/v1/admin/initiatives/:id/assignment

GET   /api/v1/admin/planning/epics/:id/collaboration
GET   /api/v1/admin/planning/plans/:id/collaboration
```

La actualización manual de Git puede reutilizar la consulta de colaboración con un refresh explícito sin cambiar datos canónicos.

Validar:

- Work Item e Initiative IDs.
- Revisiones de artifacts.
- Sesión y CSRF.
- Rutas de repositorios permitidos.
- Límites de ejecución.
- Tamaños máximos de respuesta.

Mantener errores estructurados.

No permitir pasar comandos Git arbitrarios desde el cliente.

---

# 13. Security and Integrity

Requisitos obligatorios:

- Git exclusivamente read-only.
- Sin acceso remoto por defecto.
- Sin tokens ni credenciales.
- Sin ejecución de shell arbitraria.
- Sin lectura de contenidos completos de archivos mediante la proyección de actividad.
- Sin modificación de `.git/`.
- Sin inferencia automática de asignaciones.
- Sin cambios automáticos del lifecycle.
- Sin exposición innecesaria de correos personales.
- Sin comparación o ranking de productividad individual.
- Sin llamadas a LLM para atribución.
- Sin sincronización automática con proveedores externos.

Respetar los límites del proyecto abierto en Admin.

Preservar la separación entre conocimiento canónico y señales observadas.

---

# 14. Out of Scope

No implementar:

- GitHub API / GitLab API.
- Descubrimiento remoto de Pull Requests.
- Integración con GitHub Projects.
- Integración con Jira o Azure DevOps.
- Revisión de código automatizada.
- Asignación automática de Work Items.
- Time tracking.
- Productividad por desarrollador.
- Detección de presencia en tiempo real.
- Notificaciones automáticas.
- Cambios automáticos de estados.
- Ejecución de agentes.
- Git hooks.
- Mutaciones Git.
- Sistema de usuarios, login o permisos por colaborador.
- Reconciliación automática de identidades Git ambiguas.

La integración remota de Pull Requests y revisores podrá abordarse en un WI posterior.

---

# 15. Acceptance Criteria

- [ ] AC-01: Work Items soportan Owners y Contributors opcionales.
- [ ] AC-02: los Work Items existentes conservan retrocompatibilidad.
- [ ] AC-03: Admin permite crear, modificar y retirar asignaciones de Work Items.
- [ ] AC-04: Admin permite administrar Owners y Contributors de Initiatives.
- [ ] AC-05: la edición preserva metadata y contenido canónico no modificado.
- [ ] AC-06: los cambios de asignación utilizan optimistic concurrency.
- [ ] AC-07: Git Adapter realiza exclusivamente operaciones de lectura.
- [ ] AC-08: la recolección Git está limitada en tiempo, cantidad y alcance.
- [ ] AC-09: se soportan referencias exactas a Work Items con identificadores configurables, incluidos `WI-xxx` y `AN-xxx` cuando existan.
- [ ] AC-10: las referencias explícitas y asociaciones por branch se distinguen correctamente.
- [ ] AC-11: no se atribuyen commits a Work Items solo por coincidencia de archivos.
- [ ] AC-12: cada atribución presenta evidencia verificable y procedencia.
- [ ] AC-13: la proyección distingue responsabilidad declarada de autores Git observados.
- [ ] AC-14: Work Item Detail muestra asignaciones y actividad vinculada.
- [ ] AC-15: Initiative Detail muestra responsabilidad declarada y actividad agregada.
- [ ] AC-16: Epic Detail muestra colaboración derivada sin duplicaciones.
- [ ] AC-17: Plan Detail muestra una agregación consistente.
- [ ] AC-18: Work Items List permite identificar trabajo sin asignación.
- [ ] AC-19: se informa la disponibilidad, cobertura y fecha de consulta de Git.
- [ ] AC-20: la ausencia de Git no bloquea Planning ni Work Items.
- [ ] AC-21: proyectos multirepo conservan identificación y separación por repositorio.
- [ ] AC-22: CLI y MCP reutilizan la misma proyección Core.
- [ ] AC-23: no se modifica automáticamente ningún lifecycle o estado de entrega.
- [ ] AC-24: las operaciones cumplen seguridad de sesión, validación y protección de rutas.
- [ ] AC-25: existen pruebas de Core, Git Adapter, Admin Server y E2E.
- [ ] AC-26: las vistas funcionan en Light/Dark/mobile.
- [ ] AC-27: documentación EN/ES actualizada.
- [ ] AC-28: implementación verificada localmente antes del commit.

---

# 16. Validation Scenarios

## VS-01 — Assigned but no commits

Un Work Item tiene Owner declarado, pero no posee commits vinculados.

Expected:

- Se muestra el Owner.
- Se indica que no hay contribuciones Git vinculadas en el alcance consultado.
- No se elimina ni cuestiona automáticamente la asignación.

## VS-02 — Contributor without assignment

Un commit referencia explícitamente `AN-065`, pero su autor no está asignado al Work Item.

Expected:

- La contribución aparece como observada.
- La asignación declarada permanece intacta.
- No se agrega automáticamente al autor como Contributor.

## VS-03 — Explicit commit reference

Un commit contiene `WI-077`.

Expected:

- Se correlaciona con el Work Item existente.
- Se muestra SHA y evidencia.
- No coincide accidentalmente con `WI-0770`.

## VS-04 — Branch association

Una branch local utiliza un patrón compatible con la Git Strategy declarada.

Expected:

- Se identifica la relación contextual.
- No se atribuyen automáticamente todos sus commits al WI.
- Se informa la clasificación de la evidencia.

## VS-05 — Unrelated commit

Un commit cambia un módulo relacionado, pero no referencia ningún Work Item.

Expected:

- No aparece como contribución atribuida automáticamente.
- Puede conservarse como actividad no atribuida dentro de la cobertura pertinente.

## VS-06 — Initiative aggregation

Una Initiative agrupa dos Work Items con commits del mismo autor.

Expected:

- Los commits se cuentan de forma consistente.
- El autor no se duplica.
- La Initiative no cambia su Owner declarado.

## VS-07 — Epic aggregation

Una Epic contiene varias Initiatives y Work Items.

Expected:

- La vista agrega las contribuciones sin duplicar SHAs del mismo repositorio.
- Mantiene vínculos a los Work Items de origen.

## VS-08 — No Git repository

Un proyecto Kaddo no dispone de Git.

Expected:

- Planning funciona.
- Las asignaciones siguen disponibles.
- Git Activity aparece como unavailable.
- No existen errores de navegación.

## VS-09 — Multi-repository

Una feature involucra dos repositorios locales configurados.

Expected:

- Se identifican ambos repositorios.
- Las contribuciones mantienen su procedencia.
- No se mezclan identidades de commits sin contexto de repositorio.

## VS-10 — Assignment conflict

Dos usuarios editan la asignación del mismo Work Item desde snapshots diferentes.

Expected:

- La segunda escritura obsoleta se rechaza.
- No se pierde la primera modificación.
- Admin permite recargar.

## VS-11 — End-to-end in Admin

Ejecutar:

1. Abrir Work Item.
2. Declarar Owner.
3. Declarar Contributor.
4. Guardar.
5. Consultar actividad Git.
6. Abrir commit relacionado.
7. Navegar hacia Initiative y Epic.
8. Verificar agregación de contribuciones.

Expected:

- Las asignaciones son canónicas.
- Git permanece read-only.
- La información es consistente entre vistas.

---

# 17. Implementation Plan

## Phase 1 — Architectural Design

Formalizar:

- Contrato de responsabilidad.
- Contrato de Git Evidence.
- Reglas de correlación.
- Modelo de cobertura.
- Límite de repositorios.
- Reglas de atribución y privacidad.

Documentar mediante ADR cualquier decisión significativa sobre el límite Git Adapter/Core.

No comenzar la implementación del observador antes de validar sus contratos.

## Phase 2 — Assignment Core

Extender Work Items y la edición de Initiatives.

Incorporar:

- Lectura.
- Serialización.
- Actualización.
- Validación.
- Control de concurrencia.
- Pruebas de retrocompatibilidad.

## Phase 3 — Git Evidence

Implementar Git Adapter read-only.

Incorporar normalización, correlación determinística, límites y cobertura.

Agregar fixtures con repositorios Git temporales de prueba.

No utilizar el historial real del repositorio Kaddo como única base de pruebas.

## Phase 4 — Collaboration Projections

Construir la proyección de Work Item y las agregaciones de Initiative, Epic y Plan.

Exponer mediante CLI/MCP y Admin Server.

## Phase 5 — Admin UX

Implementar:

- Assignment Editor.
- Collaboration en Work Item Detail.
- Collaboration en Initiative Detail.
- Collaboration Overview de Epic y Plan.
- Filtros de asignación.
- Refresh manual de Git.

## Phase 6 — Verification

- Suite Core.
- Unit tests de Git Adapter.
- Tests de correlación.
- Tests Admin Server.
- E2E.
- Retrocompatibilidad.
- Pruebas multirepo.
- Light/Dark/mobile.
- Documentación EN/ES.

---

# 18. Definition of Done

WI-077 estará listo para completar cuando Kaddo permita responder, con trazabilidad:

**¿Quién tiene asignado este trabajo?**

Mediante Owners y Contributors declarados.

**¿Quién ha contribuido a este trabajo?**

Mediante evidencia Git observada y relacionada.

**¿Cómo se conecta esa contribución con la planificación?**

Mediante los Work Items y las relaciones existentes con Initiatives, Epics y Plans.

La solución no debe confundir asignaciones, evidencia de actividad y estado de entrega.

---

# 19. Commit Gate

**No realizar commit, push, tag ni release sin aprobación explícita.**

Antes de solicitar autorización:

1. Presentar el modelo y las reglas de atribución.
2. Validar el contrato Git Adapter/Core.
3. Ejecutar todos los builds y pruebas.
4. Levantar Admin localmente.
5. Demostrar asignación de Owner y Contributor.
6. Demostrar una contribución Git explícitamente vinculada a un WI.
7. Demostrar un commit no atribuible.
8. Demostrar una Initiative/Epic con varios colaboradores.
9. Demostrar un proyecto sin Git.
10. Demostrar un caso multirepo.
11. Confirmar que no se modificó Git durante la observación.
12. Validar Light/Dark/mobile.
13. Presentar diff, archivos modificados y evidencia.
14. Solicitar aprobación final.

El commit gate permanece vigente aunque todos los tests estén aprobados.

No iniciar publicación ni completar el Work Item sin confirmación humana.

## Guiding Principle

> Kaddo debe distinguir quién tiene responsabilidad sobre un resultado, quién ha contribuido con evidencia verificable y qué trabajo fue efectivamente completado. Git aporta señales de actividad; el conocimiento canónico conserva las responsabilidades y el lifecycle mantiene el estado formal de entrega.
