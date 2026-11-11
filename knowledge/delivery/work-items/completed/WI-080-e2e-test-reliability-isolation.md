---
type: bugfix
id: WI-080
title: E2E Test Reliability & Isolation
status: completed
work_type: bugfix
created_at: '2026-11-11'
source:
  type: external
  imported_at: '2026-11-11'
  source_format: kaddo-frontmatter
  source_hash: 808bf8811901b6049f956df17ee2ee2cedd8496991466abb2c58249e3e4ee13c
  inferred: false
generated_by: kaddo-admin
knowledge_level: K3
domains:
  - Tech
  - Delivery
affected_modules:
  - admin
antecedent:
  - WI-002
  - WI-076
  - WI-079
scope_confidence:
  level: high
  reasons:
    - >-
      Causa raíz demostrada y reproducible (2/2): el selector del test busca
      "Browse work items" pero VS-103 renombró el botón a "Browse".
    - >-
      El defecto está en el test/harness, no en el producto; el flujo de
      importación externa funciona y el test 1 de la misma spec aprueba.
    - >-
      Corrección acotada al archivo de E2E afectado
      (packages/admin/e2e/integrations.spec.ts); sin cambios de producto.
    - >-
      Validación de estabilidad definida (10 aisladas + 3 suites, sin retries)
      sobre servidor/proyecto temporal fresco por ejecución.
summary: >-
  Diagnosticar y corregir la inestabilidad del escenario E2E de importación de
  Work Items externos en Kaddo Admin. Causa raíz: selector obsoleto ("Browse
  work items" -> "Browse", VS-103). Corrección en el test, preservando la
  semántica del flujo y el aislamiento de fixtures, con estabilidad demostrada
  sin retries ni timeouts arbitrarios.
original_snapshot:
  title: E2E Test Reliability & Isolation
  description: 'Kaddo Admin incluye un flujo de integración externa:'
  type: bug
  status: draft
ready_at: '2026-11-11'
implementation_status: completed
validation_status: passed
release_decision:
  published: false
  reason: >-
    Cambio exclusivamente de test E2E (packages/admin/e2e/integrations.spec.ts),
    sin producto distribuido. Gate B omite bump/tag/publicación npm por §13 del
    WI; no se inventa released_in. Entregado en main sobre v3.136.0.
  decided_by: human
  decided_at: '2026-11-11'
implementation_evidence:
  repositories:
    admin:
      role: core
      status: completed
      changed_paths:
        - packages/admin/e2e/integrations.spec.ts
      validations:
        - command: >-
            CI=1 npx playwright test integrations.spec.ts (x10, servidor fresco,
            retries:0)
          status: passed
        - command: 'CI=1 npx playwright test (suite completa x3, retries:0)'
          status: passed
        - command: pnpm vitest run packages/admin/tests
          status: passed
        - command: pnpm --filter @kaddo/admin exec tsc -b
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** El fallo histórico de `integrations.spec.ts:17` está documentado con referencias a WI-076/WI-079 y al escenario exacto.'
      status: passed
      evidence: >-
        §1-§2 del WI documentan el timeout histórico citando WI-076 y WI-079 y el
        caso exacto (browse -> preview -> import -> duplicate).
      reference: knowledge/delivery/work-items/completed/WI-080-e2e-test-reliability-isolation.md
      method: manual
    - criterion: '**AC-02:** Se identifica una causa raíz sustentada por trazas, logs, reproducción controlada o evidencia técnica equivalente; no se presenta una hipótesis como hecho.'
      status: passed
      evidence: >-
        Reproducción 2/2 con timeout idéntico en el locator /Browse work items/;
        git -S confirma que VS-103 (34d37ff) renombró el botón a "Browse".
      reference: packages/admin/e2e/integrations.spec.ts
      method: automated
    - criterion: '**AC-03:** Se distingue si el defecto está en el test/harness o en el comportamiento funcional de Admin, server o adapter, y se justifica la capa de corrección.'
      status: passed
      evidence: >-
        Defecto en el test/harness: el producto renderiza el botón "Browse" y el
        test 1 de la misma spec aprueba; la corrección va en el selector del test.
      reference: packages/admin/src/routes/Integrations.tsx
      method: manual
    - criterion: '**AC-04:** La corrección resuelve la causa diagnosticada con un diff acotado y sin refactorización ajena al problema.'
      status: passed
      evidence: >-
        Diff de 2 selectores (líneas 21 y 39) al nombre real del botón con
        exact:true; sin otros cambios ni refactor.
      reference: packages/admin/e2e/integrations.spec.ts
      method: manual
    - criterion: '**AC-05:** El escenario puede abrir Integrations, consultar Work Items externos y mostrar el resultado esperado mediante esperas basadas en condiciones observables.'
      status: passed
      evidence: >-
        Tras el fix, browse carga los items y expect() espera el texto observable
        "Open public registration to everyone"; test en verde.
      reference: packages/admin/e2e/integrations.spec.ts
      method: automated
    - criterion: '**AC-06:** El preview sigue siendo no mutante y la confirmación crea exactamente un Work Item en `draft`.'
      status: passed
      evidence: >-
        El test verifica "No project files have been modified yet" antes de
        confirmar y luego aterriza en /work-items/WI- con estado draft.
      reference: packages/admin/e2e/integrations.spec.ts
      method: automated
    - criterion: '**AC-07:** Un segundo intento de importar el mismo Work Item externo detecta la asociación previa y no crea duplicados.'
      status: passed
      evidence: >-
        El segundo browse+import verifica el texto "Already imported as"; no se
        crea un segundo Work Item.
      reference: packages/admin/e2e/integrations.spec.ts
      method: automated
    - criterion: '**AC-08:** Los artifacts canónicos y la provenance del Work Item importado mantienen sus contratos existentes; los tests no alteran proyectos reales.'
      status: passed
      evidence: >-
        server.mjs ensambla un proyecto temporal desechable por ejecución; el
        repositorio real no se modifica (contratos de import intactos).
      reference: packages/admin/e2e/server.mjs
      method: manual
    - criterion: '**AC-09:** No se añaden retries, skips, esperas fijas injustificadas, aumentos arbitrarios de timeout ni aserciones debilitadas para ocultar el defecto.'
      status: passed
      evidence: >-
        El diff no introduce waitForTimeout, retries ni skips; playwright.config
        mantiene retries por defecto (0) y timeouts sin cambios.
      reference: packages/admin/playwright.config.ts
      method: manual
    - criterion: '**AC-10:** El escenario afectado aprueba **10 ejecuciones consecutivas** de manera aislada con `retries: 0`.'
      status: passed
      evidence: >-
        10/10 corridas aisladas de integrations.spec, cada una sobre servidor y
        proyecto temporal fresco (CI=1), sin retries.
      reference: packages/admin/e2e/integrations.spec.ts
      method: automated
    - criterion: '**AC-11:** La suite E2E completa aprueba **3 ejecuciones consecutivas** con `retries: 0`.'
      status: passed
      evidence: '3/3 suites E2E completas en verde (51 passed cada una), sin retries.'
      reference: packages/admin/e2e/integrations.spec.ts
      method: automated
    - criterion: '**AC-12:** El bootstrap y los fixtures dejan cada ejecución en estado conocido; no hay contaminación verificable entre casos o ejecuciones ni restos temporales sin limpiar.'
      status: passed
      evidence: >-
        server.mjs crea mkdtemp por arranque y lo elimina en shutdown; las 10
        aisladas (import mutante) pasan todas por partir de estado limpio.
      reference: packages/admin/e2e/server.mjs
      method: manual
    - criterion: '**AC-13:** Los fallos futuros exponen suficiente información diagnóstica útil, sin filtrar secretos ni introducir una infraestructura de observabilidad innecesaria.'
      status: passed
      evidence: >-
        playwright.config conserva trace on-first-retry y screenshots/errores por
        defecto; no se registran secretos ni se añade observabilidad extra.
      reference: packages/admin/playwright.config.ts
      method: manual
    - criterion: '**AC-14:** Tests unitarios/integración relevantes y builds/typechecks de los módulos modificados aprueban sin regresiones.'
      status: passed
      evidence: >-
        admin unit 69/69 en verde; tsc -b de admin exit 0; suite E2E completa sin
        regresiones (51 passed).
      reference: packages/admin/tests
      method: automated
    - criterion: '**AC-15:** La CI del commit de integración aprueba, y los resultados locales y de CI quedan enlazados como evidencia verificable.'
      status: passed
      evidence: >-
        CI run 43071845815 (push e1b50c9) success en 1m12s; resultados locales en
        el log de estabilidad enlazado en el Learning.
      reference: https://github.com/Kaddo-kdd/kaddo/actions/runs/43071845815
      method: manual
    - criterion: '**AC-16:** El WI registra causa raíz, corrección, límites, comandos de validación y Learning en español; los AC se verifican antes del cierre canónico.'
      status: passed
      evidence: >-
        Este cierre registra causa raíz, diff, límites, comandos y Learning en
        español; kaddo verify WI-080 -> READY (16/16) antes de mover a completed.
      reference: knowledge/delivery/work-items/completed/WI-080-e2e-test-reliability-isolation.md
      method: manual
---

# WI-080 — E2E Test Reliability & Isolation

## 1. Context

Kaddo Admin incluye un flujo de integración externa:

```text
Integrations
    ↓
Mock Work Source (adapter de referencia)
    ↓
Browse external work items
    ↓
Import preview
    ↓
Human confirmation
    ↓
Kaddo Work Item (draft)
    ↓
Second import → duplicate detection
```

El escenario se prueba en `packages/admin/e2e/integrations.spec.ts` mediante Playwright. La suite arranca el Admin Server real sobre un proyecto temporal creado desde `packages/admin/e2e/fixtures/project/`, con una integración `mock-work-source` configurada como disponible.

El caso `browse external work items and import one as a Draft, then detect the duplicate` comienza en la línea 17 del archivo y recorre descubrimiento, preview, importación y detección de duplicados.

WI-076 ya registró un timeout intermitente al interactuar con `Browse work items`. WI-079 volvió a observar el fallo, incluso en una ejecución aislada, con timeout cercano a 30 segundos. La causa raíz no ha sido demostrada. Los demás tests relevantes de WI-079 aprobaron; este problema quedó como deuda independiente y no se ocultó mediante retries.

## 2. Problem

Una prueba E2E intermitente reduce la confianza en la suite, dificulta distinguir regresiones reales de problemas del harness y puede bloquear cambios no relacionados.

No se sabe todavía si el fallo se origina en:

- Carga o estado asíncrono de la interfaz antes de interactuar.
- Selectores que no representan correctamente el estado observable del usuario.
- Respuestas, estado o errores del endpoint que lista Work Items externos.
- Bootstrap, readiness o configuración del servidor/adapter mock.
- Estado residual entre casos, ejecuciones o imports.
- Condiciones propias del entorno de ejecución.

Estas son hipótesis de investigación, no diagnósticos confirmados. Dado que el escenario también ha fallado aislado, no atribuirlo automáticamente a concurrencia de fixtures.

**Problema central:** el flujo crítico de importación externa carece de una validación E2E consistentemente reproducible y confiable.

## 3. Expected Outcome

El escenario de importación externa se ejecuta de forma determinista y verifica el comportamiento real del producto:

1. Kaddo Admin presenta la integración de referencia disponible.
2. El usuario puede consultar los Work Items externos.
3. El sistema presenta el preview sin modificar aún artifacts canónicos.
4. La confirmación crea exactamente un Work Item en `draft`.
5. Un segundo intento identifica el import existente sin duplicar artifacts.
6. Cada ejecución opera sobre un entorno temporal limpio y deja evidencia diagnóstica ante fallos.

El resultado debe aumentar la confiabilidad de la suite sin modificar contratos funcionales ni introducir mecanismos que oculten fallos.

## 4. Scope

### 4.1 Root-cause investigation

- Revisar el test afectado, sus selectores, esperas y transición entre pasos.
- Revisar los estados de carga, error y disponibilidad de la vista Integrations.
- Revisar las llamadas de descubrimiento, preview, importación y duplicate detection.
- Revisar el comportamiento del adapter mock y su configuración E2E.
- Inspeccionar el bootstrap en `packages/admin/e2e/server.mjs`, la configuración Playwright y la limpieza de proyectos temporales.
- Comparar la ejecución aislada con la suite completa, documentando el primer punto observable de fallo.
- Cuando se reproduzca el problema, capturar traza, captura de pantalla, errores de navegador, requests fallidas y logs relevantes del servidor; evitar registrar secretos.

### 4.2 Minimal correction

- Corregir la causa raíz demostrada en la capa correspondiente (test, UI, server, adapter o fixture).
- Preferir aserciones sobre estados observables y condiciones reales antes que esperas de tiempo fijo.
- Usar selectores robustos y semánticos cuando un selector sea parte del problema.
- Proteger la separación entre configuración inicial, lectura de datos, importación y verificación del duplicado.
- Mantener los contracts existentes de integración y de Work Item import.
- Mantener la escritura de Work Items únicamente sobre el proyecto temporal E2E.
- Limitar los cambios a los componentes afectados por el diagnóstico. Si aparece un defecto funcional más amplio, presentar el hallazgo para decidir su alcance antes de expandir este WI.

### 4.3 Test integrity and diagnostics

- Prohibir `waitForTimeout` como sustituto de sincronización correcta.
- No introducir `retries` ni aumentar los timeouts para conseguir un resultado verde, salvo una justificación técnica respaldada por mediciones y autorizada explícitamente.
- No omitir, comentar, marcar `skip`, `fixme` ni suavizar aserciones críticas.
- Conservar validaciones de creación en `draft`, provenance y no duplicación, dentro de lo observable por el escenario.
- Preservar trazas y logs de diagnóstico ante errores de manera acotada, sin dejar artifacts temporales acumulados ni información sensible.

## 5. Validation Plan

### Baseline — Before the fix

Registrar:

- Commit base, entorno, versiones y comando ejecutado.
- Resultado del test aislado y de una ejecución de la suite completa.
- Paso exacto en el que se detiene la ejecución y evidencia disponible.
- Evidencia de reproducción; si no se reproduce localmente, usar los logs históricos y ampliar instrumentación antes de elegir una corrección.

### Stability — After the fix

1. Ejecutar el escenario afectado de manera aislada **10 veces consecutivas**, sin retries.
2. Ejecutar la suite E2E completa **3 veces consecutivas**, sin retries.
3. Verificar que la creación del Work Item y el segundo import mantienen la semántica esperada.
4. Confirmar que ninguna ejecución cambia artifacts reales del repositorio ni deja estado que contamine otra ejecución.
5. Ejecutar los tests unitarios/integración relevantes, typecheck/build de los paquetes afectados y CI.
6. Adjuntar resultados, comandos, logs y referencias de commits a la verificación de cada AC.

Si algún ciclo falla, el criterio de estabilidad no está cumplido: investigar el fallo y repetir la validación completa después de corregirlo. Diez pasadas y tres suites verdes son un umbral de aceptación, no prueba matemática de ausencia absoluta de flakiness.

## 6. Acceptance Criteria

### Diagnosis

- **AC-01:** El fallo histórico de `integrations.spec.ts:17` está documentado con referencias a WI-076/WI-079 y al escenario exacto.
- **AC-02:** Se identifica una causa raíz sustentada por trazas, logs, reproducción controlada o evidencia técnica equivalente; no se presenta una hipótesis como hecho.
- **AC-03:** Se distingue si el defecto está en el test/harness o en el comportamiento funcional de Admin, server o adapter, y se justifica la capa de corrección.

### Correction

- **AC-04:** La corrección resuelve la causa diagnosticada con un diff acotado y sin refactorización ajena al problema.
- **AC-05:** El escenario puede abrir Integrations, consultar Work Items externos y mostrar el resultado esperado mediante esperas basadas en condiciones observables.
- **AC-06:** El preview sigue siendo no mutante y la confirmación crea exactamente un Work Item en `draft`.
- **AC-07:** Un segundo intento de importar el mismo Work Item externo detecta la asociación previa y no crea duplicados.
- **AC-08:** Los artifacts canónicos y la provenance del Work Item importado mantienen sus contratos existentes; los tests no alteran proyectos reales.
- **AC-09:** No se añaden retries, skips, esperas fijas injustificadas, aumentos arbitrarios de timeout ni aserciones debilitadas para ocultar el defecto.

### Reliability & isolation

- **AC-10:** El escenario afectado aprueba **10 ejecuciones consecutivas** de manera aislada con `retries: 0`.
- **AC-11:** La suite E2E completa aprueba **3 ejecuciones consecutivas** con `retries: 0`.
- **AC-12:** El bootstrap y los fixtures dejan cada ejecución en estado conocido; no hay contaminación verificable entre casos o ejecuciones ni restos temporales sin limpiar.
- **AC-13:** Los fallos futuros exponen suficiente información diagnóstica útil, sin filtrar secretos ni introducir una infraestructura de observabilidad innecesaria.

### Quality & closure

- **AC-14:** Tests unitarios/integración relevantes y builds/typechecks de los módulos modificados aprueban sin regresiones.
- **AC-15:** La CI del commit de integración aprueba, y los resultados locales y de CI quedan enlazados como evidencia verificable.
- **AC-16:** El WI registra causa raíz, corrección, límites, comandos de validación y Learning en español; los AC se verifican antes del cierre canónico.

## 7. Validation Scenarios

### Scenario A — Initial integration visibility

Abrir Integrations en un proyecto temporal con `mock-work-source` habilitado.

**Expected:** la integración y sus capacidades se muestran de forma confiable.

### Scenario B — Browse external items

Accionar `Browse work items` tras cargar la página.

**Expected:** aparecen los datos del adapter mock o un error explícito y diagnosticable; no hay timeout silencioso.

### Scenario C — Preview and import

Abrir un Work Item externo, revisar preview y confirmar la importación.

**Expected:** no existe mutación previa a la confirmación; luego se crea un único Work Item en `draft`.

### Scenario D — Duplicate detection

Regresar a Integrations e intentar importar otra vez el mismo elemento.

**Expected:** el sistema informa el Work Item ya importado y no crea otro.

### Scenario E — Repeated isolated runs

Ejecutar el test 10 veces consecutivas sin retries.

**Expected:** 10/10 aprobadas, con cada ejecución sobre estado temporal limpio.

### Scenario F — Full suite regression

Ejecutar la suite E2E completa 3 veces sin retries.

**Expected:** 3/3 ejecuciones aprobadas, sin contaminación entre escenarios.

### Scenario G — Failure diagnostics

Provocar de forma controlada un fallo en el entorno de prueba sin introducirlo en el código productivo.

**Expected:** se obtiene evidencia suficiente para diagnosticarlo y no se exponen secretos ni se conservan datos temporales indebidamente.

## 8. Implementation Approach

### Phase 1 — Baseline & diagnosis

- Registrar el estado inicial y la evidencia histórica.
- Reproducir o instrumentar el punto de timeout.
- Identificar causa raíz y proponer corrección mínima.
- Presentar el diagnóstico antes de hacer cambios funcionales de alcance mayor.

### Phase 2 — Targeted fix

- Aplicar el cambio en la capa responsable.
- Mantener intactas las garantías del flujo de importación.
- Añadir o ajustar pruebas específicas únicamente donde aporten cobertura real.

### Phase 3 — Stability verification

- Ejecutar 10 pasadas aisladas y 3 suites completas sin retries.
- Verificar aislamiento, limpieza y no duplicación.
- Ejecutar regresión relevante, build y typecheck.

### Phase 4 — Evidence & delivery gates

- Consolidar evidencia por AC en el artifact canónico.
- Ejecutar `kaddo verify WI-080` y reportar readiness.
- Solicitar autorizaciones independientes para integración, publicación aplicable y cierre.

## 9. Constraints

- Mantener Markdown como fuente canónica de Kaddo.
- Usar el adapter mock de referencia; no requerir credenciales ni conectividad con sistemas externos.
- No cambiar la semántica de importación ni la detección de duplicados.
- No modificar artifacts reales durante pruebas E2E.
- No esconder fallos con retries, skips o timeouts arbitrarios.
- No atribuir el problema a concurrencia, rendering o backend sin evidencia.
- No ampliar el alcance a una refactorización general de Playwright.
- Conservar compatibilidad con la versión estable v3.136.0.

## 10. Non-goals

Esta entrega no contempla:

- Nuevos conectores o funcionalidades para Jira, GitHub, Linear o Azure DevOps.
- Rediseño de la pantalla Integrations.
- Reescritura completa del harness E2E.
- Incrementar cobertura E2E de todos los módulos.
- Revisar todos los timeouts del monorepo.
- Cambios a Planning, Initiatives o WI-080.
- Cambios de protocolo o API no relacionados con la causa raíz.
- Publicación de una nueva versión solo para justificar un cambio exclusivamente en tests, salvo decisión explícita del responsable humano.

## 11. Definition of Done

WI-080 estará listo para cierre cuando:

- La causa raíz esté explicada y respaldada por evidencia.
- La corrección preserve el comportamiento esperado de importación externa.
- Los 16 AC tengan verificación y evidencia estructuradas.
- Haya 10/10 ejecuciones aisladas y 3/3 suites completas aprobadas sin retries.
- Los builds, typechecks y tests relevantes estén en verde.
- La CI del commit autorizado esté aprobada.
- El Learning documente en español qué fallaba, por qué y cómo se evitó su recurrencia.
- El cierre haya seguido el lifecycle canónico con autorización humana.

## 12. Risks

**Fallo difícil de reproducir.** Mitigación: conservar logs históricos, añadir diagnóstico puntual y comparar ejecución aislada/completa; no declarar la causa raíz sin evidencia.

**Arreglo aparente mediante esperas.** Mitigación: exigir sincronización por condiciones observables y 10/3 ejecuciones sin retries.

**Estado persistido accidentalmente.** Mitigación: revisar bootstrap, directorios temporales y secuencia de importación; confirmar que no se alteran artifacts reales.

**Ampliación del alcance.** Mitigación: detener y solicitar decisión si la causa raíz revela un defecto transversal que excede el caso de importación.

## 13. Commit & Release Gate

Mantener tres compuertas independientes:

**Gate A — Integration**

Presentar diagnóstico, diff, pruebas, builds y evidencia antes de autorizar commits y push. No ejecutar `commit` ni `push` sin aprobación explícita.

**Gate B — Publication decision**

Después de CI aprobada, decidir expresamente si corresponde bump/tag/release/publicación npm. Si la modificación afecta exclusivamente pruebas o infraestructura E2E sin cambio de producto distribuido, proponer omitir una publicación npm innecesaria; dejar documentada la decisión, sin inventar un `released_in`.

**Gate C — Canonical closure**

Registrar evidencia de los 16 AC, ejecutar `kaddo verify WI-080`, registrar Learning en español y realizar la transición canónica a `completed` únicamente tras autorización humana. No cerrar el Work Item automáticamente por CI aprobada.

## 14. Learning

Entregado en `main` sobre **v3.136.0** (sin nueva versión: Gate B omitido por ser un cambio
exclusivamente de test — ver `release_decision`).

**Qué fallaba y por qué.** El escenario `integrations.spec.ts:17` esperaba un botón
`/Browse work items/`, pero **VS-103 (`34d37ff`, v3.83.0)** acortó el rótulo del toggle a **"Browse"**
sin actualizar el test. Playwright esperaba 30 s un locator inexistente y reportaba un "timeout" que se
leía como *flakiness*. No era intermitente: reproducido **2/2** de forma determinista. El producto nunca
estuvo roto — el test 1 de la misma spec (que no usa ese botón) siempre aprobó.

**Qué funcionó bien**

- **Reproducir antes de teorizar (AC-02).** Dos corridas aisladas con servidor fresco dieron el mismo
  punto de fallo exacto; `git log -S "Browse work items"` fijó el commit que cambió el rótulo. La causa
  quedó demostrada, no supuesta.
- **Corregir en la capa correcta (AC-03/AC-04).** El defecto era del test/harness, así que el diff fue de
  2 selectores; no se tocó producto para "acomodar" un test obsoleto, que habría sido arreglar lo que no
  estaba roto.
- **Aislamiento real para la estabilidad (AC-10/AC-12).** Como el escenario muta el proyecto temporal
  (importa un WI), `--repeat-each` habría contaminado la detección de duplicados. Se usaron **10
  invocaciones separadas** con `CI=1` (proyecto temporal nuevo por corrida) → 10/10, y 3/3 suites
  completas (51 passed), sin retries ni cambios de timeout.

**Lecciones / cómo evitar la recurrencia**

- Un "timeout" de Playwright casi siempre significa *locator que no aparece*, no *backend lento*: leer el
  `waiting for ...` del error antes de atribuirlo a concurrencia o rendimiento.
- Rótulos de UI como texto de botón son selectores frágiles. Para toggles con dos estados ("Browse" /
  "Hide items"), un `data-testid` estable sería más robusto; se deja anotado como mejora opcional de DX
  fuera del alcance de este WI (diff acotado).
- Antigüedad de la deuda: el fallo venía deterministamente desde v3.83.0 pero se arrastró como "flaky
  intermitente" en WI-076/WI-079. Reproducir pronto habría ahorrado el arrastre.

**Validación de referencia**

- `CI=1 npx playwright test integrations.spec.ts` ×10 (aisladas) → 10/10.
- `CI=1 npx playwright test` ×3 (suite completa) → 3/3 (51 passed).
- `pnpm vitest run packages/admin/tests` → 69/69; `tsc -b` de admin → exit 0.
- CI del commit de integración (`e1b50c9`): run 43071845815 → success (1m12s).
