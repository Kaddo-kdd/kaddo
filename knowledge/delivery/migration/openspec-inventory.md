---
type: analysis
id: openspec-inventory
title: OpenSpec Dependency Inventory
status: current
generated_by: implementation-agent
template_version: 1
related_work_item: WI-003
scan_date: '2026-09-27'
---

# OpenSpec Dependency Inventory

> Idioma del proyecto: español. Claves, nombres de archivo y código en inglés.

## Procedimiento de scan reproducible

Los siguientes comandos reproducen el inventario completo. Ejecutar desde la raíz del repositorio.

### 1. Dependencias runtime (código fuente)

```bash
grep -rn "openspec\|OpenSpec\|open-spec" --include="*.ts" --include="*.js" --include="*.mjs" --include="*.cjs"
```

**Resultado esperado:** cero coincidencias en código fuente.

### 2. Dependencias de paquete

```bash
grep -rn "openspec\|OpenSpec\|open-spec" --include="package.json"
```

**Resultado esperado:** cero coincidencias en package.json.

### 3. CI / Workflows

```bash
grep -rn "openspec\|OpenSpec\|open-spec" .github/
```

**Resultado esperado:** cero coincidencias.

### 4. Configuración YAML

```bash
grep -rn "openspec\|OpenSpec\|open-spec" --include="*.yml" --include="*.yaml"
```

**Resultado esperado:** cero coincidencias.

### 5. Configuración de agentes / skills / claude

```bash
grep -rn "openspec\|OpenSpec\|open-spec" .claude/
```

**Resultado esperado:** solo `.claude/settings.local.json` (permisos históricos de git).

### 6. Documentación y markdown

```bash
grep -rn "openspec\|OpenSpec\|open-spec" --include="*.md"
```

**Resultado esperado:** CONTRIBUTING.md, README.md, tool-examples.md (EN/ES), archivos internos de `openspec/`, y WI-003 (auto-referencia).

### 7. Conteo de artifacts históricos

```bash
ls openspec/changes/ | wc -l
```

**Resultado esperado:** 99 change folders.

---

## Tabla de dependencias

| # | ID | Ubicación | Tipo | Categoría | Responsabilidad actual | Impacto si se elimina | Equivalente Kaddo | Estado |
|---|-----|-----------|------|-----------|------------------------|----------------------|-------------------|--------|
| 1 | OPEN-001 | `openspec/changes/` (99 folders) | historical | historical-only | Historia viva de por qué existe cada feature del CLI. Cada folder contiene proposal, design, spec y tasks de un cambio implementado. | Ninguno operacional. La historia permanece en git. La descubribilidad disminuye sin el directorio. | `knowledge/delivery/work-items/completed/` preserva intent y learning. Git history preserva cambios de código. | historical-only |
| 2 | OPEN-002 | `openspec/templates/` (4 archivos: proposal.md, design.md, spec.md, tasks.md) | workflow | replacement-partial | Definen la estructura pre-implementación: por qué existe el cambio (proposal), cómo se implementa (design), qué comportamiento observable produce (spec), y qué pasos concretos seguir (tasks). | Se pierde el workflow estructurado de 4 documentos antes de codear. Contributors no tienen guía de estructura. | WI frontmatter + work-item-refinement skill cubren proposal + spec. implementation-planning skill cubre tasks. design.md (approach técnico, alternativas, trade-offs) solo parcialmente cubierto. | replacement-partial |
| 3 | OPEN-003 | `openspec/README.md` | documentation | historical-only | Documenta la convención OpenSpec: cuándo usar, cómo crear un change, lifecycle (Draft → Ready → In progress → Done), y estructura de carpetas. | Ninguno operacional. Es documentación interna de una convención. | El Build Contract (`knowledge/delivery/build-contract.md`) reemplaza como documentación de lifecycle. | historical-only |
| 4 | OPEN-004 | `CONTRIBUTING.md` líneas 76-81 | workflow | replacement-missing | Sección "OpenSpec: define before you build" que instruye a contributors a crear un OpenSpec change antes de escribir código. Incluye link a `openspec/README.md`. | Contributors pierden la instrucción de definir antes de codear. Sin reemplazo, el workflow pierde la disciplina knowledge-first. | El Build Contract define el lifecycle Kaddo-native. CONTRIBUTING.md debe actualizarse para referenciar el Build Contract en lugar de OpenSpec. Actualización fuera de scope de VS-108. | replacement-missing |
| 5 | OPEN-005 | `README.md` línea 120 | documentation | already-replaced | Una mención en la lista de links del Playbook: "Examples with Other Tools — GitHub Issues, Jira/Linear, OpenSpec, agent frameworks, LLM chats." | Mínimo. Es una referencia en una lista junto a otras herramientas externas. | Ya listado como patrón de uso junto a GitHub Issues y Jira. OpenSpec puede permanecer como herramienta externa complementaria o removerse de la lista. | already-replaced |
| 6 | OPEN-006 | `apps/docs/src/content/docs/playbook/tool-examples.md` | documentation | already-replaced | Sección "Kaddo + OpenSpec" que describe cómo usar OpenSpec para propuestas de cambio estructuradas y Kaddo para el lifecycle de knowledge. Incluye ejemplo de flujo. | Una sección de documentación. No afecta funcionalidad. | La sección ya enmarca OpenSpec como complemento externo, no como dependencia. Puede actualizarse para reflejar que el Build Contract nativo es el approach preferido. | already-replaced |
| 7 | OPEN-007 | `apps/docs/src/content/docs/es/playbook/tool-examples.md` | documentation | already-replaced | Mirror español de OPEN-006. | Igual que OPEN-006. | Igual que OPEN-006. | already-replaced |
| 8 | OPEN-008 | `.claude/settings.local.json` | configuration | historical-only | Permisos históricos de git que incluyen paths como `openspec/changes/...` en comandos `git add` aprobados previamente. | Ninguno. Son registros de permisos de sesiones anteriores. Las entradas son inertes. | No requiere reemplazo. | historical-only |

---

## Baseline metrics

| Métrica | Valor |
|---------|-------|
| Total de categorías de referencia | 8 |
| Dependencias runtime (código, paquetes, CI) | 0 |
| Dependencias de workflow (proceso de desarrollo) | 2 (OPEN-002, OPEN-004) |
| Dependencias de documentación | 3 (OPEN-005, OPEN-006, OPEN-007) |
| Artefactos históricos | 3 (OPEN-001, OPEN-003, OPEN-008) |
| Change folders históricos | 99 |
| Templates activos | 4 (proposal.md, design.md, spec.md, tasks.md) |
| Archivos fuente con import OpenSpec | 0 |
| Package.json con dependencia OpenSpec | 0 |
| Workflows CI con referencia OpenSpec | 0 |

### Clasificación por estado de reemplazo

| Estado | Cantidad | IDs |
|--------|----------|-----|
| already-replaced | 3 | OPEN-005, OPEN-006, OPEN-007 |
| replacement-partial | 1 | OPEN-002 |
| replacement-missing | 1 | OPEN-004 |
| historical-only | 3 | OPEN-001, OPEN-003, OPEN-008 |
| compatibility-only | 0 | — |
| unknown | 0 | — |

### Resumen

OpenSpec no tiene presencia en runtime, código fuente, paquetes ni CI. Su footprint es exclusivamente de workflow de autoría (2 dependencias) y documentación/historia (6 entradas). La barrera principal para retirarlo es actualizar CONTRIBUTING.md (OPEN-004) y completar el reemplazo parcial de los templates (OPEN-002).
