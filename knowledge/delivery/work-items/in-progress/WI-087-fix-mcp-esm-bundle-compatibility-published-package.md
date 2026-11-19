---
type: bugfix
id: WI-087
title: Fix MCP ESM Bundle Compatibility & Published Package Smoke Tests
status: in-progress
work_type: bugfix
knowledge_level: K3
created_at: '2026-11-19'
domains:
  - Tech
  - Delivery
scope_confidence:
  level: medium
  reasons:
    - >-
      El artefacto publicado @kaddo/mcp@3.142.0 falla en runtime con 'Dynamic
      require of child_process'; el fallo se reproduce de forma aislada.
    - >-
      La hipótesis de externalización debe quedar respaldada por un smoke test
      del tarball antes de considerarse definitiva.
    - >-
      El soporte de Node.js declarado (mcp >=18) no coincide con el verificado
      ni con el de CLI (>=22.5.0) y debe alinearse con evidencia.
    - >-
      Una compilación satisfactoria no prueba que el paquete publicado sea
      ejecutable; se requiere una prueba sobre el artefacto empaquetado.
surfaces:
  product-ui: not-applicable
  frontend: not-applicable
  backend: affected
  database: not-applicable
  configuration: affected
  feature-flags: not-applicable
  content-copy: not-applicable
  auth: not-applicable
  notifications: not-applicable
  analytics: not-applicable
  documentation: affected
  operations-release: affected
source:
  type: external
  imported_at: '2026-11-19'
  source_format: kaddo-frontmatter
  source_hash: ab98e2188b483cbc13f5bda60a5515469b1402aaf117611796d41e74a680b280
  inferred: false
generated_by: kaddo-admin
affected_modules:
  - mcp
  - docs
summary: >-
  @kaddo/mcp@3.142.0 compila y publica pero falla en runtime al instalarse desde
  npm ('Dynamic require of "child_process"'), impidiendo abrir una sesión MCP.
  Corregir el empaquetado ESM para que el paquete se instale y ejecute en los
  Node.js soportados, añadir un smoke test sobre el tarball empaquetado y un
  gate de CI que bloquee regresiones de ejecutabilidad antes de publicar.
telemetry_work_item_id: 4dee8034-168c-4729-8f6c-b2d2ef2c49ec
original_snapshot:
  title: Fix MCP ESM Bundle Compatibility & Published Package Smoke Tests
  description: >-
    Un usuario externo integra Kaddo MCP con OpenCode en Linux (Node.js
    v24.21.0) sobre un proyecto React/Vite/Supabase inicializado con Kaddo. Al
    ejecutar `npx -y @kaddo/mcp@3.142.0` el proceso termina con:
  type: bugfix
  status: draft
ready_at: '2026-11-19'
---

# WI-087 — Fix MCP ESM Bundle Compatibility & Published Package Smoke Tests

## 1. Contexto y problema

Un usuario externo integra Kaddo MCP con OpenCode en Linux (Node.js v24.21.0) sobre un proyecto
React/Vite/Supabase inicializado con Kaddo. Al ejecutar `npx -y @kaddo/mcp@3.142.0` el proceso termina con:

```
Error: Dynamic require of "child_process" is not supported
  at @kaddo/mcp/dist/chunk-34DEKKIC.js
  at cross-spawn@7.0.6/index.js
  at @kaddo/mcp/dist/index.js
```

OpenCode muestra `kaddo failed` / `MCP error -32000: Connection closed`. El error se reproduce directamente
desde la terminal, independientemente de OpenCode.

**Problema:** Kaddo MCP puede superar build y publish pero fallar en runtime al instalarse desde npm,
impidiendo establecer una sesión MCP. Una compilación satisfactoria no prueba que el paquete sea ejecutable.

## 2. Objetivo

Garantizar que `@kaddo/mcp` se instale y ejecute desde npm, inicialice una sesión MCP y exponga sus
herramientas y recursos en los Node.js soportados. Incorporar pruebas automatizadas sobre el artefacto
empaquetado para prevenir regresiones equivalentes.

## 3. Alcance

### 3.1 Reproducción y diagnóstico
Reproducir el fallo con `@kaddo/mcp@3.142.0` en un entorno aislado; identificar la cadena de dependencias
que incorpora el módulo CommonJS problemático; revisar el bundle de `tsup` y la interoperabilidad CJS/ESM;
documentar la causa raíz con evidencia reproducible.

### 3.2 Corrección del empaquetado
Corregir `packages/mcp/tsup.config.ts` y/o `packages/mcp/package.json` para que las dependencias con
`require` dinámico no se incrusten en el bundle ESM y Node las resuelva de forma nativa. La solución debe
eliminar el error de `require("child_process")`, mantener ESM y el contrato `stdio`, conservar las
dependencias necesarias fuera del monorepo, y evitar polyfills globales, cambios de caché de npm o de
Node.js como sustituto de la corrección. La externalización es hipótesis y debe respaldarse con pruebas.

### 3.3 Smoke test del paquete empaquetado
Build del MCP → `npm pack` → directorio temporal aislado fuera del monorepo → instalar el tarball con sus
dependencias → ejecutar el binario `kaddo-mcp` → sesión real `stdio` con `initialize`, `tools/list`,
`resources/list` y lectura de al menos un recurso real de un proyecto Kaddo de prueba → cierre limpio y
borrado del entorno. Debe fallar ante errores de importación, dependencias faltantes o cierres inesperados.

### 3.4 Compatibilidad Node.js
Validar en Node.js 22 LTS y Node.js 24. Revisar `engines.node` de MCP (>=18) frente al de CLI (>=22.5.0);
la versión mínima declarada debe corresponder a versiones verificadas y reflejarse en metadatos y docs.

### 3.5 Protección de CI/CD y release
Añadir en `.github/workflows/ci.yml` y `.github/workflows/release.yml` un gate que ejecute el smoke test del
paquete empaquetado antes de publicar; conservar build, tests y sincronización de versiones CLI/MCP. Un build
verde no es evidencia suficiente de ejecutabilidad.

### 3.6 Documentación y troubleshooting
Actualizar docs de MCP: versiones de Node.js soportadas, verificación con `npx`, configuración de OpenCode
por `stdio`, diagnóstico de errores de init/cierre, diferencia entre ejecutar y registrar el MCP, y
referencia a la versión corregida.

## 4. Acceptance Criteria

- [ ] **AC-01:** La causa raíz de la incompatibilidad ESM/CommonJS está documentada, incluyendo la dependencia y el mecanismo exacto responsable del error.
- [ ] **AC-02:** El paquete corregido se ejecuta sin errores de `Dynamic require`, `ERR_REQUIRE_ESM`, `ERR_MODULE_NOT_FOUND` u otros fallos equivalentes de resolución de módulos.
- [ ] **AC-03:** Un tarball generado con `npm pack`, instalado fuera del monorepo, inicia correctamente sin depender de archivos o dependencias implícitas del workspace.
- [ ] **AC-04:** El servidor responde correctamente al handshake `initialize` del protocolo MCP y puede permanecer activo mientras la conexión `stdio` esté abierta.
- [ ] **AC-05:** El servidor expone las herramientas y recursos esperados y permite consultar un recurso real desde un proyecto Kaddo de prueba.
- [ ] **AC-06:** El paquete supera las pruebas en Node.js 22 y 24; la versión mínima soportada está verificada y es consistente con la documentación y los metadatos de los paquetes.
- [ ] **AC-07:** La CI ejecuta automáticamente el smoke test del paquete empaquetado y bloquea la integración o publicación ante errores de arranque o inicialización MCP.
- [ ] **AC-08:** Se conservan las operaciones MCP existentes, sus contratos de entrada y salida, las restricciones de escritura y las garantías de seguridad; `stdout` queda reservado al protocolo MCP y los diagnósticos usan `stderr`.
- [ ] **AC-09:** El paquete corregido puede configurarse en OpenCode y `opencode mcp list` muestra una conexión funcional, con evidencia de una ejecución real en Linux.
- [ ] **AC-10:** Tras publicar la versión correctiva, una instalación limpia desde npm supera el smoke test y el handshake MCP; el incidente no se cierra solo porque el tarball local funcione.

## 5. Plan de validación

Automatizado: tests unitarios/integración de MCP; build de los paquetes afectados; smoke test del tarball
aislado; matriz Node.js 22/24; handshake MCP real; `tools/list`, `resources/list` y lectura de recursos;
terminación controlada; suite de regresión en CI.

Manual (entorno Linux limpio, tras publicar): `npx -y @kaddo/mcp@<corrected-version>` inicia y permanece
operativo; en un proyecto con OpenCode, `opencode mcp list` muestra Kaddo conectado. Registrar versión de
Node.js, del paquete, SO y resultado, sin rutas personales ni credenciales.

## 6. Fuera de alcance

Nuevas herramientas o recursos MCP; cambios al modelo KDD; cambios de comportamiento de la CLI; rediseño de
la integración con OpenCode; interfaz HTTP para el MCP; modificar proyectos de usuarios; mecanismos de
compatibilidad global que oculten errores de empaquetado.

## 7. Definition of Done

Causa raíz confirmada y corregida; smoke test del paquete empaquetado en verde; integración MCP en los
Node.js soportados; gate de CI que bloquea regresiones equivalentes; documentación actualizada; versión
correctiva publicada y verificada desde npm; evidencia de conexión real con OpenCode; criterios con evidencia
y referencias verificables; sin deriva inesperada en artefactos de conocimiento.

## 8. Ownership sugerido

`packages/mcp/**`, `packages/cli/**` (solo revisión de dependencias/compatibilidad; modificar si el
diagnóstico lo requiere), `.github/workflows/ci.yml`, `.github/workflows/release.yml`,
`apps/docs/src/content/docs/**`.

## 9. Dependencias y riesgos

Dependencias: acceso al pipeline de publicación npm; entornos Node.js 22/24. Riesgos: externalizar una
dependencia puede descubrir referencias que dependían del bundle; las pruebas del monorepo pueden aprobar
aunque el paquete publicado esté incompleto; la compatibilidad Node.js declarada puede no corresponder al
soporte efectivo; una validación solo local no garantiza el artefacto publicado.

## 10. Resultado esperado

Un usuario nuevo instala `@kaddo/mcp` con `npx`, lo configura en OpenCode y consulta el conocimiento de su
repositorio sin modificar su entorno. El release detecta automáticamente errores de empaquetado antes de
distribuir nuevas versiones.

## 11. Learning (completar en Gate C)

Registrar en español: causa raíz confirmada (cadena de dependencias y mecanismo), corrección aplicada,
evidencia del smoke test y de la matriz Node.js, alineación de `engines`, gate de CI, límites honestos de
validación (OpenCode/Linux real vs smoke test automatizado) y prevención de recurrencia.
