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

## Entrada manual asistida

Cuando escribes un glob a mano, Kaddo te ayuda a evitar errores comunes:

- **Normaliza** una ruta de directorio a glob — `src/cli` → `src/cli/**`.
- **Valida la ruta** y ofrece una coincidencia cercana — `src/shares/**` → *"Path does not exist.
  Did you mean `src/shared/**`?"*.
- **Advierte por globs demasiado amplios** — `src/**` → *"This glob is broad and may reduce Guard
  usefulness."*.

## Ownership asistido por agente

Para una propuesta precisa a nivel de proyecto, usa el **`ownership-agent`**: lee el context pack,
los Work Items, `codebase.md` y el inventory, y propone globs `code:` acotados. Luego confirmas y
los aplicas con `kaddo owners suggest` — el agente nunca modifica archivos. Piensa en
`owners suggest` como la herramienta manual/override y en el ownership-agent como el proponente.

**Flujo:** `kaddo scan` → `kaddo context` → ownership-agent → el humano confirma →
`kaddo owners suggest` → `kaddo guard`.
