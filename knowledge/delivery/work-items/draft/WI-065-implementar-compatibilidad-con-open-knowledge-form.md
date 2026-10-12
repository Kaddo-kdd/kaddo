---
type: feature
id: WI-065
title: >-
  Implementar compatibilidad con Open Knowledge Format (OKF v0.2) mediante un
  adaptador portable de conocimiento
status: draft
work_type: feature
created_at: '2026-10-12'
source:
  type: external
  imported_at: '2026-10-12'
  source_format: markdown-frontmatter
  source_hash: 57e2f141a8789204ce645140666c91ea98c0b3a1c28a04d2ad82d1681b53a61b
  inferred: false
generated_by: kaddo-admin
knowledge_level: K3
domains: [Product, Tech, Delivery]
affected_modules: [cli, docs]
scope_confidence:
  level: high
  reasons:
    - Adaptador de interoperabilidad opcional sobre readers/contracts Core existentes; no modifica el modelo canónico.
    - Alcance inicial acotado (export + validate), con spec OKF v0.2 de referencia y 18 ACs explícitos.
    - Commit Gate explícito: no commitear sin validar y confirmar.
refined_by: work-item-refinement (manual)
summary: >-
  Kaddo usa un modelo canónico de conocimiento (Markdown + YAML frontmatter +
  relaciones semánticas + artifacts versionables). OKF es una especificación
  abierta para representar e intercambiar conocimiento como bundles de Markdown
  con metadatos estructurados. Incorporar OKF como…
original_snapshot:
  title: >-
    Implementar compatibilidad con Open Knowledge Format (OKF v0.2) mediante un
    adaptador portable de conocimiento
  description: >-
    Kaddo usa un modelo canónico de conocimiento (Markdown + YAML frontmatter +
    relaciones semánticas + artifacts versionables). OKF es una especificación
    abierta para representar e intercambiar conocimiento como bundles de
    Markdown con metadatos estructurados. Incorporar OKF como…
  type: feature
  status: draft
---

# Implementar compatibilidad con Open Knowledge Format (OKF v0.2)

## Intent

Kaddo usa un modelo canónico de conocimiento (Markdown + YAML frontmatter + relaciones semánticas +
artifacts versionables). OKF es una especificación abierta para representar e intercambiar conocimiento
como bundles de Markdown con metadatos estructurados. Incorporar OKF como **formato de interoperabilidad
opcional** permitiría compartir el conocimiento de Kaddo con herramientas/agentes que consumen OKF, sin
que usen Kaddo ni su CLI/MCP/estructura interna. **Kaddo sigue siendo la fuente de verdad.** Versión de
referencia: **OKF v0.2** (SPEC: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md).

## Goal

Un proyecto Kaddo debe poder: (1) exportar conocimiento canónico como bundle OKF válido; (2) preservar la
información semántica relevante; (3) mantener relaciones navegables; (4) exportar procedencia y señales de
confianza **solo cuando exista evidencia**; (5) validar conformidad con OKF v0.2; (6) compartir el
resultado sin requerir instalación de Kaddo en el consumidor. No reemplaza ni modifica el modelo existente.

## 1. Principios arquitectónicos

- **Kaddo canónico**: `Kaddo Knowledge → Core Readers → OKF Adapter → OKF Bundle`. El bundle es una
  **proyección**, no una segunda fuente de verdad.
- **Interoperabilidad opcional**: no modificar el comportamiento de `init/scan/learn/understand/guard/context`.
- **Bajo acoplamiento**: adaptador separado de los modelos canónicos; reutilizar readers/contracts Core;
  no replicar descubrimiento de artifacts, parsing de WIs ni interpretación del Graph.

## 2. Alcance inicial

Dos capacidades: `kaddo okf export` y `kaddo okf validate` (exportación + validación). La **importación**
OKF→Kaddo se documenta como evolución posterior (fuera de este WI).

## 3. OKF Knowledge Bundle

Generar por defecto en `.kaddo/okf/` con `index.md` raíz y subcarpetas por capa/artifact (business,
product, tech, delivery/work-items, architecture, resources, external, reports). La estructura es
conceptual y debe ajustarse a los artifacts existentes — **no crear directorios vacíos**. Respetar nombres
reservados OKF (`index.md`, `log.md`); los índices sirven para navegación progresiva. **No generar
`log.md` con historia inventada.** El bundle debe ser autocontenido respecto a sus conceptos y relaciones.

## 4. Knowledge Mapping (explícito y documentado)

| Kaddo | OKF Concept |
|---|---|
| Business/Product/Technical Knowledge | Business/Product/Technical Knowledge |
| Architecture / ADR | Architecture Decision |
| Capability | Capability |
| Work Item | Work Item |
| Initiative | Initiative |
| Project Resource | Project Resource |
| Controlled Deprecation | Deprecation Plan |
| Knowledge Capsule | Knowledge Reference |
| Impact / Drift / Savings Report | Report |

OKF no exige una taxonomía cerrada; los consumidores deben poder tratarlos como conceptos genéricos. El
mapping debe especificar: canonical source, OKF concept type, identifier/path, title, description, resource
reference, relationships, provenance, lifecycle mapping y limitaciones/campos no soportados. **No traducir
estados de dominio a estados OKF cuando no sean equivalentes** (p. ej. WI `completed` ≠ OKF `stable`).

## 5. OKF Frontmatter

Cada documento de concepto exportado lleva frontmatter válido con `type` **obligatorio**; otros campos solo
cuando haya información compatible con su semántica (no rellenar plantillas). Se permiten extensiones Kaddo
cuando sean necesarias para preservar información específica.

## 6. Provenance & Trust (v0.2: `sources`, `generated`, `verified`, `status`, `stale_after`)

- **Provenance**: exportar referencias a fuentes originales cuando existan; preservar ids canónicos Kaddo;
  **no inventar procedencia**; no convertir cualquier `source_id` interno en `sources[].resource` sin
  verificar que sea una referencia válida.
- **Trust**: distinguir "existe / generado / verificado / revisado por humano". **No declarar verificación
  humana sin evidencia explícita**; la validación técnica de un WI no implica revisión del documento completo.
- **Freshness**: exportar vigencia solo con evidencia/contratos adecuados; **no generar `stale_after`
  arbitrario**; un timestamp de exportación ≠ fecha de actualización del conocimiento.
- **Attestation**: v0.2 incorpora Attested Computation; este WI **no** implementa ejecutores/attesters; los
  reportes no se convierten automáticamente en Attested Computations por tener fórmulas determinísticas.

## 7. Relaciones y Knowledge Graph

Preservar relaciones semánticas vía enlaces Markdown compatibles con OKF (Capability → Work Item /
Architecture Decision / Project Resource). Requisitos: enlaces internos estables, resolución de rutas
dentro del bundle, referencias legibles, **sin relaciones inventadas**, identidad de conceptos consistente
entre exportaciones. Reutilizar Graph canónico. No exportar nodos sintéticos como conocimiento canónico sin
mapping explícito. Los enlaces rotos se informan **sin** confundirlos con errores de conformidad (OKF admite
referencias aún no resolubles).

## 8. Export CLI

`kaddo okf export` → `.kaddo/okf/`, con `--output <dir>` alternativo. Requisitos: exportación
**determinística** para el mismo snapshot lógico; rutas estables; no modificar artifacts originales; no
ejecutar comandos externos; **no incluir secretos/credenciales**; no seguir symlinks fuera del alcance; no
sobrescribir contenido ajeno al área de exportación sin protección; informar cantidad de conceptos y
omisiones; reconocer fuentes inexistentes sin generar documentos vacíos engañosos.

## 9. OKF Validation

`kaddo okf validate [dir]` (solo lectura). Incluye: parseo de frontmatter; `type` no vacío; convenciones de
archivos reservados; estructura de índices cuando existan; versión declarada; metadatos opcionales;
referencias internas y diagnóstico de enlaces; consistencia de relaciones; ids duplicados/rutas ambiguas.
Separa **Conformance Errors / Warnings / Informational Findings**. **No rechazar** por: tipos desconocidos,
campos extra desconocidos, campos opcionales ausentes, enlaces rotos, índices opcionales ausentes. Salida
legible y JSON.

## 10. Compatibilidad de versión

OKF v0.2 como contrato objetivo. Declarar versión del bundle con la convención oficial (p. ej.
`okf_version: "0.2"` en el `index.md` **raíz**, no en todos los índices). Documentar diferencias vs v0.1
(`sources`; `generated.at` en vez de `timestamp`; `verified`; `status`; `stale_after`; Attested Computation
no ejecutado). No implementar compatibilidad con versiones futuras desconocidas; el contrato evoluciona sin
alterar el modelo canónico.

## 11. Reports (Impact / Drift / Savings)

Incluir sus proyecciones como conceptos OKF cuando se solicite y el contenido esté disponible, preservando:
generated at, project context, evidence classification, findings, reporting period, confidence, assumptions,
limitations. **No eliminar las advertencias metodológicas de Savings; no convertir estimaciones en valores
observados; no tratar findings como hechos operativos; no modificar fórmulas.**

## 12. Knowledge Capsules

OKF **complementa** las cápsulas, no las reemplaza. Diferenciar: Capsule = resumen contextual para un
consumidor; OKF Bundle = colección portable de conceptos. Permitir representar una cápsula existente dentro
de un bundle como **conocimiento de referencia**, preservando source y límites de acceso conocidos. No
convertir una cápsula en multirepo ni asumir acceso a su sistema de origen.

## 13. Security Boundaries (seguro por defecto)

No exportar: secrets, tokens, credenciales, archivos de entorno; no copiar código innecesario; no incluir
rutas privadas absolutas cuando no se requieran; no incorporar archivos externos al conjunto permitido;
emitir warnings ante información potencialmente sensible. Inventario explícito de artifact types exportables;
no considerar seguro un archivo solo por estar en `knowledge/`. Documentar que los bundles deben revisarse
antes de compartirse.

## 14. Documentation (EN/ES)

"Open Knowledge Format Integration": qué es OKF; diferencia OKF vs Kaddo; arquitectura del adaptador;
versión soportada; comandos CLI; mapping de conceptos; provenance y trust; cómo exportar; cómo validar;
cómo consumir un bundle sin Kaddo; limitaciones; seguridad. Enlazar desde docs de Knowledge Capsules,
Knowledge Graph y comandos CLI.

## Out of scope

Reemplazar el formato canónico; cambiar init/bootstrap/learn/scan/guard; importar bundles y modificar
conocimiento canónico; sincronización bidireccional; resolver conflictos bundle↔WI; generar contenido por
LLM; ejecutar Attested Computations; SDK obligatorio de OKF; servidores externos; base de datos para OKF;
marketplace de bundles; modificar Controlled Deprecation; reemplazar Knowledge Capsules; interfaces de
edición OKF en Admin; convertir OKF en dependencia obligatoria.

## Acceptance criteria

- [ ] AC-01: `kaddo okf export` genera un bundle compatible con OKF v0.2.
- [ ] AC-02: los artifacts canónicos permanecen intactos.
- [ ] AC-03: el adaptador reutiliza readers y contratos Core existentes.
- [ ] AC-04: mapping explícito y documentado de conceptos Kaddo→OKF.
- [ ] AC-05: los conceptos incluyen frontmatter válido y `type`.
- [ ] AC-06: los índices permiten navegación progresiva.
- [ ] AC-07: las relaciones exportadas conservan enlaces internos coherentes.
- [ ] AC-08: provenance/verification/freshness solo se exportan con evidencia válida.
- [ ] AC-09: `kaddo okf validate` distingue errores de conformidad y warnings.
- [ ] AC-10: el validador respeta el carácter permisivo de la spec.
- [ ] AC-11: los reportes exportados preservan sus limitaciones metodológicas.
- [ ] AC-12: las Knowledge Capsules pueden representarse como referencias OKF.
- [ ] AC-13: el bundle no contiene credenciales o secretos conocidos.
- [ ] AC-14: exportaciones repetidas mantienen identidades y relaciones estables.
- [ ] AC-15: un consumidor independiente puede leer los conceptos sin usar Kaddo.
- [ ] AC-16: CLI y Core mantienen compatibilidad con los flujos existentes.
- [ ] AC-17: existen tests unitarios y end-to-end con fixtures OKF.
- [ ] AC-18: documentación EN/ES actualizada.

## Validation (escenarios)

1. **Standard** (Business/Product/Tech/Delivery/WIs/ADRs/Graph): bundle válido, navegable, relaciones
   conservadas, sin cambios al Knowledge canónico.
2. **POC** (Tech/Delivery/POC evidence, sin Business/Product completos): bundle válido, sin capas
   artificiales, sin penalizar artifacts opcionales, evidencia POC preservada.
3. **Legacy multirepo** (mapped modules, Project Resources, Controlled Deprecation): ids estables,
   relaciones entre módulos, referencias de Resources, Deprecation Plans representados sin autorizar
   remociones.
4. **Knowledge Capsule** externa: representada como referencia, sin requerir fuentes privadas ni atribuir
   acceso operativo.
5. **Invalid OKF**: concepto sin `type` → Conformance Error; tipo desconocido → sin error; enlace interno
   roto → Warning/Informational (no rechazo automático).
6. **Repeated export** (mismo snapshot): identidades estables, rutas consistentes, sin duplicados, sin
   cambios no solicitados a artifacts.

## Implementation guidance

Revisar `packages/cli/src/core.ts`, `index.ts`, `core/graph.ts`, `core/context-pack.ts`, `core/capsule.ts`,
`core/impact-report.ts`, `core/drift-report.ts`, `core/savings.ts`. Adaptador en módulo dedicado sugerido
`packages/cli/src/core/okf/` (`mapping.ts`, `export.ts`, `validate.ts`, `types.ts`) — revisar convenciones
actuales. Exponer vía Core público. No duplicar modelos de dominio.

## Entry points (grounding técnico — verificado contra el repo)

Cada preocupación OKF mapea a un reader/contract Core **ya existente** (el adaptador los consume
read-only; no reimplementa descubrimiento, parsing ni Graph). Todos verificados presentes al refinar:

- **Descubrimiento de artifacts**: `discoverKnowledge()` — `packages/cli/src/services/knowledge-artifacts.ts`
  (fuente única del catálogo; cada artifact trae `type`, `rawFrontmatter`, `relPath`). Base para el
  inventario explícito de tipos exportables (seguridad: no exportar por el solo hecho de estar en `knowledge/`).
- **Work Items**: `getWorkItems` / `getWorkItemsSummary` / `getWorkItem` — `core/work-items.ts`
  (incluye `resources:[{id,role}]`, `deprecationTargets`, relaciones parent/child, decisions → relaciones OKF).
- **Project Resources**: `getResources` / `getResource` — `core/resources.ts` (ya **secret-safe**:
  conserva solo nombres de referencia de auth, nunca valores; reusar para AC-13).
- **Initiatives**: `discoverInitiatives` — `core/initiative.ts`.
- **Controlled Deprecation**: `getDeprecationPlans` / `getDeprecationPlan` — `core/deprecation.ts`
  (Deprecation Plan → concepto OKF; representar sin autorizar remociones).
- **Graph / relaciones**: `getSystemMapProjection` — `core/system-map.ts` (+ `core/graph.ts` tipos) para
  nodos/relaciones; usar relaciones canónicas, sin inventar ni exportar nodos sintéticos.
- **Knowledge Capsules**: `buildCapsule` / `buildSystemCapsule` / `renderCapsuleMarkdown` /
  `serializeCapsuleJson` + `loadExternalRegistry` / `ExternalCapsuleEntry` — `core/capsule.ts`
  (cápsula → "Knowledge Reference" OKF, preservando source y límites de acceso; AC-12).
- **Reports**: `buildImpactReport` / `renderImpactMarkdown` / `serializeImpactJson` (`core/impact-report.ts`),
  savings (`loadAssumptions`, `DEFAULT_ASSUMPTIONS`, `core/savings.ts`) y `core/drift-report.ts`. Preservar
  assumptions/limitations/confidence; no convertir estimaciones en valores observados (AC-11).
- **POC evidence**: `buildPocReportContext` — `core/poc.ts` / `poc-report.ts` (escenario 2).
- **Config/modules (multirepo)**: `loadConfig`, `loadMappedModules` (`services/mapped-modules.js`) para ids
  de módulo estables (escenario 3).

### Estructura recomendada (a confirmar con convenciones del repo)

- Nuevo módulo `packages/cli/src/core/okf/`: `types.ts` (tipos OKF + mapping), `mapping.ts` (Kaddo→OKF,
  tabla §4 documentada), `export.ts` (construye el bundle en `.kaddo/okf/` o `--output`, determinístico),
  `validate.ts` (lectura; separa Conformance/Warning/Info; permisivo). Exponer desde `core.ts`.
- Comando `kaddo okf export|validate` registrado en `packages/cli/src/index.ts` (patrón `program.command('okf')`
  con subcomandos, como `resources` / `deprecation`).
- **Secret-safety**: allow-list de artifact types exportables; reusar la sanitización de `resources.ts`;
  warnings ante contenido potencialmente sensible; nunca `.env` / tokens / credenciales.
- **Determinismo**: orden estable de conceptos y rutas por id; identidades estables entre exportaciones
  (AC-14, escenario 6).

### Secuenciación sugerida (dentro de un mismo WI)

1. `types` + `mapping` + `export` del núcleo (Business/Product/Tech/Delivery/WIs/ADRs/Resources + índices + relaciones).
2. `validate` (conformance / warnings / info; JSON + legible).
3. Reports + Knowledge Capsules como conceptos/refs.
4. Docs EN/ES + dogfooding sobre el propio repo Kaddo.

Entre pasos, respetar el **Commit Gate** (generar bundle + validar + presentar antes de pedir commit).

## Definition of Done + Commit Gate

DoD: adaptador OKF v0.2 funciona; bundles conformantes; mappings documentados; relaciones navegables;
procedencia no inventada; exportación segura; artifacts canónicos sin modificar; validación determinística;
tests aprobados; flujo probado sobre el propio proyecto Kaddo; docs EN/ES; Implementation Evidence
registrada; resultados revisados antes del commit.

**Commit Gate (obligatorio):** NO hacer commit/push automáticamente. Primero generar el bundle y ejecutar
validaciones, presentar resultados de exportación y pruebas, y **solicitar confirmación explícita antes de
commitear**.

## Future evolution (fuera del DoD inicial)

Phase 2 — OKF Consumption (leer bundles externos, previsualizar, validar provenance/trust, detectar
conflictos de identidad, proponer mappings, confirmar antes de importar). Phase 3 — MCP + Admin (operaciones
OKF por MCP, exportación desde Admin, inspección visual, integración con Reports).

## Guiding principle

OKF permite que Kaddo comparta su conocimiento con otros ecosistemas. Kaddo conserva la responsabilidad de
estructurarlo, relacionarlo y gobernar su lifecycle; OKF ofrece un formato portable para consumirlo sin
dependencia del toolkit.
