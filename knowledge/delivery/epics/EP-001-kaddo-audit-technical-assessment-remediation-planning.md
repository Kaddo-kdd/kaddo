---
type: epic
id: EP-001
title: Kaddo Audit — Technical Assessment & Remediation Planning
status: planned
knowledge_level: K3
outcome: >-
  Kaddo incorpora un flujo de auditoría técnica basado en evidencia que analiza
  el estado de un proyecto, identifica riesgos y oportunidades, genera un
  reporte reproducible y propone acciones vinculables al Roadmap, Initiatives,
  Epics y Work Items existentes, con aprobación humana explícita.
success_criteria:
  - Un proyecto TypeScript puede ejecutar una auditoría con hallazgos verificables de código y dependencias.
  - Un proyecto Rust puede ejecutar un flujo equivalente mediante adaptadores compatibles.
  - Un monorepo permite seleccionar el alcance por módulo.
  - El reporte distingue hallazgos confirmados, inferencias y áreas no evaluadas.
  - Los hallazgos incluyen archivos, referencias y evidencias suficientes para su revisión.
  - Kaddo identifica Work Items relacionados y evita duplicados.
  - El usuario puede previsualizar un plan de remediación y asociar sus acciones a Planning con aprobación explícita.
  - Una segunda auditoría puede diferenciar hallazgos nuevos, persistentes y resueltos.
  - CLI, MCP y Admin utilizan resultados consistentes del mismo contrato Core.
  - La auditoría no altera código ni documentación existente sin autorización.
---

# Kaddo Audit — Technical Assessment & Remediation Planning

## Objetivo

Incorporar a Kaddo un flujo de auditoría técnica **basado en evidencia** que analice el estado de un
proyecto de software, identifique riesgos y oportunidades de mejora, genere un reporte reproducible y
proponga acciones **vinculables** al Roadmap, Initiatives, Epics y Work Items existentes, siempre con
aprobación humana explícita.

## Flujo funcional

1. **Discover:** identificar stack, módulos, dependencias, configuración y conocimiento existente.
2. **Analyze:** ejecutar análisis estáticos y herramientas especializadas disponibles, complementados con
   revisión arquitectónica asistida por agentes.
3. **Correlate:** contrastar los hallazgos con ADRs, estándares, ownership, Work Items y riesgos ya
   documentados.
4. **Report:** generar un reporte estructurado con evidencias, prioridades y recomendaciones.
5. **Plan:** proponer la creación o asociación de Initiatives, Epics y Work Items, para aprobación humana.
6. **Track:** permitir auditorías posteriores para comprobar hallazgos nuevos, persistentes y resueltos.

## Contratos propuestos

### Audit Run

Cada ejecución registra:

- Identificador único, fecha y commit analizado.
- Scope: proyecto completo, módulo o rutas específicas.
- Herramientas utilizadas y versiones.
- Estado de ejecución y cobertura.
- Hallazgos encontrados y limitaciones de análisis.
- Referencia al reporte.
- Relación con auditorías anteriores, si existen.

### Audit Finding

Cada hallazgo debe incluir:

- ID estable y categoría.
- Descripción y ubicación.
- Evidencia verificable y procedencia.
- Severidad y confianza, como **dimensiones independientes**.
- Impacto técnico y potencial impacto operativo.
- Recomendación concreta.
- Esfuerzo estimado, cuando exista sustento.
- Estado: `open`, `acknowledged`, `accepted-risk`, `false-positive`, `resolved`.
- Referencias a ADRs, capacidades y Work Items existentes.
- Recomendación de planificación propuesta.

> No marcar una inferencia como vulnerabilidad confirmada sin respaldo técnico verificable.

## Artefactos

Propuesta de almacenamiento:

- `knowledge/tech/audits/AUD-xxx.md`: reporte humano.
- `.kaddo/audits/AUD-xxx.json`: resultados estructurados.
- `knowledge/delivery/`: propuestas de remediación materializadas **únicamente** después de la aprobación
  correspondiente.

Los hallazgos deben ser **trazables y deduplicables** entre ejecuciones.

## Interfaces propuestas

Los nombres son propuestas, no comandos existentes.

**CLI:** `kaddo audit run` · `kaddo audit report` · `kaddo audit compare` · `kaddo audit plan`

**MCP:**

- Herramientas para consultar reportes y hallazgos.
- Preparación asistida de recomendaciones.
- Previsualización y confirmación explícita de cambios en Planning.

**Admin:**

- Vista de auditorías y su estado.
- Hallazgos filtrables por módulo, severidad y categoría.
- Evidencia y recomendaciones por hallazgo.
- Asociación con Initiatives y Work Items.
- Evolución de hallazgos entre ejecuciones.

## Reglas de seguridad y gobernanza

- Auditoría inicialmente **no destructiva** y sin modificaciones de código.
- Sin envío externo de código, archivos sensibles ni secretos por defecto.
- Herramientas externas, acceso a red y ejecución de comandos sujetos a configuración y autorización.
- Fallas de herramientas registradas como **cobertura parcial**, no como resultado limpio.
- No modificar Roadmap, Initiatives, Epics o Work Items sin aprobación explícita.
- No considerar el reporte como certificación de seguridad.
- No crear automáticamente nuevos Work Items cuando ya exista trabajo equivalente.

## Criterios de aceptación

Los criterios canónicos de esta Epic se registran en `success_criteria` (frontmatter) para verificación
basada en evidencia. En resumen:

1. Un proyecto **TypeScript** ejecuta una auditoría con hallazgos verificables de código y dependencias.
2. Un proyecto **Rust** ejecuta un flujo equivalente mediante adaptadores compatibles.
3. Un **monorepo** permite seleccionar el alcance por módulo.
4. El reporte distingue hallazgos **confirmados**, **inferencias** y **áreas no evaluadas**.
5. Los hallazgos incluyen archivos, referencias y evidencias suficientes para su revisión.
6. Kaddo identifica Work Items relacionados y **evita duplicados**.
7. El usuario previsualiza un plan de remediación y asocia sus acciones a Planning con aprobación explícita.
8. Una segunda auditoría diferencia hallazgos **nuevos, persistentes y resueltos**.
9. CLI, MCP y Admin usan resultados consistentes del **mismo contrato Core**.
10. La auditoría **no altera** código ni documentación existente sin autorización.

## Fuera de alcance inicial

- Pentesting activo y explotación de vulnerabilidades.
- Corrección automática de código.
- Certificación de seguridad.
- Sustitución de analizadores especializados.
- Motor genérico de ejecución arbitraria de comandos.
- Creación o cierre automático de Initiatives y Work Items.
