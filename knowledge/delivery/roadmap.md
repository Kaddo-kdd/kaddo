---
type: roadmap
id: roadmap
status: draft
generated_by: roadmap-agent
template_version: 1
knowledge_level: K3
---

# Roadmap

## Summary

El roadmap del proyecto Kaddo define la secuencia estratégica para evolucionar el sistema desde su fase actual de **Knowledge Refinement** hacia una plataforma totalmente operativa de **Knowledge-Driven Development (KDD)**. Prioriza el fortalecimiento del conocimiento base (capas de Producto y Tecnología), la gobernanza del código mediante el establecimiento de propiedad (code ownership), la materialización y refinamiento del primer conjunto de Work Items nativos, la automatización de guardrails en el pipeline de CI/CD, y la detección temprana de obsolescencia de conocimiento (Knowledge Drift).

## Assumptions

1. **Estrategia de Contexto Progresivo (K1-K4):** Se adopta un modelo gradual donde las tareas de baja complejidad o alcance puntual reciben un nivel de contexto mínimo o local (K1/K2), mientras que las iniciativas complejas o de arquitectura recuperan el contexto del sistema completo (K3/K4).
2. **Priorización de Interfaces (CLI/MCP vs. Admin UI):** Para la etapa inicial y el MVP, las interfaces primarias operativas son el CLI (`kaddo`) y el servidor MCP para agentes. La interfaz visual Kaddo Admin UI se considera secundaria y orientada a la visualización.

## Roadmap Principles

- **KDD First:** El conocimiento del sistema (Business, Product, Tech y Delivery) debe preceder y fundamentar la implementación de cualquier código o tarea.
- **Human-in-the-Loop Preservado:** Operaciones críticas como commit, push, merge o la importación de fuentes externas requieren siempre autorización explícita y supervisión humana.
- **Arquitectura Provider-Neutral:** Las abstracciones del dominio deben mantenerse agnósticas de los proveedores externos (Jira, GitHub, etc.).
- **Gobernanza y Validación Automática:** Las validaciones de reglas (`kaddo guard`) y escaneo de contexto (`kaddo scan`) deben ser integradas sistemáticamente en el flujo de trabajo continuo.

## Initiatives

### RM-001: Consolidación del Conocimiento de Producto y Tecnología

- **Status:** planned
- **Priority:** high
- **Knowledge Level:** K3
- **Related domain:** CLI & System Context
- **Related capabilities:** Generación de Context Pack
- **Source signals:**
  - `[gap]` Capas de conocimiento de Producto y Tecnología son placeholders no estructurados (Impact: high).
  - `[candidate]` Reemplazar placeholders de Product/Tech documentando la arquitectura y casos de uso actuales del CLI.
- **Problem/opportunity:** La falta de especificación en `knowledge/product/` y `knowledge/tech/` limita la precisión de `kaddo context`, obligando a los agentes de IA a operar con suposiciones y elevando el riesgo de alucinaciones o desalineación arquitectónica.
- **Expected value:** Establecer un baseline de conocimiento refinado (K3) que alimente los Context Packs y garantice que las decisiones de los agentes respeten la arquitectura del sistema.
- **Risks:** Documentar comportamientos desfasados o inconsistentes con el código real si no se realiza un escaneo previo riguroso.
- **Dependencies:** Ninguna.
- **Suggested Work Items:**
  - WI-CANDIDATE-001: Documentar la arquitectura del CLI y mapa del codebase
    - type: feature
    - suggested knowledge level: K3
    - expected value: Consolidar baseline técnico
    - notes: Actualizar knowledge/tech/codebase.md
  - WI-CANDIDATE-002: Refinar el modelo de contexto de producto
    - type: chore
    - suggested knowledge level: K2
    - expected value: Clarificar casos de uso principales
    - notes: Actualizar knowledge/product/product.md

### RM-002: Definición y Mapeo de Code Ownership

- **Status:** planned
- **Priority:** high
- **Knowledge Level:** K2
- **Related domain:** CLI & System Context
- **Related capabilities:** Escaneo y Validación (Guardrails)
- **Source signals:**
  - `[gap]` Falta total de propiedad de artefactos y código (Ownership coverage: 0/0) (Impact: medium).
  - `[candidate]` Generar artefactos de code ownership mediante el comando `kaddo owners suggest`.
- **Problem/opportunity:** Al carecer de metadatos de propiedad sobre los módulos y archivos del repositorio, la validación de `kaddo guard` se encuentra silenciada (`silent_without_ownership: true`), dejando al proyecto desprotegido ante modificaciones no autorizadas o sin responsable designado.
- **Expected value:** Establecer un mapa claro de responsabilidad por módulo y habilitar los guardrails automáticos durante el escaneo.
- **Risks:** Asignaciones de ownership erróneas o fragmentadas que entorpezcan el flujo de refinamiento.
- **Dependencies:** RM-001
- **Suggested Work Items:**
  - WI-CANDIDATE-003: Ejecutar kaddo owners suggest y consolidar propiedad
    - type: feature
    - suggested knowledge level: K2
    - expected value: Habilitar metadatos de propiedad por módulo
    - notes: Consolidar asignación de ownership en artefactos de conocimiento
  - WI-CANDIDATE-004: Ajustar configuración de kaddo guard
    - type: chore
    - suggested knowledge level: K2
    - expected value: Eliminar silencio preventivo
    - notes: Activar alertas de propiedad durante escaneo

### RM-003: Creación y Materialización del Primer Lote de Work Items

- **Status:** planned
- **Priority:** high
- **Knowledge Level:** K2
- **Related domain:** Agent Skills & Workflows
- **Related capabilities:** Gestión de Skills Reutilizables
- **Source signals:**
  - `[gap]` Sistema sin Work Items definidos (Impact: high).
  - `[candidate]` Crear el primer lote de Work Items para validar el flujo completo de `work-item-refinement`.
- **Problem/opportunity:** El sistema cuenta actualmente con 0 Work Items creados o materializados, lo que impide ejecutar y validar en condiciones reales las habilidades de refinamiento (`work-item-refinement`, `implementation-planning`, etc.).
- **Expected value:** Convertir las iniciativas estratégicas del roadmap en Work Items operativos e iniciar el ciclo de vida de desarrollo asistido por agentes.
- **Risks:** Definición inadecuada de tareas que requiera iteraciones excesivas de refinamiento.
- **Dependencies:** RM-001
- **Suggested Work Items:**
  - WI-CANDIDATE-005: Materializar candidatos del roadmap
    - type: feature
    - suggested knowledge level: K2
    - expected value: Crear primeros Work Items nativos
    - notes: Ejecutar kaddo create --from roadmap
  - WI-CANDIDATE-006: Refinar Work Items generados con work-item-agent
    - type: spike
    - suggested knowledge level: K2
    - expected value: Validar ciclo de vida de refinamiento
    - notes: Probar flujo de refinamiento con agente

### RM-004: Integración de Guardrails en Pipeline CI/CD

- **Status:** proposed
- **Priority:** medium
- **Knowledge Level:** K2
- **Related domain:** Project Infrastructure
- **Related capabilities:** Continuous Integration & Testing, Escaneo y Validación (Guardrails)
- **Source signals:**
  - `[assumption]` Los flujos de CI validan `kaddo scan` o `kaddo guard` en el pipeline.
  - Capability parcial: Escaneo y Validación (Guardrails).
- **Problem/opportunity:** Los workflows actuales de GitHub Actions ejecutan la suite de pruebas (Vitest), pero no ejecutan las verificaciones de integridad de Kaddo (`kaddo scan`, `kaddo guard`), permitiendo que cambios sin contexto o violaciones de ownership entren al repositorio.
- **Expected value:** Automatizar la verificación continua de guardrails en cada Pull Request o Commit.
- **Risks:** Bloqueos injustificados en el pipeline de CI por falta de actualización en los artefactos de conocimiento.
- **Dependencies:** RM-002
- **Suggested Work Items:**
  - WI-CANDIDATE-007: Configurar pasos de kaddo guard en GitHub Actions
    - type: feature
    - suggested knowledge level: K2
    - expected value: Verificación continua en CI
    - notes: Agregar kaddo scan y kaddo guard a los workflows de CI
  - WI-CANDIDATE-008: Resolver compatibilidad en entornos CI
    - type: bugfix
    - suggested knowledge level: K2
    - expected value: Asegurar ejecución limpia en runner CI
    - notes: Probar guardrails en modo headless

### RM-005: Detección y Gestión de Knowledge Drift y Source Drift

- **Status:** proposed
- **Priority:** medium
- **Knowledge Level:** K3
- **Related domain:** CLI & System Context
- **Related capabilities:** Generación de Context Pack, Escaneo y Validación (Guardrails)
- **Source signals:**
  - `[open question]` ¿Cómo se detectará y administrará Knowledge Drift y Source Drift? (`product.md`).
- **Problem/opportunity:** A medida que la base de código evoluciona, existe el riesgo de que la documentación y los Work Items queden desalineados con respecto a la implementación real.
- **Expected value:** Evitar la obsolescencia del conocimiento persistido y alertar oportunamente a desarrolladores y agentes sobre divergencias.
- **Risks:** Complejidad en la comparación semántica entre código fuente y capas de conocimiento.
- **Dependencies:** RM-001, RM-003
- **Suggested Work Items:**
  - WI-CANDIDATE-009: Investigar heurísticas de detección de drift
    - type: spike
    - suggested knowledge level: K3
    - expected value: Definir reglas de detección de desalineación
    - notes: Extender kaddo scan para detectar drift
  - WI-CANDIDATE-010: Incorporar alertas de drift en context pack
    - type: feature
    - suggested knowledge level: K2
    - expected value: Alertar desalineación en handoff LLM
    - notes: Agregar advertencias en kaddo context

## Suggested Execution Order

1. **RM-001:** Consolidación del Conocimiento de Producto y Tecnología *(Baseline K3)*
2. **RM-002:** Definición y Mapeo de Code Ownership *(Gobernanza K2)*
3. **RM-003:** Creación y Materialización del Primer Lote de Work Items *(Lifecycle K2)*
4. **RM-004:** Integración de Guardrails en Pipeline CI/CD *(Automatización K2)*
5. **RM-005:** Detección y Gestión de Knowledge Drift y Source Drift *(Sostenibilidad K3)*

## Risks and Constraints

- **Restricción de Operaciones Git:** Prohibición estricta de ejecutar `git commit`, `git push` o `git merge` automáticamente por parte del agente o CLI de Kaddo.
- **Single Source of Truth:** El conocimiento debe residir exclusivamente en el repositorio en formato Markdown estructurado con frontmatter YAML.
- **Riesgo de Desfase de Contexto:** Si no se actualiza la información tras cambios significativos en el código, el Context Pack entregará contexto obsoleto a los agentes LLM.

## Not Now

- **Sincronización Bidireccional Automática con Providers Externos:** No se construirá sincronización automática de estado hacia Jira o GitHub para preservar la independencia de los ciclos de vida post-importación.
- **Ampliación de Kaddo Admin UI:** Desarrollo de nuevas pantallas o paneles complejos en el Admin UI, manteniendo el foco MVP en CLI y MCP.
- **Integraciones con Múltiples Providers Adicionales:** Implementación inmediata de adapters para GitLab/Linear/Azure DevOps antes de consolidar el ciclo nativo de Work Items.

## Next Recommended Work Item

- **RM-001-WI-01:** Documentar la arquitectura del CLI y mapa del codebase en `knowledge/tech/codebase.md` para consolidar el baseline de conocimiento del sistema.
