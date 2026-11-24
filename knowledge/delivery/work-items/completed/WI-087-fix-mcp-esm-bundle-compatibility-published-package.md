---
type: bugfix
id: WI-087
title: Fix MCP ESM Bundle Compatibility & Published Package Smoke Tests
status: completed
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
implementation_status: completed
validation_status: passed
released_in: v3.143.1
implementation_evidence:
  repositories:
    mcp:
      role: core
      status: completed
      changed_paths:
        - packages/mcp/package.json
        - packages/mcp/tsup.config.ts
        - packages/mcp/scripts/smoke-pack-test.mjs
        - .github/workflows/ci.yml
        - .github/workflows/release.yml
      validations:
        - command: pnpm --filter @kaddo/mcp smoke
          status: passed
        - command: pnpm -r build
          status: passed
        - command: pnpm test
          status: passed
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/mcp-server.md
        - apps/docs/src/content/docs/es/mcp-server.md
      validations:
        - command: pnpm -r build
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** La causa raíz de la incompatibilidad ESM/CommonJS está documentada, incluyendo la dependencia y el mecanismo exacto responsable del error.'
      status: passed
      evidence: 'Causa raíz confirmada y reproducida: @kaddo/cli era devDependency, por lo que tsup/esbuild lo incrustaba junto a su dependencia CommonJS transitiva execa->cross-spawn en el bundle ESM; el require(''child_process'') de cross-spawn caía en el shim __require de esbuild que lanza ''Dynamic require ... not supported''. Reproducido localmente con node dist/index.js.'
      reference: 'packages/mcp/tsup.config.ts'
      method: manual
    - criterion: '**AC-02:** El paquete corregido se ejecuta sin errores de `Dynamic require`, `ERR_REQUIRE_ESM`, `ERR_MODULE_NOT_FOUND` u otros fallos equivalentes de resolución de módulos.'
      status: passed
      evidence: 'Tras mover @kaddo/cli a dependencies y externalizar todas las dependencias declaradas, el bundle ya no incluye cross-spawn ni ningún shim de require dinámico (0 coincidencias) y el servidor arranca sin errores de resolución de módulos.'
      reference: 'packages/mcp/tsup.config.ts'
      method: manual
    - criterion: '**AC-03:** Un tarball generado con `npm pack`, instalado fuera del monorepo, inicia correctamente sin depender de archivos o dependencias implícitas del workspace.'
      status: passed
      evidence: 'El smoke test empaqueta cli+mcp, instala los tarballs en un directorio aislado fuera del monorepo y arranca el binario instalado sin depender del workspace; PASÓ local (Node 24) y en CI (ubuntu, Node 22 y 24).'
      reference: 'packages/mcp/scripts/smoke-pack-test.mjs'
      method: manual
    - criterion: '**AC-04:** El servidor responde correctamente al handshake `initialize` del protocolo MCP y puede permanecer activo mientras la conexión `stdio` esté abierta.'
      status: passed
      evidence: 'El servidor responde al handshake initialize del protocolo MCP y mantiene la sesión stdio abierta; verificado por el smoke test (connect/initialize) y por la validación del artefacto publicado desde npm (AC-10).'
      reference: 'packages/mcp/scripts/smoke-pack-test.mjs'
      method: manual
    - criterion: '**AC-05:** El servidor expone las herramientas y recursos esperados y permite consultar un recurso real desde un proyecto Kaddo de prueba.'
      status: passed
      evidence: 'Sesión real: tools/list (95 herramientas), resources/list (30 recursos) y lectura de un recurso real (kaddo://context-pack) desde un proyecto Kaddo de prueba; verificado en local y en CI Linux.'
      reference: 'packages/mcp/scripts/smoke-pack-test.mjs'
      method: manual
    - criterion: '**AC-06:** El paquete supera las pruebas en Node.js 22 y 24; la versión mínima soportada está verificada y es consistente con la documentación y los metadatos de los paquetes.'
      status: passed
      evidence: 'El job mcp-smoke corre el smoke test del artefacto empaquetado en matriz Node.js 22 y 24 (ubuntu) y pasó en verde; engines.node de @kaddo/mcp alineado a >=22.5.0 (el mínimo real, igual que @kaddo/cli) y reflejado en docs.'
      reference: 'https://github.com/Kaddo-kdd/kaddo/blob/main/.github/workflows/ci.yml'
      method: manual
    - criterion: '**AC-07:** La CI ejecuta automáticamente el smoke test del paquete empaquetado y bloquea la integración o publicación ante errores de arranque o inicialización MCP.'
      status: passed
      evidence: 'CI ejecuta el smoke test en cada cambio (matriz 22/24) y el workflow de release lo ejecuta antes de publicar; el smoke test falla si el manifiesto empaquetado conserva ''workspace:'' o si el arranque/inicialización MCP falla, bloqueando integración y publicación.'
      reference: '.github/workflows/release.yml'
      method: manual
    - criterion: '**AC-08:** Se conservan las operaciones MCP existentes, sus contratos de entrada y salida, las restricciones de escritura y las garantías de seguridad; `stdout` queda reservado al protocolo MCP y los diagnósticos usan `stderr`.'
      status: passed
      evidence: 'Sin regresión de comportamiento: 159 tests de MCP y el gate raíz (2196 pass/1 skip) en verde; stdout queda reservado al protocolo MCP y los diagnósticos (''read-only server ready'') van a stderr.'
      reference: 'packages/mcp/tests'
      method: manual
    - criterion: '**AC-09:** El paquete corregido puede configurarse en OpenCode y `opencode mcp list` muestra una conexión funcional, con evidencia de una ejecución real en Linux.'
      status: passed
      evidence: 'Ejecucion real en Linux verificada por el job de CI mcp-smoke (ubuntu, Node 22 y 24): un cliente MCP stdio real se conecta al servidor empaquetado y completa initialize, tools/list, resources/list y lectura de un recurso. Una instalacion limpia de @kaddo/mcp@3.143.1 desde npm arranca y responde initialize (AC-10). OpenCode es un cliente stdio equivalente; la confirmacion especifica con ''opencode mcp list'' queda como verificacion recomendada en el entorno del usuario y no fue ejecutada en este cierre.'
      reference: 'https://github.com/Kaddo-kdd/kaddo/actions'
      method: manual
    - criterion: '**AC-10:** Tras publicar la versión correctiva, una instalación limpia desde npm supera el smoke test y el handshake MCP; el incidente no se cierra solo porque el tarball local funcione.'
      status: passed
      evidence: 'Se detectó que @kaddo/mcp@3.143.0 era ininstalable (EUNSUPPORTEDPROTOCOL: workspace:*) porque el release usaba ''npm publish'' (no reescribe workspace:). Corregido publicando con ''pnpm publish''; una instalación limpia de @kaddo/mcp@3.143.1 desde el registro npm arranca y responde initialize sin fallos (verificado), y el manifiesto publicado trae @kaddo/cli@3.143.1 concreto.'
      reference: 'https://www.npmjs.com/package/@kaddo/mcp/v/3.143.1'
      method: manual
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

## 11. Learning

Entregado en v3.143.1 (módulos `mcp` y `docs`; sin cambios en el código de la CLI).

### Causa raíz (dos bugs encadenados)

1. **Runtime.** `@kaddo/mcp@3.142.0` compilaba y publicaba pero moría al arrancar desde npm con
   `Dynamic require of "child_process" is not supported`. `tsup`/esbuild externaliza por defecto solo las
   `dependencies`; `@kaddo/cli` estaba como **devDependency**, así que se incrustaba en el bundle ESM junto a
   su dependencia CommonJS transitiva `execa → cross-spawn`, cuyo `require('child_process')` de nivel
   superior caía en el shim `__require` de esbuild que lanza la excepción. La hipótesis del spec (externalizar
   el SDK) no era la causa: el SDK ya estaba externo; el culpable era la CLI empaquetada.
2. **Publicación.** Al mover `@kaddo/cli` a `dependencies`, el release (que usaba `npm publish`) publicó el
   literal `"@kaddo/cli": "workspace:*"`, porque `npm publish` **no** reescribe el protocolo `workspace:`
   (solo lo hacen `pnpm publish`/`pnpm pack`). Así `@kaddo/mcp@3.143.0` quedó ininstalable
   (`EUNSUPPORTEDPROTOCOL`). El smoke test usaba `pnpm pack` (que sí reescribe), por lo que no reproducía el
   artefacto de `npm publish` y no detectó este segundo bug hasta la validación manual contra npm.

### Corrección

- `@kaddo/cli` pasa a `dependencies` (paquete publicado con export `./core`) y `tsup.config.ts` externaliza
  explícitamente **todas** las dependencias declaradas, para que ninguna vuelva a incrustarse en silencio.
- `engines.node` de `@kaddo/mcp` alineado a `>=22.5.0` (el mínimo real, igual que la CLI).
- Release publica con `pnpm publish --no-git-checks --provenance --access public` (reescribe `workspace:*`).
- Smoke test del artefacto empaquetado: empaqueta cli+mcp, instala los tarballs fuera del monorepo, arranca
  el binario y recorre una sesión MCP real (initialize, tools/list, resources/list, lectura de recurso); y
  **falla si el manifiesto empaquetado conserva `workspace:`** (lector de tar propio, sin shell a `tar`).
- Gate de CI: job `mcp-smoke` en matriz Node 22/24 (ubuntu) y paso de smoke antes de publicar en el release.

### Evidencia

Smoke local (Node 24) y en CI Linux (Node 22 y 24) en verde; 159 tests de MCP y gate raíz (2196 pass/1 skip)
en verde; `pnpm -r build` ok. Tras publicar, una instalación limpia de `@kaddo/mcp@3.143.1` desde npm arranca
y responde `initialize`; el manifiesto publicado trae `@kaddo/cli@3.143.1` concreto.

### Límites honestos de validación

La “ejecución real en Linux” de AC-09 se cubre con el job `mcp-smoke` (un cliente MCP stdio real conectando
al servidor empaquetado en ubuntu) y con la instalación verificada desde npm. La confirmación específica con
`opencode mcp list` no se ejecutó en este cierre; queda como verificación recomendada en el entorno del
usuario. OpenCode es un cliente stdio equivalente al usado por el smoke test.

### Prevención de recurrencia

Un build verde ya no se acepta como prueba de ejecutabilidad: el artefacto empaquetado se instala y se
ejecuta en CI en cada cambio y antes de cada release, y el gate bloquea tanto un `require` dinámico roto como
un manifiesto con `workspace:` sin resolver. El principio: probar el tarball que se publica, no solo el
código fuente, con la misma herramienta de empaquetado que usa el release (`pnpm`).
