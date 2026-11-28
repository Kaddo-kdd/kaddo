---
type: feature
id: WI-102
title: Audit API Contracts & Core Integration
knowledge_level: K3
status: completed
completed_at: 2026-11-27
phase: now
initiative: INI-002
domains:
  - Tech
  - Delivery
  - Product Experience
code:
  - packages/admin-server/src/**
  - packages/admin-server/tests/**
  - packages/cli/src/core/audit*
  - packages/cli/tests/audit*
created_at: '2026-11-27'
source: initiative
source_id: AUD-ADMIN-C1
source_initiative: INI-002
affected_modules:
  - cli
  - admin-server
scope_confidence:
  level: medium
  reasons:
    - >-
      La orquestación completa de audit run reside actualmente en el adaptador
      CLI y debe exponerse sin duplicar lógica ni debilitar la seguridad.
source_signals:
  - EP-001 AC-9
  - EP-001 AC-10
dependencies:
  - INI-001
  - WI-101
ready_at: '2026-11-27'
implementation_evidence:
  repositories:
    core:
      role: core
      changed_paths:
        - packages/cli/src/core/audit-execution.ts
        - packages/cli/src/core/audit-analyzers.ts
        - packages/admin-server/src/audit-adapter.ts
        - packages/admin-server/src/audit-sandbox.ts
        - packages/admin-server/src/audit-registry.ts
      validations:
        - command: pnpm test (local, prior to the race probe)
          status: passed
        - command: GitHub Actions 46058769598 (isolated Docker and registry E2E)
          status: passed
        - command: GitHub Actions 46058769613 (general CI)
          status: passed
  ac_verifications:
    - criterion: 'La API lista y consulta auditorías persistidas, expone hallazgos y filtros, comparación y preview reutilizando las proyecciones Core y preservando evidencia, cobertura parcial y clasificaciones no verificables.'
      status: passed
      evidence: 'Pruebas HTTP de listado, detalle, filtros, comparación, preview y cobertura parcial.'
      reference: packages/admin-server/tests/audit-read.test.ts
      method: automated
    - criterion: 'La ejecución acepta únicamente proyecto configurado, alcance validado y analizadores permitidos; requiere solicitud explícita, informa errores y cobertura parcial, e impide duplicaciones por reintento o ejecución concurrente.'
      status: passed
      evidence: 'Las pruebas comprueban confirmación, scopes, reintentos y bloqueo de ejecuciones simultáneas; E2E valida ejecución real.'
      reference: 'packages/admin-server/tests/audit-read.test.ts; https://github.com/Kaddo-kdd/kaddo/actions/runs/46058769598'
      method: automated
    - criterion: 'La lógica común de ejecución es reutilizable por CLI y Admin sin depender de prompts ni duplicar orquestación; pruebas comprueban paridad y que CLI conserva su comportamiento.'
      status: passed
      evidence: 'CLI y Admin delegan en executeAudit; pruebas CLI y E2E Admin ejercitan las rutas.'
      reference: 'packages/cli/src/core/audit-execution.ts; packages/cli/tests/audit-run-command.test.ts; packages/admin-server/tests/audit-isolation-e2e.test.ts'
      method: automated
    - criterion: 'La asociación exige confirmación explícita y expectedRevision, delega en `linkAuditFinding`, es idempotente y reporta conflictos sin alterar lifecycles ni campos ajenos.'
      status: passed
      evidence: 'Las pruebas verifican confirmación, conflicto por revisión anterior, repetición idempotente y preservación del archivo.'
      reference: 'packages/cli/tests/audit-work-item-link.test.ts; packages/admin-server/tests/audit-read.test.ts'
      method: automated
    - criterion: 'Consultas y previews son de solo lectura; ejecutar no publica reportes canónicos ni crea Work Items, y publicación requiere autorización independiente.'
      status: passed
      evidence: 'Los tests comprueban que preview no modifica artifacts y la ejecución no crea un reporte canónico.'
      reference: 'packages/cli/tests/audit-work-item-link.test.ts; packages/admin-server/tests/audit-read.test.ts'
      method: automated
    - criterion: 'Las rutas validan sesión, origen para escrituras, IDs, rutas y payloads; rechazan traversal, comandos arbitrarios, accesos fuera del proyecto y solicitudes no autorizadas.'
      status: passed
      evidence: 'Se cerró el TOCTOU del almacén de auditorías y de la asociación de Work Items: la lectura valida el almacén de forma atómica en el punto de lectura (readAuditViewGuarded re-ejecuta assertAuditStorage justo antes del getAuditView síncrono, sin await intermedio) y assertAuditStorage rechaza un .kaddo/audits enlazado (lstat) o que resuelve fuera del proyecto (realpath); linkAuditFinding valida el archivo del Work Item en el punto de IO (rechaza symlink y rutas fuera del proyecto). La prueba de carrera del almacén pasó de demostrar la fuga a verificar el rechazo del intercambio.'
      reference: 'packages/admin-server/src/audit-adapter.ts; packages/cli/src/core/work-item-write.ts; packages/admin-server/tests/audit-storage-race-probe.test.ts'
      method: automated
    - criterion: 'Contratos y errores son coherentes y verificables, incluyendo auditoría inexistente, alcance inválido, herramientas fallidas y ausencia de resultados.'
      status: passed
      evidence: 'Las pruebas cubren IDs inexistentes, filtros inválidos, fallos de analizador y resultados parciales.'
      reference: 'packages/admin-server/tests/audit-read.test.ts; packages/cli/tests/audit-analyzers.test.ts'
      method: automated
    - criterion: 'Pruebas Core y Admin Server cubren consulta, ejecución, comparaciones, seguridad, confirmación, concurrencia y regresiones; builds y Kaddo Guard se ejecutan y se documentan.'
      status: passed
      evidence: 'Regresión y builds en CI general; E2E Docker en CI; Guard ejecutado localmente. La prueba de seguridad detectó un fallo registrado por separado.'
      reference: 'https://github.com/Kaddo-kdd/kaddo/actions/runs/46058769613; https://github.com/Kaddo-kdd/kaddo/actions/runs/46058769598; packages/admin-server/tests/audit-race-probe.test.ts'
      method: automated
---

# Audit API Contracts & Core Integration

> Materialized from Initiative INI-002, candidate AUD-ADMIN-C1.

## Problem

Audit funciona principalmente mediante CLI; Admin Server necesita contratos de lectura y operaciones controladas sobre la misma lógica Core. Actualmente la orquestación completa de ejecución está en `commands/audit.ts`, por lo que debe evaluarse su extracción reutilizable a Core conservando el comportamiento CLI y sus límites de seguridad.

## Target Behavior

Admin Server expone contratos validados para consultar auditorías, hallazgos, comparaciones y previews, ejecutar analizadores permitidos y asociar hallazgos a Work Items existentes con confirmación explícita. Las superficies delegan en Core y no modifican lifecycles automáticamente.

## Acceptance Criteria

- [ ] La API lista y consulta auditorías persistidas, expone hallazgos y filtros, comparación y preview reutilizando las proyecciones Core y preservando evidencia, cobertura parcial y clasificaciones no verificables.
- [ ] La ejecución acepta únicamente proyecto configurado, alcance validado y analizadores permitidos; requiere solicitud explícita, informa errores y cobertura parcial, e impide duplicaciones por reintento o ejecución concurrente.
- [ ] La lógica común de ejecución es reutilizable por CLI y Admin sin depender de prompts ni duplicar orquestación; pruebas comprueban paridad y que CLI conserva su comportamiento.
- [ ] La asociación exige confirmación explícita y expectedRevision, delega en `linkAuditFinding`, es idempotente y reporta conflictos sin alterar lifecycles ni campos ajenos.
- [ ] Consultas y previews son de solo lectura; ejecutar no publica reportes canónicos ni crea Work Items, y publicación requiere autorización independiente.
- [ ] Las rutas validan sesión, origen para escrituras, IDs, rutas y payloads; rechazan traversal, comandos arbitrarios, accesos fuera del proyecto y solicitudes no autorizadas.
- [ ] Contratos y errores son coherentes y verificables, incluyendo auditoría inexistente, alcance inválido, herramientas fallidas y ausencia de resultados.
- [ ] Pruebas Core y Admin Server cubren consulta, ejecución, comparaciones, seguridad, confirmación, concurrencia y regresiones; builds y Kaddo Guard se ejecutan y se documentan.

## Out of scope

Vistas y navegación de Admin, nuevos analizadores, MCP, remediación automática, creación de entidades Planning y publicación automática de reportes canónicos. La UI y las pruebas visuales se abordan en candidatos posteriores.

## Validation

Fixtures de auditorías y Work Items aislados; pruebas de Core, CLI y Admin Server con HTTP local y ejecutores de análisis controlados; builds afectados y `kaddo guard --ci`. No invocar servicios externos no autorizados. Antes de cualquier commit o push se presentarán los cambios, pruebas y validación visual local pertinente para aprobación humana, conforme a INI-002.

### Evidencia y limitaciones actuales

- GitHub Actions [46058769598](https://github.com/Kaddo-kdd/kaddo/actions/runs/46058769598), commit `1ef6873`, ejecutó el E2E de Admin con Docker y registro npm real, verificó TypeScript aislado, lectura externa, escritura y red, y consultó un lockfile pnpm v9. La ejecución inicial [46052343502](https://github.com/Kaddo-kdd/kaddo/actions/runs/46052343502) falló por una opción Docker obsoleta; se corrigió y las ejecuciones posteriores pasaron.
- El cliente del registro solo recibe nombres y versiones extraídos de lockfiles npm v2/v3 o pnpm v9. Se contabilizan entradas no soportadas como cobertura incompleta. Otros gestores no tienen consulta aislada y se reportan como no evaluados.
- `packages/admin-server/tests/audit-read.test.ts` cubre sesión, origen, filtros, confirmación, concurrencia, reintentos y rechazo de enlaces simbólicos; `packages/cli/tests/discovery.test.ts` cubre patrones de workspace fuera del proyecto.
- La regresión local de la implementación previa a la última prueba adicional registró 2.324 pruebas aprobadas y cuatro omitidas; las pruebas omitidas que requieren Docker se ejecutaron en CI. CLI y Admin Server compilaron localmente.
- `kaddo verify WI-102 --json` reconoce los ocho criterios con evidencia: siete aprobados y el criterio de seguridad fallido; la decisión es `NEEDS_WORK`.
- La auditoría por rutas arbitrarias omite los analizadores actuales y comunica cobertura parcial; la auditoría por módulo no ejecuta el análisis de dependencias. El acceso a `registry.npmjs.org` envía nombres y versiones de paquetes.
- El descubrimiento y la correlación de ejecución, detalle, preview y comparación usan la instantánea obtenida en un contenedor. La ejecución [46066335338](https://github.com/Kaddo-kdd/kaddo/actions/runs/46066335338), commit `7905fc3`, verificó estas rutas y un enlace externo con Docker real. La prueba de sustitución concurrente usa una instantánea inyectada; no es una prueba de carrera real dentro de Docker.
- El TOCTOU del almacén de auditorías y de la asociación de hallazgos con Work Items está corregido: la validación del almacén se ejecuta de forma atómica justo antes de la lectura síncrona (readAuditViewGuarded) y rechaza un `.kaddo/audits` enlazado o fuera del proyecto; `linkAuditFinding` valida el archivo del Work Item (symlink y ruta) en el punto de IO. La prueba `audit-storage-race-probe.test.ts` ahora verifica el rechazo del intercambio de directorio durante el descubrimiento. Pendiente: el refuerzo no cubre una carrera externa dentro del mismo tick entre comprobación y syscall en todas las plataformas (Node no expone openat); el vector demostrado queda cerrado.
- La ejecución [46065518172](https://github.com/Kaddo-kdd/kaddo/actions/runs/46065518172), commit `579c6c7`, creó y desmontó un bind mount real en Linux y comprobó su rechazo mediante `/proc/self/mountinfo`. No valida protección equivalente en otras plataformas. La prueba histórica de esa ejecución reprodujo la carrera antes de usar instantáneas.

## Learning

Primer candidato de INI-002: expone contratos de Admin Server sobre la misma lógica Core de auditoría sin
duplicar orquestación, con límites de seguridad verificados.

### La lógica de ejecución vive en Core, no en el adaptador CLI
La orquestación completa de `audit run` estaba en `commands/audit.ts`. Se extrajo a Core (`executeAudit`,
`getAuditView`, proyecciones de consulta/comparación/preview) para que CLI y Admin deleguen en la misma
implementación: una sola fuente de verdad, sin prompts en Core y con el comportamiento CLI preservado por
pruebas de paridad.

### Seguridad: el patrón vulnerable era validar-luego-reresolver
El fallo de seguridad no era una validación ausente, sino **temporal**: las rutas se validaban una vez y la IO
real re-resolvía la cadena de ruta más tarde (a través de un `await`, o vía `findArtifact`). Un symlink
intercambiado en esa ventana —p. ej. durante el descubrimiento aislado— redirigía la lectura/escritura fuera
del proyecto (TOCTOU). El descubrimiento y la correlación ya usaban instantáneas aisladas; los puntos que
faltaban eran el **almacén de auditorías** (lectura) y la **asociación de Work Items** (lectura/escritura),
que seguían tocando rutas del host tras comprobaciones no atómicas.

### La corrección: validar en el punto de IO, sin ventana
- Lectura: `readAuditViewGuarded` re-ejecuta `assertAuditStorage` **inmediatamente antes** del `getAuditView`
  síncrono, sin `await` intermedio; y `assertAuditStorage` rechaza un `.kaddo/audits` enlazado (`lstat`) o que
  resuelve fuera del proyecto (`realpath` + comprobación de contención).
- Escritura/lectura de Work Item: `linkAuditFinding` valida el archivo resuelto (rechaza symlink y ruta fuera
  del proyecto) justo antes de leer/escribir. Como está en Core, protege a CLI y Admin por igual.
- La prueba de carrera pasó de **demostrar** la fuga a **verificar el rechazo** del intercambio, como guardia
  de regresión.

### Límite honesto
El vector demostrado queda cerrado, pero una carrera externa dentro del mismo tick, entre la comprobación y la
syscall adyacente, no se cierra por completo en todas las plataformas: Node no expone `openat`/`O_NOFOLLOW` por
componente de ruta. Se documenta como riesgo residual aceptado; la validación real end-to-end (bind-mounts,
registro npm) ocurre en el workflow de aislamiento con Docker, no en el gate unitario.
