---
title: Guía de colaboración
description: Cómo un equipo opera Kaddo sin burocracia — gobernanza por excepción, expectativas por rol, Guard como señal de revisión y un checklist de PR ligero.
---

Kaddo está diseñado para mantener el conocimiento vivo **sin** convertir el desarrollo en
papeleo. El principio rector es la **gobernanza por excepción**: captura el conocimiento
mínimo requerido y añade rigor solo donde el drift realmente importa.

Esto funciona para un desarrollador solo y para un equipo grande. Ajusta las prácticas a tu
contexto — un proyecto indie puede omitir la mayoría de los roles de abajo.

## Modelo de colaboración sugerido

| Rol | Responsabilidad |
|---|---|
| **Developer** | Crea o actualiza el Work Item junto con el cambio de código. |
| **Tech Lead** | Revisa el conocimiento de alto riesgo por excepción, no cada cambio. |
| **Architect** | Revisa cambios de ADR / arquitectura. |
| **Product Owner** | Valida capacidades y supuestos del roadmap. |
| **Todo el equipo** | Trata los avisos de Guard como señales de revisión, no bloqueos. |

En un proyecto solo o indie, una persona cumple todos los roles — el valor es el mismo: un
repo que recuerda por qué existe el código.

## Reglas

- No documentes todo.
- Captura el **conocimiento mínimo requerido** para el Nivel de Conocimiento del Work Item.
- Usa los Niveles de Conocimiento para evitar burocracia.
- Declara ownership solo donde el drift importa.
- Trata los avisos de Guard como **prompts de revisión**, no como fallos.
- Usa la revisión de PR para validar conocimiento, no para castigar la falta de docs.
- Nunca aceptes output del LLM sin revisión humana.

## Manejo de avisos de Guard

`kaddo guard` es intencionalmente **no bloqueante**. Un aviso significa: "código cambiado
coincide con un artefacto que no se actualizó — ¿es intencional?" Dos respuestas válidas:

1. **Actualiza el artefacto** — el conocimiento cambió de verdad.
2. **Déjalo intencionalmente** — el cambio no afecta al conocimiento; anótalo en el PR.

Guard nunca rompe el build por sí mismo. Plantea una pregunta para que la responda un humano.

## Checklist de PR sugerido

```txt
- ¿Este cambio tiene el Work Item correcto?
- ¿El Work Item tiene suficiente contexto para su Nivel de Conocimiento?
- Si existe ownership de código, ¿se actualizó el artefacto o se dejó sin cambios a propósito?
- ¿Guard produjo avisos?
- ¿Están documentados los supuestos?
- ¿Hay aprendizaje que preservar?
```

---

Vuelve a [Conceptos](/es/playbook/concepts/) o salta al
[Prompt Workflow](/es/playbook/prompt-workflow/).
