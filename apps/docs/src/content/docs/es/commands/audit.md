---
title: kaddo audit run
description: Ejecuta una auditoría técnica basada en evidencia y escribe un reporte estructurado y reproducible.
---

## Vincular un Work Item existente

Después de revisar un hallazgo y un Work Item existente, aprueba explícitamente su asociación:

```sh
kaddo audit link AUD-001 AF-0123456789abcdef WI-001 --yes
```

El hallazgo debe existir en la auditoría indicada y el Work Item debe estar activo. Kaddo registra el ID estable del hallazgo en el Work Item; repetir la asociación no la duplica. Los reportes distinguen vínculos aprobados de sugerencias por ruta o módulo. El comando no crea Work Items.

`kaddo audit run` ejecuta una auditoría técnica del proyecto basada en evidencia y escribe un reporte
estructurado y reproducible. Cablea todo el flujo de auditoría de principio a fin: descubre el proyecto,
resuelve el alcance, ejecuta los analizadores, correlaciona los hallazgos con el conocimiento existente y
renderiza un reporte.

```bash
kaddo audit run
```

Por defecto audita el proyecto completo, escribe artefactos **derivados** en `.kaddo/audits/` e imprime un
resumen. Nunca escribe en `knowledge/` salvo que lo pidas con `--publish`.

## Opciones

| Opción | Descripción |
|---|---|
| `--module <id...>` | Audita solo estos módulos. Se emparejan por nombre de paquete (`@scope/pkg`) o id corto (`pkg`). |
| `--paths <glob...>` | Audita solo estas rutas. Mutuamente excluyente con `--module`. |
| `--json` | Emite el `AuditRun` en JSON a stdout en vez del resumen humano. |
| `--publish` | Escribe además el reporte canónico en `knowledge/tech/audits/` (pide confirmación antes). |
| `--yes` | Omite el prompt de confirmación de `--publish`. |

## Qué produce

- `.kaddo/audits/AUD-xxx.json` — el `AuditRun` derivado y legible por máquina (determinista).
- `.kaddo/audits/AUD-xxx.md` — el reporte Markdown derivado.
- Con `--publish` (confirmado): `knowledge/tech/audits/AUD-xxx.md` — el reporte humano canónico.

## Cobertura honesta

El reporte separa **hallazgos confirmados**, **inferencias** y **áreas no evaluadas**. Si una herramienta falta
o falla, el run se marca `partial` (o `failed`) y la herramienta queda listada como no evaluada — nunca un
resultado limpio. El comando no reclasifica hallazgos: la severidad, la confianza y la procedencia vienen del
analizador.

## Códigos de salida

- `0` — el run se ejecutó (`completed` o `partial`). **Los hallazgos no hacen fallar el comando**, así que es
  seguro ejecutarlo en CI.
- `1` — el run `failed` (todas las herramientas fallaron).
- `2` — error de uso (alcance ambiguo o módulo desconocido).

## Ejemplos

```bash
# Auditar un solo módulo
kaddo audit run --module cli

# Emitir el run como JSON para tooling
kaddo audit run --json

# Auditar y publicar el reporte canónico (pide confirmación)
kaddo audit run --publish
```

El alcance que elijas se resuelve al `AuditScope` del contrato de auditoría; el reporte y los artefactos son
reproducibles, de modo que los diffs entre dos auditorías son limpios.

## kaddo audit report

Consulta auditorías previas (de solo lectura — no re-ejecuta ni escribe).

```bash
kaddo audit report [id]
```

- `--list` — lista las auditorías persistidas (id, fecha, estado, nº de hallazgos).
- Sin id — muestra la última auditoría; `[id]` — muestra una concreta.
- `--severity <lista>` / `--category <lista>` / `--confidence <lista>` — filtra hallazgos (separados por coma;
  OR dentro de un filtro, AND entre filtros).
- `--module <id...>` — filtra hallazgos por módulo.
- `--json` — emite JSON en vez de un resumen.

```bash
# Listar todas las auditorías
kaddo audit report --list

# Mostrar los hallazgos críticos de la última auditoría
kaddo audit report --severity critical

# Una auditoría concreta, solo hallazgos de dependencias, como JSON
kaddo audit report AUD-001 --category dependency --json
```

Las auditorías se leen de `.kaddo/audits/`, escritas por `kaddo audit run`. Un id inexistente da un error claro
y no escribe nada.
