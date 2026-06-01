---
title: Trazabilidad de Work Items
description: Cómo un candidato del roadmap se convierte en Work Item, se conecta al código vía ownership, dispara señales de Guard y preserva el aprendizaje.
---

La trazabilidad es lo que hace de Kaddo un sistema de conocimiento y no una carpeta de
documentos. Cada Work Item puede rastrearse hacia atrás (por qué existe) y hacia adelante (el
código que gobierna).

## La cadena de trazabilidad

```txt
Iniciativa del roadmap
  ↓
Work Item candidato
  ↓
Work Item de Kaddo
  ↓
Metadata de ownership
  ↓
Cambio de código
  ↓
Señal de Guard
  ↓
Aprendizaje
```

Cada eslabón responde una pregunta:

- **Iniciativa del roadmap** — ¿por qué está en nuestro radar?
- **Work Item candidato** — ¿qué deberíamos hacer exactamente?
- **Work Item de Kaddo** — la unidad de trabajo comprometida y trazable.
- **Metadata de ownership** — ¿qué código gobierna este conocimiento?
- **Cambio de código** — la implementación real.
- **Señal de Guard** — ¿el código avanzó sin el conocimiento?
- **Aprendizaje** — ¿qué debería saber la siguiente persona?

## Ejemplo de front matter

```yaml
---
type: feature
id: WI-20260601-001
status: proposed
knowledge_level: K2
source: roadmap
source_id: WI-CANDIDATE-001
source_initiative: RM-001
domains:
  - loyalty
capabilities:
  - points-management
code:
  - src/points/**
---
```

| Campo | Significado |
|---|---|
| `type` | Tipo de Work Item: feature, bugfix, hotfix, spike, migración… |
| `id` | Identificador único y estable de este Work Item |
| `status` | Estado del ciclo de vida: proposed, in-progress, done, cancelled |
| `knowledge_level` | Contexto mínimo requerido (K0–K4) — ver [Conceptos](/es/playbook/concepts/) |
| `source` | De dónde vino este Work Item (p. ej. `roadmap`) |
| `source_id` | El candidato del roadmap que lo originó |
| `source_initiative` | La iniciativa de roadmap de nivel superior |
| `domains` | Dominios de negocio/producto que toca |
| `capabilities` | Capacidades de producto que afecta |
| `code` | Patrones glob que conectan este artefacto al código (los usa Guard) |

## Cómo usa Guard la trazabilidad

Cuando cambias `src/points/checkout.ts`, `kaddo guard` lee el `git diff`, detecta que el
archivo coincide con el glob `code:` de `WI-20260601-001` y —si el Work Item no se actualizó
en el mismo diff— muestra un FYI no bloqueante. La señal apunta a los revisores hacia
conocimiento que podría estar desactualizado.

---

Siguiente: [Ejemplos con otras herramientas](/es/playbook/tool-examples/) — cómo encaja Kaddo
en tu stack.
