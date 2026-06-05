---
title: Eficiencia en tokens
description: Cómo escala en tokens la salida determinista de Kaddo a medida que crece un proyecto real.
---

Una pregunta justa para cualquier herramienta asistida por IA: **¿el contexto que produce sigue
siendo eficiente a medida que el proyecto crece?** Como la salida de Kaddo es determinista, esto se
puede **medir**, no estimar. Los números de abajo provienen de generar `kaddo context` y
`kaddo explain` sobre proyectos sintéticos de tamaño creciente.

## Crecimiento medido

| Escenario | Work items | Módulos | tokens `context` | tokens `explain` | tokens / work item |
|-----------|-----------|---------|------------------|------------------|--------------------|
| empty     | 0   | 0  | 619    | 305   | — |
| small     | 5   | 0  | 846    | 399   | 169 |
| medium    | 25  | 2  | 1.909  | 724   | 76 |
| large     | 100 | 5  | 5.545  | 1.870 | 55 |
| xlarge    | 500 | 20 | 25.229 | 8.040 | **50** |

> Tokens ≈ caracteres ÷ 4 (el promedio aproximado para inglés + Markdown).

## Qué significan los números

**El crecimiento es lineal, no explosivo.** El costo marginal se estabiliza en **~50 tokens por
work item** — una sola línea de metadata (`id`, `type`, nivel de conocimiento, `status`,
`domains`). El overhead fijo de un proyecto vacío es chico (~620 tokens: operating rules, la tabla
de capas de conocimiento y los encabezados de sección).

**Kaddo nunca incluye cuerpos ni código fuente.** El context pack usa resúmenes acotados
(`firstParagraph`) para los documentos y solo el **front matter** de los work items. En el caso
`xlarge`, los archivos de knowledge en disco pesan **~134.000 tokens**, mientras que el pack es
**25.229** — una reducción del **~81%**. El código fuente nunca se lee dentro del pack.

**Es determinista.** El mismo proyecto siempre produce el mismo pack. Hay cero varianza de tokens
entre ejecuciones, lo que hace la salida cacheable y auditable.

## Mantenerlo acotado al escalar

Las cifras de arriba son para el **proyecto completo, sin filtrar**. Una base de código de varios
años con cientos de work items cerrados producirá un pack grande si pides todo — pero rara vez
necesitas todo para una sola tarea.

`kaddo explain` ya soporta enfocar la salida, por eso sus números se mantienen mucho más bajos que
los de `context` al mismo tamaño de proyecto:

```bash
kaddo explain --scope payments      # solo un dominio
kaddo explain --type adr            # solo un tipo de artefacto
kaddo explain --since 2026-01-01    # solo trabajo reciente
```

### Guía práctica

- Para los handoffs diarios al agente, enfoca al **dominio o work item que estás tocando** en lugar
  de volcar toda la historia.
- Los work items cerrados se acumulan con el tiempo. Trata el pack completo y sin filtrar como un
  artefacto de **onboarding / auditoría**, no como lo que pegas en cada chat.
- Como la salida es determinista y solo de front-matter, el pack es una **cota inferior** de lo que
  costaría un briefing equivalente escrito a mano — y nunca filtra código fuente al prompt.

## Por qué importa

El modelo de dos capas de Kaddo (CLI determinista → LLM que interpreta) existe en parte por esto: el
CLI hace el empaquetado barato y repetible para que tus tokens se gasten en **interpretación**, no
en volver a derivar la estructura del proyecto cada vez. El contexto eficiente es un efecto
secundario de mantener el CLI determinista y libre de código fuente.
