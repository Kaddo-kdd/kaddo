---
title: Domain Owners
description: Asigna dominios a dueños para las notificaciones de guard.
---

Declara los dueños de dominio en `.kaddo/config.yml`:

```yaml
owners:
  payments: "@alice"
  orders: "@bob"
```

Lístalos:

```bash
kaddo owners                 # todos los dominios
kaddo owners --domain payments
```

Cuando `kaddo guard` relaciona el código tocado con los dominios de un artefacto,
se muestran los dueños afectados (e incluidos en el JSON de `--ci` bajo
`domain_owners`), para que la persona correcta sepa que el conocimiento podría
necesitar revisión.

## Declarar propiedad de código con el asistente

Guard solo actúa sobre artefactos que declaran globs `code:`. En lugar de editar YAML a mano,
ejecuta el asistente de propiedad:

```bash
kaddo owners suggest
```

Lista los Work Items sin propiedad, sugiere globs candidatos a partir de tu baseline de scan
(`.kaddo/scan.json`) y de los `domains`/`capabilities` del artefacto, y te deja elegir o
escribir globs. Tras confirmar, actualiza solo el front matter — el cuerpo queda intacto:

```yaml
# antes
code: []

# después
code:
  - src/payments/**
```

El asistente es **determinista**: Kaddo sugiere, tú confirmas. Nunca llama a un LLM ni edita
código fuente. Si falta `.kaddo/scan.json`, igual puedes ingresar globs manualmente.

**Flujo:** `kaddo create` (o `kaddo create --from roadmap`) → `kaddo owners suggest` →
`kaddo guard`.
