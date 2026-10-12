---
type: feature
id: WI-066
title: >-
  Fortalecer exportación OKF v0.2 con contenido completo, conformidad y
  seguridad
status: ready
work_type: feature
created_at: '2026-10-12'
source:
  type: external
  imported_at: '2026-10-12'
  source_format: markdown-frontmatter
  source_hash: 72f5ae25daaab9193b393dee0dbe15af7d540fc1940de94be3075a1ae29aa7d7
  inferred: false
generated_by: kaddo-admin
knowledge_level: K3
domains:
  - Product
  - Tech
  - Delivery
affected_modules:
  - cli
  - docs
scope_confidence:
  level: high
  reasons:
    - >-
      Endurece el adaptador OKF ya existente (core/okf/*) sobre readers Core; no
      cambia el modelo canónico.
    - >-
      20 ACs explícitos + 8 escenarios + Commit Gate; continúa WI-065
      (v3.125.0).
    - >-
      Los 12 frentes verificados contra el código actual con ubicaciones
      concretas (grounding técnico).
relates_to:
  - WI-065
refined_by: work-item-refinement (manual)
summary: >-
  WI-065 incorporó la compatibilidad inicial con Open Knowledge Format (OKF
  v0.2): export + validate + reports opcionales. El dogfooding confirma que
  genera directorios por dominio, conceptos con frontmatter, índices y reportes
  vía `--with-reports`. Pero la revisión identificó l…
original_snapshot:
  title: >-
    Fortalecer exportación OKF v0.2 con contenido completo, conformidad y
    seguridad
  description: >-
    WI-065 incorporó la compatibilidad inicial con Open Knowledge Format (OKF
    v0.2): export + validate + reports opcionales. El dogfooding confirma que
    genera directorios por dominio, conceptos con frontmatter, índices y
    reportes vía `--with-reports`. Pero la revisión identificó l…
  type: feature
  status: draft
ready_at: '2026-10-12'
---

# Fortalecer exportación OKF v0.2 con contenido completo, conformidad y seguridad

## Intent

WI-065 incorporó la compatibilidad inicial con Open Knowledge Format (OKF v0.2): export + validate +
reports opcionales. El dogfooding confirma que genera directorios por dominio, conceptos con frontmatter,
índices y reportes vía `--with-reports`. Pero la revisión identificó limitaciones a corregir antes de que
el bundle sea adecuado para intercambio real entre herramientas/agentes independientes:

1. Los artifacts se exportan como **referencias** (título+descripción), sin el **contenido Markdown completo**.
2. Los **índices** llevan frontmatter que no corresponde a OKF v0.2.
3. Los reportes declaran `generated.at` pero no `generated.by`.
4. El export **elimina recursivamente** el destino antes de escribir, sin protección frente a destinos peligrosos.
5. **Colisiones de id** se omiten silenciosamente (pérdida de conocimiento).
6. La procedencia puede apuntar a archivos originales no disponibles para un consumidor independiente.
7. `misc/` mezcla conocimiento del sistema con **instrucciones para agentes**.
8. Faltan **índices locales** en colecciones anidadas.

Objetivo: corregir sin alterar el conocimiento canónico ni el modelo de dominio.

Spec: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md
Implementación actual: `packages/cli/src/core/okf/{export,mapping,extras,validate,types}.ts`,
`packages/cli/src/commands/okf.ts`, `packages/cli/tests/okf.test.ts`.

## Commit Gate (obligatorio)

No commitear/pushear automáticamente. Antes de pedir el commit: (1) build+tests; (2) generar bundle sin
reports; (3) con reports; (4) validar ambos; (5) inspeccionar varios conceptos para confirmar fidelidad
de contenido; (6) comprobar navegación y seguridad; (7) presentar resultados y **solicitar aprobación
explícita**. `conformant: true` NO equivale a aprobación.

## Scope (correcciones)

1. **Preservar contenido canónico** — los conceptos deben llevar el **cuerpo Markdown** del artifact
   (no `body: null`): Business/Product (definiciones, reglas, decisiones), Technical (arquitectura,
   componentes, dependencias), Work Items (intención, alcance, ACs, Implementation Evidence,
   Verification), ADRs (contexto/decisión/consecuencias), Deprecation Plans (targets/lifecycle/evidencia/
   dependencias), Production Runbooks (según política), Project Resources (descripciones/relaciones/
   límites de acceso, sin divulgar secretos). Conservar secciones, tablas, listas y bloques de código
   permitidos. Reutilizar Core para leer; separar frontmatter original del cuerpo; generar frontmatter
   OKF nuevo sin duplicar el original; no modificar la fuente; no usar LLM; aplicar seguridad antes de
   escribir. Si un artifact no puede exportarse íntegro, registrar omisión/transformación explícita con
   motivo — nunca sustituir silenciosamente un documento por un resumen.
2. **Preservar y resolver relaciones** — reescribir enlaces internos `knowledge/...` a su ubicación en
   el bundle usando el mapping origen→destino de la exportación, solo con correspondencia inequívoca;
   preservar enlaces externos; detectar no resueltos; no inventar relaciones; identidades estables entre
   exportaciones. Enlaces rotos = portabilidad, **no** error de conformidad (OKF admite refs no resueltas).
3. **Convenciones de índices OKF v0.2** — `index.md` **sin frontmatter**, salvo el **índice raíz** que
   puede declarar `okf_version: "0.2"` (sin `type`). Índices anidados: sin frontmatter, con enlaces
   navegables a conceptos/subdirectorios. Validador: NO exigir `type` en `index.md`; exigir `type` solo
   en conceptos; respetar la excepción `okf_version`; no tratar la ausencia de frontmatter de un índice
   como error; validar `log.md` cuando exista; sin falsos warnings por reglas anteriores.
4. **Provenance y generated correctos** — reports: `generated.by: process:kaddo-okf-export` +
   `generated.at: ISO 8601` (id de proceso estable y documentado). Artifacts: preservar identidad y
   procedencia real; diferenciar ruta original del concepto exportado; **no** declarar una fuente interna
   como resoluble si está fuera del bundle; extensiones Kaddo cuando sea necesario. **Trust boundaries**:
   no declarar automáticamente `verified` (por exportar), `human-reviewed` (por tener ACs), `stable`
   (por WI completed), `stale_after` arbitrario, ni Attested Computation (por tener fórmulas).
5. **Destino de exportación seguro** — rechazar destinos peligrosos (raíz del proyecto, padres,
   `knowledge/`, dirs de código, rutas protegidas); resolver/validar rutas antes de operaciones
   destructivas; detectar symlinks y evitar escapar del destino; ids no deben permitir path traversal;
   no sobrescribir archivos ajenos a un export OKF sin autorización; **no borrar el bundle anterior antes
   de que el nuevo esté listo** (staging + reemplazo controlado); protegerse de exportaciones parciales.
   Un fallo no debe destruir una versión válida previa. Negative tests sobre **fixtures temporales**, no
   el repo real.
6. **Evitar fuga de información sensible** — al preservar cuerpos completos aumenta la superficie.
   Política explícita de artifacts exportables; no copiar credenciales/tokens/claves/secrets, ni `.env`
   ni código por descubrimiento incidental; no depender solo de regex; redacción/exclusión explícita sin
   alterar engañosamente el significado; ante contenido sensible no tratable con seguridad, **omitir el
   concepto o detener el export** con diagnóstico claro; que logs/errores **no expongan** el valor
   detectado; documentar que el bundle requiere revisión. Un warning no es protección si el archivo
   sensible ya se escribió en el destino final.
7. **Colisiones de identidad** — detectar colisiones de id canónico, ruta de destino, nombres
   normalizados, slugs y fuentes distintas que resuelvan al mismo concepto, **antes** de escribir. No
   omitir conceptos distintos en silencio; distinguir duplicados reales; preservar ids inequívocos;
   estrategia determinística documentada cuando se pueda resolver; si no, **detener** e informar los
   artifacts; nunca sobrescribir otro concepto. No exigir que el consumidor conozca ids internos de Kaddo.
8. **Organización del bundle** — distinguir conceptos que describen el sistema de documentos que orientan
   cómo trabajar con él; clasificar por tipos/metadatos reales (no por nombre de archivo); considerar
   `agents/` o `workflows/` para instrucciones de agentes; evitar que prompts/instrucciones se
   interpreten como conocimiento verificado; sin dirs vacíos; sin modificar el origen. Inclusión de
   agentes/doc operacional puede ser **configurable** por seguridad/relevancia. No mover arbitrariamente
   todo `misc/` a una categoría nueva.
9. **Índices anidados (progressive disclosure)** — generar índices locales donde haya colecciones:
   `delivery/work-items/index.md`, `delivery/deprecations/index.md`, `delivery/runbooks/index.md`,
   `tech/modules/index.md`. Cada índice solo sus elementos (título, enlace, descripción si existe); orden
   determinístico; sin índices para dirs vacíos; sin repetir todo el catálogo; enlaces válidos;
   convenciones OKF de frontmatter.
10. **Reports opcionales** — mantener `--with-reports` (Impact/Drift/Savings, derivados y opcionales):
    cuerpo completo del reporte; `generated.by`+`generated.at` correctos; preservar Evidence
    Classification, Confidence, assumptions, limitations y las diferencias observed/derived/estimated/
    projected/unknown; no convertir Savings en ahorros comprobados; sin inventar campos; fuera del export
    por defecto; sin cambiar fórmulas ni comportamiento CLI/MCP.
11. **Validación reforzada** — separar Conformance errors / Warnings / Information: frontmatter de
    conceptos, `type` obligatorio en conceptos, tratamiento de `index.md`/`log.md`, familias opcionales
    (`generated`/`verified`/`sources`) con carácter permisivo, resolución de enlaces relativos/bundle,
    diagnósticos de refs no resueltas, problemas de identidad como validación **semántica de Kaddo** (no
    infracción OKF), protección frente a traversal/symlinks al leer, solo lectura. No rechazar por tipos
    desconocidos, campos extra o metadatos opcionales ausentes.
12. **Validación de consumidor independiente** — test e2e con parser genérico Markdown/YAML (sin APIs de
    Kaddo): leer índice raíz → descubrir secciones → abrir un concepto técnico y leer su contenido
    completo → seguir relaciones a un WI y un Resource → consultar un Deprecation Plan → interpretar
    procedencia sin Kaddo → identificar reports cuando se exporten.

## Out of scope

Importación OKF; sincronización bidireccional; cambios al modelo canónico; nuevos tipos de WI; nuevos
cálculos de reporting; reemplazar Knowledge Capsules; base de datos; ejecutar código del bundle; servidor
OKF; Attested Computations; visualización OKF en Admin; generación por LLM; resolver relaciones ausentes
del Graph; modificación masiva de artifacts históricos.

## Acceptance criteria

- [ ] AC-01: los documentos OKF contienen el cuerpo Markdown permitido del artifact, no solo título+descripción.
- [ ] AC-02: se preservan secciones y significado del documento original.
- [ ] AC-03: enlaces internos se resuelven con mapping inequívoco; los no resueltos se reportan.
- [ ] AC-04: los índices cumplen las convenciones OKF v0.2.
- [ ] AC-05: los reportes declaran `generated.by` y `generated.at`.
- [ ] AC-06: no se inventan procedencia, verificación, confianza ni vigencia.
- [ ] AC-07: se rechazan destinos peligrosos antes de operaciones destructivas.
- [ ] AC-08: una exportación fallida no destruye un bundle anterior válido.
- [ ] AC-09: rutas y symlinks no permiten escribir fuera del destino autorizado.
- [ ] AC-10: información sensible conocida no se persiste inadvertidamente.
- [ ] AC-11: las colisiones de identidad se detectan sin omisión silenciosa.
- [ ] AC-12: documentos auxiliares clasificados semánticamente (no mezclar instrucciones de agentes con conocimiento).
- [ ] AC-13: colecciones anidadas con índices de navegación cuando corresponde.
- [ ] AC-14: `--with-reports` sigue opcional y conserva disclaimers.
- [ ] AC-15: `kaddo okf validate` distingue conformidad, warnings e informativos.
- [ ] AC-16: el bundle se consume con un lector independiente sin instalar Kaddo.
- [ ] AC-17: dos exportaciones del mismo snapshot producen conceptos/rutas/relaciones estables.
- [ ] AC-18: se mantienen compatibles Core y CLI existentes.
- [ ] AC-19: pruebas de regresión para contenido, seguridad, metadata, identidad y navegación.
- [ ] AC-20: documentación EN/ES actualizada.

## Validation (escenarios)

- **A Knowledge Fidelity**: archivo técnico con secciones/tablas/código/enlaces → concepto preserva
  contenido y enlaces resolubles apuntan al bundle.
- **B Work Item**: WI con ACs/DoD/Evidence/Verification → secciones conservadas; frontmatter OKF no
  duplica el de Kaddo.
- **C OKF Conformance**: índices raíz+anidados, conceptos válidos, metadata de generación → validate sin
  falsos errores por índices sin `type`.
- **D Unsafe Destination**: exportar sobre raíz/dirs protegidos → rechazo sin pérdida/modificación (fixtures temporales).
- **E Sensitive Content**: credencial ficticia reconocible → no aparece en bundle ni logs/errores.
- **F Identity Collision**: dos artifacts con mismo id/ruta → sin sobrescritura ni pérdida silenciosa.
- **G Reports**: con y sin `--with-reports` → reports solo con la opción; contenidos + metadata válida.
- **H Independent Consumption**: lector genérico Markdown/YAML → navegación por índices, contenido
  completo y enlaces internos, sin dependencias de Kaddo.

## Implementation guidance

Revisar `core/okf/{export,mapping,extras,validate,types}.ts`, `commands/okf.ts`, `tests/okf.test.ts`.
Reutilizar servicios existentes de discovery/lectura; no un segundo parser de artifacts. Pipeline antes
de escribir el destino final: (1) artifact discovery; (2) export eligibility + security; (3) identity +
destination mapping; (4) transformación de cuerpo Markdown + metadata; (5) resolución de relaciones;
(6) serialización OKF; (7) validación; (8) publicación segura del bundle completo (staging + swap).
Mantener separadas las responsabilidades de mapper, serializador, validador y mecanismo de escritura.

## Entry points (grounding técnico — verificado contra el código actual)

Cada corrección aterriza en una ubicación concreta del adaptador existente (confirmadas al refinar):

- **P1 contenido completo (AC-01/02)** — `mapping.ts` `buildConcept` fija `body: null`; hay que leer el
  cuerpo Markdown del artifact (reutilizar `readFile` + separar frontmatter vía gray-matter, como ya
  hace `resources.ts`/`work-items.ts`) y pasarlo a `OkfConcept.body`, que `export.ts` `renderConcept` ya
  sabe emitir verbatim. No reconstruir desde propiedades; no modificar la fuente.
- **P2 relaciones/enlaces (AC-03)** — `export.ts` ya construye `byId`/`relLink`; falta un mapping
  origen→destino (relPath canónico → ruta bundle) para **reescribir enlaces internos** del cuerpo que
  apunten a `knowledge/...`, solo con correspondencia inequívoca; refs no resueltas → info.
- **P3 índices + generated.by (AC-04/05)** — `export.ts` `renderIndex` emite `type: 'Index'` (frontmatter
  que OKF no pide): los índices anidados deben ir **sin frontmatter** y el raíz solo con `okf_version`.
  `extras.ts` reports usan `generated.at` (export.ts:57) sin `generated.by`: añadir
  `generated.by: process:kaddo-okf-export` estable.
- **P4 destino seguro (AC-07/08/09)** — `export.ts:~156` hace `fs.rmSync(outputDir)` antes de escribir:
  sustituir por **staging + swap** (escribir a dir temporal, validar, reemplazar atómicamente), con
  guardas que rechacen raíz/padres/`knowledge/`/dirs de código y resuelvan symlinks; ids no deben
  permitir traversal.
- **P5/P7 colisiones (AC-11)** — `export.ts` `addConcept` hace `if (seen.has(c.id)) return` (omisión
  **silenciosa**): detectar colisiones de id/ruta/slug **antes** de escribir, distinguir duplicado real
  de colisión entre artifacts distintos, y **detener** con diagnóstico cuando sea ambiguo.
- **P6 sensibles (AC-10)** — `export.ts` `scanSensitive` ya avisa, pero el archivo ya se escribió:
  mover la política a **antes** de persistir (omitir/excluir el concepto o abortar), allow-list de tipos
  exportables, y no exponer el valor detectado en logs/errores.
- **P8 organización (AC-12)** — `mapping.ts` `conceptBundlePath` cae a `misc/` para tipos desconocidos:
  clasificar por tipo/metadato real; separar instrucciones de agentes (type `agent`) hacia `agents/` o
  excluirlas (configurable); evitar que prompts se lean como conocimiento del sistema.
- **P9 índices anidados (AC-13)** — hoy solo hay índices por capa de primer nivel; añadir índices locales
  en `delivery/work-items/`, `delivery/deprecations/`, `delivery/runbooks/`, `tech/modules/`.
- **P11 validador (AC-15)** — `validate.ts` trata un `index.md` sin `type` como warning (`isIndex`); debe
  **no** pedir frontmatter en índices, exigir `type` solo en conceptos, respetar `okf_version` del raíz,
  separar identidad (semántica Kaddo) de conformidad OKF, y protegerse de traversal/symlinks al leer.
- **P12 consumidor independiente (AC-16)** — test e2e con parser genérico Markdown/YAML (sin importar
  `@kaddo/cli`), recorriendo índices → concepto técnico (cuerpo completo) → relaciones a WI/Resource →
  Deprecation Plan → procedencia.

Mantener separados mapper (`mapping.ts`), serializador (`export.ts` render*), validador (`validate.ts`) y
escritura (staging/swap). No duplicar el parser de artifacts de Kaddo.

## Definition of Done

Bundles con conocimiento real y portable; formato OKF v0.2; índices con navegación progresiva;
relaciones internas utilizables; procedencia sin inventar confianza; destino protegido; sin eliminar
contenidos ajenos ni versiones válidas ante fallos; colisiones sin pérdida silenciosa; reports opcionales
funcionando; validador fiel a la spec; consumidor independiente puede explorar; tests y docs EN/ES
actualizados; Implementation Evidence; dogfooding exportando el propio Kaddo. **Commit Gate** respetado.

## Relación

Continúa y endurece WI-065 (OKF v0.2 adapter, liberado en v3.125.0). Mismo módulo `core/okf/`.

## Guiding principle

Un bundle OKF no debe ser solo una estructura de archivos válida: debe preservar el conocimiento, sus
relaciones y su procedencia, de modo que otro agente o herramienta pueda consumirlo sin depender de Kaddo
y sin recibir información incompleta, inventada o sensible.
