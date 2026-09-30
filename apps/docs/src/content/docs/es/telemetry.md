---
title: Telemetría
description: Telemetría anónima de uso — qué es, cómo habilitarla, qué datos se envían y cuáles nunca se envían.
---

Kaddo puede enviar opcionalmente **metadata anónima de uso** a `telemetry.kaddo.org`.
La telemetría está **deshabilitada por defecto** y requiere consentimiento explícito.

## Modelo de consentimiento

Kaddo usa un modelo de consentimiento de tres estados:

| Estado | Significado |
|---|---|
| **unset** | No se ha tomado ninguna decisión — Kaddo puede preguntar una vez |
| **enabled** | El usuario aceptó — la telemetría opera |
| **disabled** | El usuario rechazó — sin telemetría, sin más prompts |

En el primer comando interactivo después de la inicialización, Kaddo pregunta una vez si
habilitar telemetría. La decisión se persiste y Kaddo no vuelve a preguntar.

En entornos no interactivos (CI, scripts, input redirigido) Kaddo nunca
hace prompts ni habilita telemetría por defecto.

### Interfaces MCP / LLM

Cuando Kaddo se usa vía MCP (la ruta principal de integración con LLMs), el consentimiento
se gestiona a través de herramientas MCP dedicadas en vez de prompts interactivos:

- **`kaddo_telemetry_status`** — retorna el estado actual de consentimiento, estado de
  registro y eventos pendientes. Incluye un aviso de consentimiento cuando la telemetría
  no ha sido configurada.
- **`kaddo_set_telemetry_consent`** — establece el consentimiento como `enabled`, `disabled`
  o `not-now` (diferir 24 horas). Requiere `confirm: true` para aplicar.
- **`kaddo_project_status`** — incluye un aviso de consentimiento cuando el estado es `unset`
  y no hay un diferimiento activo.

La opción "not-now" difiere el aviso por 24 horas sin habilitar ni deshabilitar la telemetría.
Después de expirar el diferimiento, el aviso reaparece en las respuestas de estado.

El consentimiento es compartido entre todas las interfaces: habilitar vía CLI es visible
desde MCP y viceversa.

## Qué datos se envían

Solo metadata operacional:

- Tipo de evento (ej. `command_executed`, `work_item_created`)
- Identificador anónimo de instalación (UUID, sin identidad personal)
- Versión de Kaddo
- Interfaz (`cli`, `mcp`, `admin`, `agent`)
- Nombre del comando y duración
- Timestamps
- Flags booleanos y enumeraciones seguras

## Qué datos nunca se envían

- Código fuente, contenido de archivos ni diffs
- Descripciones de Work Items, criterios de aceptación ni contenido de conocimiento
- Prompts, respuestas de LLM ni contenido de Knowledge Capsules
- URLs de repositorios, nombres de usuario, emails ni credenciales
- API keys, tokens, claves privadas ni variables de entorno

> **Principio:** observar cómo se usa Kaddo sin observar lo que los usuarios construyen.

## Cómo habilitar

```bash
kaddo telemetry enable
```

Esto persiste `consent: enabled` en `.kaddo/config.yml`.

## Cómo deshabilitar

```bash
kaddo telemetry disable
```

Cuando está deshabilitada, no se realizan requests de red ni se almacenan eventos en buffer.
Kaddo no vuelve a preguntar después de un disable explícito.

## Cómo verificar el estado

```bash
kaddo telemetry status
```

Muestra el estado de consentimiento (`unset`, `enabled` o `disabled`), si la instalación
está registrada y cuántos eventos están pendientes de entrega.

## Cómo funciona

1. **Consentimiento:** en el primer comando interactivo, Kaddo pregunta una vez. La elección
   se almacena como `consent: enabled` o `consent: disabled` con un `consentVersion`.
2. **Identidad:** al habilitar, Kaddo crea una identidad anónima de instalación
   (UUID + par de claves Ed25519) almacenada localmente en `.kaddo/telemetry/`.
3. **Registro:** la clave pública se registra una vez en `telemetry.kaddo.org`.
4. **Firma:** cada request se firma con Ed25519 para probar autenticidad y prevenir replay.
5. **Entrega:** los eventos se envían en lotes (hasta 25) después de cada comando. Las entregas
   fallidas se almacenan localmente (hasta 100 eventos) y se reintentan en el siguiente comando.
6. **Best-effort:** un fallo de telemetría nunca afecta al comando que lo generó. Kaddo
   funciona completamente offline.

## Rehabilitar después de deshabilitar

Deshabilitar la telemetría no elimina la identidad anónima. Si se rehabilita después, se
reutiliza el mismo ID de instalación por continuidad:

```bash
kaddo telemetry enable
```

## Entornos no interactivos

Kaddo detecta ejecución no interactiva verificando:

- Variable de entorno `CI`
- `stdin` / `stdout` no conectados a un TTY

En estos casos, un consentimiento `unset` se trata como `disabled` — sin prompt, sin
telemetría, sin interrupción.

## Inicialización

Al ejecutar `kaddo init` interactivamente, el prompt de consentimiento se ofrece
inmediatamente después de la configuración del proyecto. Esto asegura que la primera
oportunidad de optar ocurra en el punto más temprano.

## Proyectos existentes

Proyectos creados antes de la característica de consentimiento se migran automáticamente:

| Config anterior | Interpretado como |
|---|---|
| `telemetry.enabled: true` | `enabled` |
| `telemetry.enabled: false` (explícito) | `disabled` |
| Sin sección `telemetry` | `unset` (preguntar una vez) |

## Seguridad

- La clave privada nunca sale de tu máquina (`.kaddo/telemetry/identity.json`).
- Los requests usan firmas Ed25519 con protección anti-replay basada en nonces.
- El servicio de telemetría valida firmas y rechaza requests alterados o repetidos.
- `.kaddo/telemetry/` está en el gitignore (bajo `.kaddo/`).

## Configuración

```yaml
# .kaddo/config.yml
telemetry:
  consent: enabled    # o: disabled
  consentVersion: 1
```
