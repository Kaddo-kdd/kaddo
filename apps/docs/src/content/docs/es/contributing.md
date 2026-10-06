---
title: Contribuir
description: Las contribuciones a Kaddo siguen su propio modelo de Knowledge-Driven Development — One Work Item → One Branch → One Pull Request. El conocimiento y la intención preceden a la implementación, y el código se revisa contra un Work Item explícito.
---

Kaddo se construye con su propio modelo de Knowledge-Driven Development, y las contribuciones siguen
la misma idea: **el conocimiento y la intención preceden a la implementación, y el código se revisa
contra un Work Item explícito.**

![Ciclo de contribución de Kaddo: Knowledge → Work Item → Branch → Implement → Verify → Pull Request → Review → Merge](/contribution-cycle.webp)

> **One Work Item → One Branch → One Pull Request.**

Una contribución representa un único outcome coherente. No significa "PR pequeño" — un Work Item
K3/K4 puede justificar una PR grande. Significa que una PR no debe mezclar outcomes independientes.
Si durante la implementación descubres trabajo fuera del scope del Work Item actual, abre un Work
Item, rama y PR **aparte**, en vez de ampliar la contribución en silencio.

## El flujo

1. **Parte del `main` más reciente.**
2. **Entiende primero el conocimiento relevante** — usa el conocimiento del propio Kaddo (business,
   product, tech, arquitectura, capabilities, initiatives, roadmap, Work Items completados y sus
   learnings) vía el CLI, el servidor MCP, los agentes de Kaddo o tu LLM preferido. No necesitas leer
   todo el repo a mano.
3. **Define o selecciona un Work Item** — proporcional al cambio.
   - *Trabajo planificado:* referencia un `WI-xxx` canónico existente (de una Initiative), sin
     duplicarlo.
   - *Contribuciones nuevas / externas:* incluye la **definición del Work Item en la PR** en vez de
     crear un `WI-xxx` en tu fork. El maintainer decide después si materializarlo en la trazabilidad
     canónica de Kaddo. **No** se requiere una Initiative.
4. **Discute primero** los cambios que lo requieran (nuevos comandos/flags, esquema de frontmatter,
   comportamiento de Knowledge Level o de Guard).
5. **Crea una rama dedicada** por Work Item (`feat/…`, `fix/…`, `docs/…`).
6. **Implementa** y luego **valida / verifica** contra los acceptance criteria (`kaddo verify <WI-ID>`
   para Work Items canónicos).
7. **Abre una Pull Request** con el PR template — referencia el Work Item canónico o embebe la
   definición utilizada, con validación/evidencia y cualquier impacto en el conocimiento.

**El review es contra la intención, no solo contra el diff.** El reviewer comprueba si la
implementación satisface el Work Item — intención, scope, acceptance criteria y validación — sin
scope no declarado.

## Guía completa

Esta página es un overview. La guía de contribución completa y canónica — setup, estructura del
proyecto, tests, el lifecycle del Build Contract, estilo de commits, el Pull Request template y el
proceso de release — vive en el repositorio:

- **[CONTRIBUTING.md en GitHub](https://github.com/Kaddo-kdd/kaddo/blob/main/CONTRIBUTING.md)**
- **[Pull Request template](https://github.com/Kaddo-kdd/kaddo/blob/main/.github/PULL_REQUEST_TEMPLATE.md)**

Para el detalle del lifecycle detrás de los pasos 3–7, mira las páginas de
[Flujo de trabajo](/es/workflow/) y
[Trazabilidad de Work Items](/es/playbook/work-item-traceability/).
