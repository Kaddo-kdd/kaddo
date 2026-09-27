---
type: capabilities
project_state: ai-assisted
generated_by: kaddo-bootstrap
template_version: 1
refined_by: capability-agent
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Existing Capability Discovery (Domain-Oriented Capability Inventory)

> Capacidades del sistema identificadas a partir de las señales técnicas y el contexto actual de Kaddo.

## Capability Domains

### Domain: CLI & System Context

**Purpose:** Herramientas y comandos responsables de generar, revisar y proteger el contexto del proyecto y la base de código.

**Evidence summary:**
- Comandos CLI detectados: `kaddo context`, `kaddo scan`, `kaddo owners suggest`, `kaddo guard`.
- Configuración en `.kaddo/config.yml` y salida en `.kaddo/context-pack.md`.

#### Capability: Generación de Context Pack

- Status: implemented
- Capability type: technical
- User-facing: yes
- Evidence:
  - Comando `kaddo context`.
  - Existencia del archivo generado `.kaddo/context-pack.md`.
- Related flows:
  - Preparación de contexto estructurado para agentes LLM.
- Related modules/folders:
  - `.kaddo/`
- Related integrations:
  - Ninguna externa explícita.
- Current behavior:
  - Produce un resumen determinista del proyecto sin invocar a un LLM.
- Known constraints:
  - Kaddo mismo no llama a un LLM ni ejecuta comandos de `git` automáticamente.
- Risks or uncertainty:
  - [assumption] Asume que los humanos o herramientas ejecutarán `kaddo context` frecuentemente para mantener el contexto actualizado para los agentes.
- Open questions:
  - [open] ¿Existen límites de rendimiento si la base de código o la cantidad de Work Items crece drásticamente?

#### Capability: Escaneo y Validación (Guardrails)

- Status: partial
- Capability type: technical
- User-facing: internal
- Evidence:
  - Referencias a `kaddo scan` y `kaddo guard`.
  - Configuración `guard: silent_without_ownership: true` en `config.yml`.
- Related flows:
  - Validación de estado antes de registrar cambios en el repositorio.
- Related data:
  - Artefactos de código y metadatos de ownership.
- Current behavior:
  - Escanea el proyecto en busca de reglas y propiedad. Actualmente silencia alertas si no existe información de ownership.
- Risks or uncertainty:
  - El sistema reporta una cobertura actual de propiedad del 0/0.
- Open questions:
  - [open] ¿Qué otras políticas o restricciones puede validar `kaddo guard`?

### Domain: Agent Skills & Workflows

**Purpose:** Ejecución y provisión de habilidades modulares que los agentes de IA pueden aplicar sobre el ciclo de vida del trabajo.

**Evidence summary:**
- Módulos `agents` y `skills` instalados (`config.yml`).
- Lista de habilidades registradas y servidor MCP activo.

#### Capability: Gestión de Skills Reutilizables

- Status: implemented
- Capability type: operational
- User-facing: no
- Evidence:
  - Módulos instalados en `config.yml` (`module_skills: installed`).
  - Habilidades reportadas: `adr-writing`, `graph-metadata-review`, `implementation-planning`, `learning-capture`, `module-context-refinement`, `ownership-suggestion`, `work-item-refinement`.
- Related flows:
  - Refinamiento de Work Items e iteraciones técnicas de agentes.
- Related modules/folders:
  - `knowledge/skills/`
- Current behavior:
  - Permite descubrir y aplicar flujos dinámicos sin incluir el código en línea en el contexto base.
- Known constraints:
  - Las definiciones completas deben leerse independientemente.
- Risks or uncertainty:
  - [assumption] Depende de la correcta integración del cliente LLM para ejecutar las acciones descritas en el skill.
- Open questions:
  - [open] ¿Cuál es el proceso estándar para desarrollar nuevos skills personalizados en un proyecto?

#### Capability: Servidor de Protocolo MCP

- Status: implemented
- Capability type: integration
- User-facing: internal
- Evidence:
  - Referencia a `Kaddo MCP server (kaddo://skills)` en el context pack.
- Related flows:
  - Descubrimiento dinámico de herramientas y lectura de skills.
- Related integrations:
  - Model Context Protocol (MCP).
- Current behavior:
  - Expone el catálogo de habilidades a clientes compatibles mediante el esquema `kaddo://`.
- Open questions:
  - [open] ¿Soporta el MCP la recuperación dinámica de Work Items además de skills?

### Domain: Project Infrastructure

**Purpose:** Entorno subyacente para validación continua y construcción del proyecto.

**Evidence summary:**
- Frameworks de testeo e infraestructura CI configurada.

#### Capability: Continuous Integration & Testing

- Status: implemented
- Capability type: operational
- User-facing: no
- Evidence:
  - Archivos listados en `infraFiles`: `.github/workflows/`.
  - Signals: `Vitest` para pruebas, `pnpm` como gestor de dependencias.
- Related modules/folders:
  - `.github/workflows/`
- Current behavior:
  - Utiliza GitHub Actions para ejecutar la suite de pruebas construida en Vitest.
- Risks or uncertainty:
  - [assumption] Los flujos de CI validan `kaddo scan` o `kaddo guard` en el pipeline.
- Open questions:
  - [open] ¿Existe infraestructura definida para el despliegue automático o solo validación?

## Capability Gaps

- [gap] Falta total de propiedad de artefactos y código (Ownership coverage: 0/0).
  - Domain: CLI & System Context
  - Related capability: Escaneo y Validación (Guardrails)
  - Impact: medium
  - Possible roadmap candidate: yes

- [gap] Capas de conocimiento de Producto y Tecnología (Product & Tech) son solo placeholders y no aportan contexto de negocio real.
  - Domain: CLI & System Context
  - Related capability: Generación de Context Pack
  - Impact: high
  - Possible roadmap candidate: yes

- [gap] Sistema sin Work Items definidos, lo que limita la capacidad de usar los skills de refinamiento.
  - Domain: Agent Skills & Workflows
  - Related capability: Gestión de Skills Reutilizables
  - Impact: high
  - Possible roadmap candidate: yes

## Roadmap Candidate Signals

- [candidate] Generar artefactos de code ownership mediante el comando `kaddo owners suggest`.
  - Domain: CLI & System Context
  - Related capability: Escaneo y Validación (Guardrails)
  - Based on: gap (Falta de datos de cobertura)

- [candidate] Reemplazar placeholders de Product/Tech documentando la arquitectura y casos de uso actuales del CLI.
  - Domain: CLI & System Context
  - Related capability: Generación de Context Pack
  - Based on: gap (Conocimiento en estado Placeholder)

- [candidate] Crear el primer lote de Work Items para validar el flujo completo de `work-item-refinement`.
  - Domain: Agent Skills & Workflows
  - Related capability: Gestión de Skills Reutilizables
  - Based on: business goal / gap (Fase actual "Discovery" con 0 items)
