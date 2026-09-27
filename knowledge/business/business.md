---
type: business
project_state: ai-assisted
generated_by: kaddo
template_version: 1
refined_by: business-agent
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Business Context

## Product Brief

Kaddo es una herramienta y plataforma que facilita el desarrollo de software asistido por inteligencia artificial mediante un enfoque de **Knowledge-Driven Development (KDD)**. Actúa como una capa de conocimiento que conecta la intención inicial de una tarea (generalmente creada en herramientas de gestión externas) con la ejecución, asegurando que tanto desarrolladores humanos como agentes de IA tengan el contexto completo para tomar decisiones correctas.

## Problem Statement

Los equipos de ingeniería y los agentes de IA a menudo construyen y modifican software utilizando contexto temporal, fragmentado o incompleto. Aunque tengan acceso al código fuente, desconocen el porqué de las decisiones, las reglas de negocio, la arquitectura intencionada o las restricciones regulatorias, lo que genera soluciones técnicamente válidas pero incorrectas para la realidad del proyecto.

- **[Assumption]** Asumimos que los errores técnicos y funcionales generados por asistentes de IA y agentes autónomos se deben principalmente a la ausencia de contexto del negocio y del sistema, y no a una falta de capacidad de razonamiento o generación del LLM.
- **[Open Question]** ¿Cuál es el costo económico real (horas de retrabajo, deuda técnica) que esta fragmentación de contexto produce hoy en los equipos de desarrollo objetivo?

## Users and Personas

### Primary Users

- **Software Developer / Engineer**: Utiliza Kaddo para comprender un `Work Item` enriquecido con todo el contexto técnico, de producto y de negocio antes de modificar el sistema.
- **AI Agent**: Actor del sistema (no un tomador final de decisiones) que lee el conocimiento del repositorio para descubrir contexto, analizar el impacto de los cambios, refinar Work Items y proponer implementaciones que respeten la arquitectura.

### Secondary Users

- **Software / Solution Architect**: Documenta y estructura las restricciones y decisiones arquitectónicas para que el desarrollo asistido por IA no deteriore el sistema.
- **Tech Lead / Engineering Lead**: Eleva la calidad de la definición de las tareas antes de su ejecución y previene que el conocimiento quede atrapado en "silos" de personas clave.
- **Product Owner / Product Manager**: Aporta intención y definición funcional en la creación de Work Items sin necesidad de detallar la implementación técnica.
- **Business Analyst / Domain Expert**: Define y aporta las reglas de negocio que luego Kaddo vincula sistemáticamente con el código.
- **Non-technical Stakeholder / Kaddo Admin**: Consulta o introduce conocimiento en el ecosistema sin la fricción de interactuar directamente con código, repositorios o CLI.

## Value Proposition

Kaddo transforma el conocimiento disperso y tácito del proyecto en un activo persistente, estructurado y versionado. Al consolidar las dimensiones de Negocio, Producto, Tecnología y Delivery, empodera a los equipos y a los agentes de IA para ejecutar tareas con alta precisión, respetando las restricciones del sistema original mientras se mantiene siempre el control humano sobre las decisiones y el lifecycle de desarrollo.

## Business Rules

1. **Persistencia de Conocimiento:** El conocimiento relevante del proyecto (reglas, decisiones) DEBE persistir en el repositorio. NO DEBE depender exclusivamente de historiales de chat, prompts temporales o memoria individual.
2. **Multidimensionalidad del Contexto:** El sistema DEBE agrupar el conocimiento en al menos cuatro dimensiones complementarias: Business, Product, Tech y Delivery.
3. **Refinamiento Obligatorio:** Un `Work Item` inicial (capturado como intención) NO ES equivalente a una definición lista para implementarse. DEBE pasar por un proceso de "Refinement" antes de ser ejecutado.
4. **Preservación del Human-in-the-Loop:** Decisiones clave como la importación de un elemento externo (`External Item → Import`), las revisiones críticas y las acciones de control de versiones (`git push`, `git merge`) REQUIEREN explicitamente intervención o confirmación humana.
5. **Autonomía Externa:** Kaddo NO DEBE modificar automáticamente elementos en los sistemas externos (ej. Jira). Durante la fase de Discovery, el provider sigue siendo el único dueño del elemento externo.
6. **Independencia Post-Importación:** Al importar un `ExternalWorkItem`, este se convierte en un `Kaddo WorkItem` nativo. Sus ciclos de vida son diferentes; cambios en el estado de Kaddo NO DEBEN forzar un cambio automático en el provider externo, y viceversa.
7. **Resiliencia de Work Items:** Un `Work Item` importado DEBE seguir siendo utilizable en Kaddo incluso si el provider o la integración externa deja de estar disponible.
8. **Inmutabilidad de la Intención Original:** Kaddo DEBE mantener un snapshot separado con la intención original del `ExternalWorkItem` para permitir auditoría y trazabilidad sobre cómo el trabajo fue evolucionando.
9. **Trazabilidad de Origen:** Todo Work Item importado DEBE registrar su origen persistiendo `provider`, `integrationId`, `externalId` y `importedAt`.
10. **Idempotencia de Importaciones:** Importar el mismo elemento externo (`integrationId` + `externalId`) NO DEBE generar Work Items duplicados en el proyecto Kaddo.
11. **Seguridad de Credenciales:** Los secrets, tokens y contraseñas NO DEBEN guardarse en el conocimiento persistido del repositorio ni en las snapshots originales.

## Constraints

- **Restricción de Ejecución Segura:** Kaddo (y sus agentes) tienen prohibido ejecutar `git commit`, `git push` o `git merge` automáticamente. Todo cambio estructural debe ser revisado por un humano.
- **Restricción de Estandarización:** El modelo de dominio de Kaddo debe mantenerse "provider-neutral". El manejo de formatos o sintaxis externas (como JQL o WIQL) corresponde exclusivamente a las capas de adaptadores (adapters).
- **Restricción Arquitectónica (Single Source of Truth):** Todas las interfaces de Kaddo (Admin, CLI, MCP y agentes) deben operar estrictamente sobre el mismo estado del proyecto alojado en el repositorio (archivos). No puede haber copias ocultas de dominio aisladas.
- **[Constraint/Assumption]** El sistema debe estar preparado para operar dentro de flujos locales de desarrolladores usando pnpm, así como entornos de CI/CD (GitHub Actions).
- **[Open Question]** ¿Existen restricciones de compliance y regulación (ej. GDPR, HIPAA) sobre el manejo de información sensible si Kaddo procesa el contexto enviándolo a modelos LLM de terceros?

## Glossary

- **Knowledge-Driven Development (KDD):** Enfoque de ingeniería de software donde el contexto integral (negocio, arquitectura, intención) se provee explícitamente a los desarrolladores o agentes de IA antes de la implementación.
- **Work Item:** Unidad atómica y refinada de trabajo dentro del ecosistema Kaddo, la cual posee todo el conocimiento asociado necesario para su implementación.
- **ExternalWorkItem:** Elemento de trabajo originado en un provider (Jira, GitHub, etc.) que ha sido descubierto pero todavía no ha sido importado formalmente.
- **Refinement:** Fase en la cual la intención cruda del usuario se enriquece conectándola con conocimiento existente, documentando el impacto sistémico y definiendo criterios claros.
- **Context Pack:** Paquete generado de forma determinística por Kaddo (vía CLI) que contiene el contexto agregado del proyecto, utilizado por el LLM para razonar con precisión sin alucinar soluciones.
- **Knowledge Drift:** Decadencia o desfase natural que ocurre cuando el código fuente avanza y el contexto/documentación del proyecto se queda obsoleto.
- **Provider:** Sistema externo de gestión de trabajo o ciclo de vida (ej. Jira, GitHub Issues) que actúa como fuente de Work Items iniciales.

## Assumptions and Open Questions

- **[Assumption]** El modelo de adopción primario iniciará con equipos pequeños ("small team") en arquitecturas monorepositorio.
- **[Assumption]** El rol de "AI Agent" seguirá teniendo limitaciones operacionales requiriendo validación, al menos en las etapas tempranas de adopción del producto.
- **[Open Question]** ¿Quién será el comprador ("buyer") objetivo a nivel empresarial: equipos de Plataforma (Platform Engineering), Arquitectura o Producto?
- **[Open Question]** ¿Cuál será el modelo de comercialización oficial y la licencia (Open Source vs. SaaS empresarial)?
- **[Open Question]** ¿Qué métricas precisas (y no subjetivas) demostrarán que adoptar Kaddo disminuye los errores por contexto deficiente en comparación con prompts estándar?
- **[Open Question]** ¿Cuáles serán las integraciones ("providers") prioritarias para soportar más allá de Jira y GitHub?
- **[Open Question]** ¿Cómo se escalará la gobernanza de conocimiento de Kaddo en organizaciones con múltiples equipos y cientos de repositorios distribuidos?
