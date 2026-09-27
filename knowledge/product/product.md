---
type: product
project_state: active
generated_by: kaddo
template_version: 1
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Product Context

## Existing product behavior

Kaddo es un toolkit open source para desarrollo de software asistido por IA que permite implementar **Knowledge-Driven Development (KDD)**.

El producto busca que los agentes no dependan únicamente del contexto temporal de una conversación, sino que trabajen utilizando conocimiento persistente, estructurado y versionable del proyecto.

Kaddo organiza este conocimiento alrededor de cuatro dimensiones principales:

- **Business:** propósito, actores, reglas y contexto del negocio.
- **Product:** comportamiento esperado, flujos y decisiones del producto.
- **Tech:** arquitectura, sistemas, componentes, restricciones y decisiones técnicas.
- **Delivery:** forma de trabajo, proceso de entrega, estándares y restricciones operativas.

El conocimiento vive dentro del proyecto y puede ser consumido por personas, herramientas y agentes.

Kaddo utiliza **Work Items** como unidades de intención y trabajo. Un Work Item puede iniciar con información mínima y evolucionar mediante un proceso de refinamiento que utiliza el conocimiento disponible del proyecto.

El lifecycle distingue conceptualmente:

```text
Captured Intent
      ↓
Needs Refinement
      ↓
Knowledge Discovery
      ↓
Agent Refinement
      ↓
Human Review
      ↓
Ready
```

El objetivo del refinement es transformar una intención inicial en una definición suficientemente contextualizada para que un agente pueda construir la solución con menor ambigüedad.

Kaddo expone sus capacidades mediante diferentes interfaces que operan sobre el mismo proyecto:

```text
CLI
MCP
Admin
Agents
```

Estas interfaces no representan fuentes de verdad independientes. Las operaciones de dominio deben converger en Kaddo Core y en los artefactos persistidos dentro del proyecto.

Kaddo Admin proporciona una interfaz visual local para navegar y administrar capacidades como:

```text
Overview
Knowledge
Work Items
System
Integrations
External Items
```

El Admin mantiene el modelo local-first de Kaddo y no requiere una base de datos independiente para duplicar el estado del proyecto.

Kaddo también dispone de una Integration Foundation basada en adapters.

Los providers externos se conectan mediante:

```text
External Provider
      ↓
Integration Adapter
      ↓
ExternalWorkItem
      ↓
Kaddo
```

Los adapters encapsulan los detalles específicos de cada provider y normalizan los elementos externos hacia contratos comunes de Kaddo.

Jira es el primer provider real implementado sobre esta arquitectura.

Actualmente Kaddo puede:

```text
Configure Jira
      ↓
Verify
      ↓
Define Discovery Scope
      ↓
Discover Jira Issues
      ↓
Filter / Search / Paginate
      ↓
ExternalWorkItem
      ↓
Human Selection
      ↓
Import to Kaddo
      ↓
Kaddo Work Item
```

Un elemento externo no se convierte automáticamente en un Work Item.

El usuario debe realizar explícitamente:

```text
Import to Kaddo
```

Durante el import se preservan:

```text
provider
integrationId
externalId
source URL
importedAt
externalUpdatedAt
Original Snapshot
```

El Work Item importado entra posteriormente al mismo pipeline de refinement utilizado por Work Items creados directamente en Kaddo.

La información original proveniente del provider se conserva separada de la definición refinada.

Conceptualmente:

```text
External Source
      ↓
Original Snapshot
      ↓
Captured Intent
      ↓
Refined Definition
```

Kaddo no implementa actualmente sincronización bidireccional automática entre un Work Item importado y el sistema externo.

Después del import ambas entidades están relacionadas mediante provenance, pero poseen ciclos de vida independientes.

## Main flows

### Project knowledge

```text
Project
   ↓
Knowledge
   ├── Business
   ├── Product
   ├── Tech
   └── Delivery
   ↓
Agents / Humans
```

El conocimiento persistido se utiliza como contexto reutilizable para comprender y modificar el sistema.

### Native Work Item

```text
Intent
   ↓
Create Work Item
   ↓
Captured Intent
   ↓
Needs Refinement
   ↓
Knowledge Discovery
   ↓
Agent Refinement
   ↓
Human Review
   ↓
Ready
```

### External Work Item

```text
External Provider
      ↓
Adapter
      ↓
Discovery
      ↓
Filtering
      ↓
ExternalWorkItem
      ↓
Human Selection
      ↓
Import
      ↓
Kaddo Work Item
      ↓
Refinement
```

### Jira integration

```text
Provider Catalog
      ↓
Jira
      ↓
Configuration
      ↓
Credentials
      ↓
Verify
      ↓
Discovery Filters
      ↓
Jira API / JQL
      ↓
External Items
```

### Import

```text
External Item
      ↓
Import Request
      ↓
Fresh Provider Read
      ↓
Duplicate / Concurrency Guard
      ↓
Choose Kaddo Work Item Type
      ↓
Create Draft
      ↓
Preserve Provenance
      ↓
Preserve Original Snapshot
```

### Admin / CLI interoperability

```text
Admin ──┐
CLI ────┼──> Kaddo Core ──> Project Artifacts
MCP ────┤
Agent ──┘
```

A change performed through one interface must be observable from the others because they operate over the same project state.

## Inferred or uncertain behavior

The following directions are compatible with the current architecture but should not be treated as completed product behavior:

- Additional providers such as GitHub, Azure DevOps, GitLab or Linear can be implemented using the Integration Adapter contract.
- Kaddo may support enterprise Secret Providers such as AWS Secrets Manager, Azure Key Vault or HashiCorp Vault.
- External source changes could eventually be used to detect source drift without automatically overwriting Kaddo Work Items.
- External Work Items could eventually support controlled auto-import rules.
- Providers could eventually support write capabilities such as comments, status updates or synchronization.
- A future adapter/plugin SDK could allow third parties to implement providers outside the main Kaddo repository.
- Kaddo Admin could evolve toward broader non-technical collaboration, authentication, authorization and multi-user capabilities.
- Multi-project or organizational management may eventually exist above the current local project model.

None of these behaviors should be assumed to exist until explicitly implemented.

## Open questions

- [open] ¿Cuál será el criterio formal para determinar que un Work Item está suficientemente refinado para pasar a `Ready`?
- [open] ¿Qué knowledge artifacts deben ser obligatorios y cuáles opcionales según el tipo de proyecto?
- [assumed] ¿Cómo debería variar el conocimiento recuperado según el alcance y complejidad del Work Item?
  - note: Asumir estrategia progresiva (K1 a K4): tareas pequeñas reciben contexto mínimo/local (K1/K2), tareas complejas recuperan contexto completo (K3/K4).
- [open] ¿Cómo debe evolucionar el System Graph/Map como fuente de contexto para agentes?
- [open] ¿Cómo se detectará y administrará Knowledge Drift?
- [open] ¿Cómo se detectará Source Drift entre un Work Item importado y su provider original?
- [open] ¿Qué capacidades de sincronización externa aportan valor sin convertir a Kaddo en otro issue tracker?
- [open] ¿Qué segundo provider permitirá validar mejor que la Integration Foundation es realmente provider-neutral?
- [assumed] ¿Qué capabilities del Admin necesitan validación adicional después del MVP mediante uso en proyectos reales?
  - note: Asumir que para el MVP la Admin UI es secundaria/de visualización y las interfaces primarias son CLI + MCP/Agentes.
