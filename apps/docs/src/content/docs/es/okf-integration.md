---
title: Open Knowledge Format (OKF)
description: Exporta el conocimiento canónico de Kaddo como un bundle portable de Open Knowledge Format (OKF v0.2) y valídalo — interoperabilidad opcional, de solo lectura, Kaddo sigue siendo la fuente de verdad.
---

Kaddo puede proyectar su conocimiento canónico en un bundle **Open Knowledge Format (OKF v0.2)**: una
colección portable de conceptos Markdown con metadatos estructurados que otras herramientas y agentes
pueden leer **sin instalar Kaddo**. Es interoperabilidad opcional — Kaddo sigue siendo la fuente de
verdad y la exportación nunca modifica tu conocimiento.

## ¿Qué es OKF?

[Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format) es una
especificación abierta para representar e intercambiar conocimiento como bundles de archivos Markdown
con frontmatter estructurado. La versión de referencia de este adaptador es **v0.2**.

## OKF vs Kaddo

| | Kaddo | Bundle OKF |
|---|---|---|
| Rol | Estructura, relaciona y gobierna el conocimiento durante el lifecycle | Proyección portable de ese conocimiento |
| Fuente de verdad | Sí | No (snapshot de solo lectura) |
| Requiere Kaddo para consumir | — | No |

Una **Knowledge Capsule** es un resumen contextual para un consumidor; un **bundle OKF** es una
colección portable de conceptos. OKF **complementa** las cápsulas, no las reemplaza.

## Arquitectura

```text
Kaddo Knowledge → Core Readers → OKF Adapter → OKF Bundle
```

El adaptador es de solo lectura y reutiliza los readers Core existentes (descubrimiento de artifacts,
Work Items, Project Resources, deprecaciones, grafo de conocimiento). No reimplementa descubrimiento ni
parsing, y nunca se vuelve una segunda fuente de verdad.

## Comandos

```bash
# Exportar el bundle (por defecto: .kaddo/okf)
kaddo okf export
kaddo okf export --output ./exports/okf
kaddo okf export --with-reports   # incluir también reportes Impact/Drift/Savings

# Validar un bundle (solo lectura)
kaddo okf validate
kaddo okf validate ./exports/okf
```

Ambos admiten `--json` para automatización.

## Estructura del bundle

```text
.kaddo/okf/
  index.md            # índice raíz — declara okf_version: "0.2"
  business/           # conocimiento de negocio + su index.md
  product/
  tech/
  delivery/
    work-items/
    deprecations/
    runbooks/
  resources/
  external/           # knowledge references (cápsulas)
```

`index.md` y `log.md` son nombres reservados de OKF; los índices dan navegación progresiva. Cada
concepto es un archivo Markdown con `type` obligatorio, más `title`, `description`, `tags`, `sources`
(procedencia) y el `kaddo_id` estable.

## Mapping de conceptos

| Kaddo | Concepto OKF |
|---|---|
| Conocimiento de Negocio / Producto / Tech | Business / Product / Technical Knowledge |
| Arquitectura / ADR | Architecture Decision |
| Capability | Capability |
| Work Item | Work Item |
| Initiative | Initiative |
| Project Resource | Project Resource |
| Deprecación controlada | Deprecation Plan |
| Knowledge Capsule | Knowledge Reference |
| Reporte Impact / Drift / Savings | Report |

OKF no tiene taxonomía cerrada de tipos: los tipos desconocidos se exportan como conceptos genéricos
legibles en vez de descartarse, para que un consumidor igual los trate como conocimiento.

## Procedencia y confianza

El adaptador sigue las convenciones de OKF v0.2 (`sources`, `generated`, `verified`, `status`,
`stale_after`) de forma conservadora:

- La **procedencia** es la ruta e id canónicos reales del artifact — nunca inventados.
- La **confianza** no se fabrica: que un Work Item pase la validación técnica no implica que todo el
  documento de conocimiento haya sido revisado por un humano, así que no se afirma verificación sin
  evidencia.
- La **vigencia** (`stale_after`) no se genera arbitrariamente; un timestamp de exportación no es la
  fecha de actualización del conocimiento.
- La **Attested Computation** de OKF v0.2 **no** se ejecuta — los reportes no se convierten en
  attestations solo por usar fórmulas determinísticas.

## Validación

`kaddo okf validate` es de solo lectura y **permisivo**, separando tres niveles:

- **Errores de conformidad** — p. ej. un concepto sin `type`, frontmatter inválido, ids duplicados.
- **Warnings** — p. ej. falta `okf_version` en el índice raíz.
- **Informativos** — p. ej. un enlace interno que aún no resuelve (OKF admite referencias no resueltas).

Tipos desconocidos, campos extra, campos opcionales ausentes y enlaces rotos **no** son errores de
conformidad.

## Consumir un bundle sin Kaddo

El bundle es Markdown + YAML plano. Un consumidor lee `index.md` para navegar, sigue los índices por
capa y abre cada archivo de concepto; las relaciones son enlaces Markdown relativos resueltos dentro
del bundle. No se requiere instalar Kaddo, ni su CLI, MCP o base de datos.

## Seguridad

La exportación es segura por defecto: solo lee artifacts `knowledge/*.md` (sin código, sin `.env`, sin
secretos), y los Project Resources solo llevan nombres de referencia, nunca valores de credenciales. Un
escaneo conservador advierte sobre contenido potencialmente sensible. Aun así, **revisa un bundle antes
de compartirlo externamente** — contiene el conocimiento de tu proyecto.

## Limitaciones

- El alcance inicial es **export + validate**. Importar OKF hacia Kaddo es trabajo futuro.
- Los **reportes** son opt-in con `--with-reports` (llevan un timestamp `generated.at`, así que no son
  parte del core estable del bundle); sus findings, assumptions, confidence, limitations y el disclaimer
  de Savings se preservan verbatim — las estimaciones nunca se muestran como valores observados.
- Las **Knowledge Capsules externas** (de `.kaddo/external.yml`) se representan como conceptos
  "Knowledge Reference" preservando su source y su límite de acceso, sin traer fuentes privadas ni
  implicar acceso al sistema de origen.
- El adaptador apunta a OKF v0.2 y no afirma compatibilidad con versiones futuras desconocidas.

## Ver también

- [Knowledge Capsules](/es/knowledge-capsules/) — resúmenes contextuales para un consumidor.
- [Exportar el grafo de conocimiento](/es/knowledge-graph-export/) — las relaciones que OKF preserva.
- [Resumen de comandos](/es/commands/overview/).
