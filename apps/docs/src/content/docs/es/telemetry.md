---
title: Telemetría
description: Telemetría anónima de uso — qué es, cómo habilitarla, qué datos se envían y cuáles nunca se envían.
---

Kaddo puede enviar opcionalmente **metadata anónima de uso** a `telemetry.kaddo.org`.
La telemetría está **deshabilitada por defecto** y debe habilitarse explícitamente.

## Qué es la telemetría

La telemetría ayuda al equipo de Kaddo a entender cómo se usa el toolkit — qué comandos se
ejecutan más, cuánto tardan y qué etapas del ciclo de vida se adoptan. Estos datos informan
dónde invertir esfuerzo de desarrollo.

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

Esto establece `telemetry.enabled: true` en `.kaddo/config.yml`.

## Cómo deshabilitar

```bash
kaddo telemetry disable
```

Cuando está deshabilitada, no se realizan requests de red ni se almacenan eventos en buffer.

## Cómo verificar el estado

```bash
kaddo telemetry status
```

Muestra si la telemetría está habilitada, si la instalación está registrada y cuántos
eventos están pendientes de entrega.

## Cómo funciona

1. **Identidad:** al habilitar, Kaddo crea una identidad anónima de instalación
   (UUID + par de claves Ed25519) almacenada localmente en `.kaddo/telemetry/`.
2. **Registro:** la clave pública se registra una vez en `telemetry.kaddo.org`.
3. **Firma:** cada request se firma con Ed25519 para probar autenticidad y prevenir replay.
4. **Entrega:** los eventos se envían en lotes (hasta 25) después de cada comando. Las entregas
   fallidas se almacenan localmente (hasta 100 eventos) y se reintentan en el siguiente comando.
5. **Best-effort:** un fallo de telemetría nunca afecta al comando que lo generó. Kaddo
   funciona completamente offline.

## Seguridad

- La clave privada nunca sale de tu máquina (`.kaddo/telemetry/identity.json`).
- Los requests usan firmas Ed25519 con protección anti-replay basada en nonces.
- El servicio de telemetría valida firmas y rechaza requests alterados o repetidos.
- `.kaddo/telemetry/` está en el gitignore (bajo `.kaddo/`).

## Configuración

```yaml
# .kaddo/config.yml
telemetry:
  enabled: false  # por defecto
```
