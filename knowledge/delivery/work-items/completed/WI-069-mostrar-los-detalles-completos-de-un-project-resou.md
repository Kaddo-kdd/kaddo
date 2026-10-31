---
type: feature
id: WI-069
title: Mostrar los detalles completos de un Project Resource en Kaddo Admin
status: completed
completed_at: '2026-10-31'
work_type: feature
created_at: '2026-10-30'
code:
  - packages/cli/src/core/resources.ts
  - packages/cli/src/core/resource-write.ts
  - packages/admin/src/routes/ResourceDetail.tsx
  - packages/admin/src/lib/resource-profiles.ts
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/resources.ts
        - packages/cli/src/core/resource-write.ts
        - packages/cli/src/core.ts
        - packages/cli/tests/resource-write.test.ts
      validations:
        - command: >-
            pnpm --filter @kaddo/cli exec vitest run
            tests/resource-write.test.ts tests/resources.test.ts
          status: passed
          reason: >-
            17 verdes (6 nuevos): coordenadas por entorno/interfaz round-trip,
            rechazo de secreto con error sin el valor y sin persistir, redacción
            en lectura de coordenada con pinta de secreto, preservación de
            perfiles al actualizar otro campo.
    admin-server:
      role: module
      status: completed
      changed_paths:
        - packages/admin-server/src/contracts/schemas.ts
        - packages/admin-server/tests/resource-connection-profiles.test.ts
      validations:
        - command: >-
            pnpm exec vitest run
            packages/admin-server/tests/resource-connection-profiles.test.ts
          status: passed
          reason: >-
            schema acepta perfiles; round-trip create/detail; rechazo de secreto
            sin el valor.
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/routes/ResourceDetail.tsx
        - packages/admin/src/routes/Resources.tsx
        - packages/admin/src/lib/api.ts
        - packages/admin/src/lib/resource-profiles.ts
        - packages/admin/tests/resource-profiles.test.ts
      validations:
        - command: pnpm --filter @kaddo/admin build && vitest run tests/
          status: passed
          reason: >-
            tsc limpio; 69 verdes. Revisión visual (Commit Gate): crear/editar/
            consultar perfil, render del cuerpo Markdown, rechazo de secreto con
            error (valor no mostrado ni persistido), lista con tipo/proveedor/
            entornos, light/dark y 375px.
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/project-resources.md
        - apps/docs/src/content/docs/es/project-resources.md
      validations:
        - command: pnpm --filter @kaddo/docs build
          status: passed
          reason: 257 páginas; sección Connection coordinates + aviso OKF en EN/ES.
implementation_status: completed
validation_status: passed
released_in: v3.128.0
source:
  type: external
  imported_at: '2026-10-30'
  source_format: markdown-frontmatter
  source_hash: f4d5b1fba3ab8d6f8a652f6a00ce7f5c9501e334eda273309e3296435a11fba5
  inferred: false
generated_by: kaddo-admin
knowledge_level: K2
domains:
  - Tech
  - Delivery
affected_modules:
  - cli
  - admin-server
  - admin
  - docs
scope_confidence:
  level: high
  reasons:
    - >-
      Extiende el Resource Contract existente (core/resources.ts) y su pila
      (schema → writer → adapter → tipos → vista); no cambia el modelo canónico
      de Knowledge.
    - >-
      17 ACs explícitos + Commit Gate; invariante de seguridad clara (solo
      referencias, rechazo con error de valores con pinta de secreto).
    - >-
      Estado actual verificado en el código: markdownBody no se renderiza,
      AccessInterface sin coordenadas, consumidores y rutas localizados.
refined_by: work-item-refinement (manual)
summary: >-
  En Kaddo Admin la vista de un Project Resource no deja ver **todos** sus
  detalles. Más allá del nombre y el tipo, un recurso (p. ej. una base de datos)
  necesita mostrar información operativa no secreta — **host/IP, usuario por
  defecto, base de datos a usar, puerto, región, URL…
original_snapshot:
  title: Mostrar los detalles completos de un Project Resource en Kaddo Admin
  description: >-
    En Kaddo Admin la vista de un Project Resource no deja ver **todos** sus
    detalles. Más allá del nombre y el tipo, un recurso (p. ej. una base de
    datos) necesita mostrar información operativa no secreta — **host/IP,
    usuario por defecto, base de datos a usar, puerto, región, URL…
  type: feature
ready_at: '2026-10-31'
verified_at: '2026-10-31'
---

# Mostrar los detalles completos de un Project Resource en Kaddo Admin

## Intent

En Kaddo Admin la vista de un Project Resource no deja ver **todos** sus detalles. Más allá del nombre y
el tipo, un recurso (p. ej. una base de datos) necesita mostrar información operativa no secreta —
**host/IP, usuario por defecto, base de datos a usar, puerto, región, URL/endpoint**, etc. — para que el
recurso sea útil al leerlo. Hoy la información queda incompleta: el recurso se consulta como archivo bajo
`knowledge/tech/resources/`, pero la vista dedicada del recurso en Admin no la presenta de forma completa.

Modelo actual (verificado en el código): un Project Resource es conocimiento **de solo lectura** que nunca
se conecta al sistema ni almacena/resuelve **valores** de credenciales — solo **referencias** (nombres de
variables de entorno o secretos). Esa invariante debe conservarse: host/usuario/base de datos son
**configuración** (coordenadas de conexión), no credenciales; contraseñas/tokens/keys siguen siendo
referencias.

## Goal

Que la vista del recurso en Admin muestre la información completa y útil de cada Project Resource:
(1) un lugar **estructurado** para las coordenadas de conexión no secretas (host/IP, puerto, base de
datos, usuario/rol por defecto, región, cuenta/proyecto, URL/endpoint), por entorno cuando aplique;
(2) que esa información se **vea** en la vista del recurso (incluido el cuerpo Markdown del artifact, que
hoy se obtiene pero no se renderiza); (3) sin exponer ni almacenar secretos. No es conectarse al sistema
real ni descubrir infraestructura automáticamente: es presentar mejor el conocimiento que ya se captura.

## Commit Gate (obligatorio)

No commitear/pushear/release automáticamente. Antes de pedir autorización: (1) build+tests (Core,
admin-server, Admin); (2) levantar Admin local; (3) comprobar el **flujo completo** de un perfil de
conexión: crear, editar y consultar por entorno; (4) verificar que el cuerpo Markdown se renderiza en la
vista; (5) verificar el rechazo con error claro de un valor con pinta de secreto; (6) revisar light/dark y
responsive; (7) presentar la interfaz y **solicitar confirmación explícita** antes del commit. Compilar y
pasar tests NO equivale a aprobación.

## Scope

1. **Renderizar el cuerpo Markdown del recurso** — `ResourceDetail.tsx` ya recibe `markdownBody` desde la
   API (`getResource` → `getResourceDetailAdmin`) pero **no lo muestra**; solo pinta un grid estructurado.
   La vista dedicada presenta **primero los datos estructurados** y luego ofrece el **contenido Markdown
   completo** mediante el `MarkdownRenderer` compartido (mejorado en WI-067), para que la información que
   hoy vive en prosa (p. ej. `telemetry.kaddo.org`, boundaries, notas de acceso) sea visible.
2. **Modelar perfiles de conexión no secretos en el Core** — `packages/cli/src/core/resources.ts`:
   el modelo tiene `AccessInterface` (type/tool/provider/purpose/operations/environments/constraints) y
   `authentication` (solo referencias), pero **no** hay campo para host/IP, puerto, base de datos,
   usuario/rol por defecto, región, cuenta/proyecto, URL/endpoint. Añadir un bloque estructurado de
   **perfiles de conexión** que representen **múltiples entornos** y **distintas interfaces de acceso**,
   con **campos opcionales según el tipo de recurso** (una DB usa host/puerto/db/usuario; una API usa
   URL/endpoint; cloud usa región/cuenta…). Parsing laxo (valores desconocidos pasan) coherente con el
   diseño actual y compatible con recursos existentes que no los declaran.
3. **Validación antes de persistir (no descartar en silencio)** — los campos estructurados admiten
   host/usuario/db/puerto/región/URL (configuración), pero cualquier valor con **pinta de secreto**
   (contiene `=`, cadena larga/opaca, password/token/key, parece una credencial) se **valida y se rechaza
   con un error claro** antes de persistir — **no** se descarta en silencio. El mensaje de error **no
   revela** el valor sensible. Las credenciales siguen siendo **referencias** (`authentication.refs`).
4. **Captura y edición desde Admin (obligatorio)** — hoy el formulario de crear/editar recurso solo edita
   provider+purpose; ampliarlo para **crear, editar y consultar perfiles de conexión por entorno** desde
   Admin, con los campos opcionales por tipo de recurso. El flujo completo (crear → editar → consultar) es
   parte del alcance obligatorio y del Commit Gate.
5. **Propagar por la pila** — contrato en `packages/admin-server/src/contracts/schemas.ts`
   (`ResourceCreateSchema`/`ResourceUpdateSchema`/`AccessInterfaceInputSchema`), writer
   `packages/cli/src/core/resource-write.ts`, adapter `core-adapter.ts`, tipos cliente
   `packages/admin/src/lib/api.ts` (`ResourceDetail`), y render/edición en `ResourceDetail.tsx`.
6. **Presentar los perfiles en la vista** — sección clara en `ResourceDetail.tsx` (p. ej. "Connection" /
   "Coordenadas de conexión") con host/IP, puerto, base de datos, usuario, región, endpoint, agrupadas
   **por entorno** y por interfaz; etiquetar explícitamente que **no son credenciales**.
7. **Lista de recursos** — `routes/Resources.tsx`: cada tarjeta muestra **como mínimo tipo, proveedor y
   entornos**, **sin exponer innecesariamente** las coordenadas internas de conexión (esas viven en la
   vista dedicada).
8. **Fuente de verdad canónica** — la información del Resource se mantiene canónica en
   `knowledge/tech/resources/`; Admin lee y escribe ahí. **No se crea una segunda copia** ni una fuente de
   verdad adicional en Admin.
9. **Versionado y OKF** — documentar que la configuración almacenada en Markdown se **versiona** con el
   repo y puede **exportarse vía OKF**; advertir los **riesgos de compartir metadatos internos de
   infraestructura** y su posible inclusión en exportaciones OKF.
10. **Seguridad e integridad** — Resource sigue siendo solo lectura respecto al sistema real: **ninguna
    operación de consulta o edición establece conexiones reales** con los recursos; mantener
    `redactSecrets`; no exponer valores sensibles; solo configuración no secreta.
11. **Tests** — Core (parsing de perfiles + validación/rechazo de secretos), admin-server (schema/adapter)
    y Admin (crear/editar/consultar; render de coordenadas y cuerpo; errores de validación sin filtrar).

## Out of scope

Conectarse al sistema real o healthchecks en vivo; resolver/mostrar valores de secretos o credenciales;
descubrimiento/autoimport de infraestructura; cambiar el modelo canónico de Knowledge más allá del
Resource Contract; crear una segunda fuente de verdad en Admin; editor avanzado; gestión de secretos.

## Acceptance criteria

- [x] AC-01: la vista del recurso en Admin renderiza el cuerpo Markdown del artifact (hoy no se muestra).
- [x] AC-02: el modelo de Resource admite coordenadas de conexión no secretas estructuradas (host/IP,
  puerto, base de datos, usuario/rol, región, cuenta/proyecto, URL/endpoint), por entorno cuando aplique.
- [x] AC-03: esas coordenadas se muestran en la vista del recurso en una sección clara y legible.
- [x] AC-04: se conserva la invariante de solo referencias: ningún valor de credencial se almacena ni se
  muestra.
- [x] AC-05: el contrato (schema), writer, adapter y tipos cliente soportan los nuevos campos sin romper
  recursos existentes (backward-compatible, parsing laxo).
- [x] AC-06: la lista de recursos muestra como mínimo tipo, proveedor y entornos, sin exponer coordenadas
  internas de conexión.
- [x] AC-07: light/dark y responsive consistentes con el resto del Admin.
- [x] AC-08: pruebas en Core, admin-server y Admin, incluida la no-filtración de secretos.
- [x] AC-09: Admin permite crear, editar y consultar perfiles de conexión por entorno.
- [x] AC-10: los campos estructurados son opcionales y compatibles con recursos existentes que no los
  declaran.
- [x] AC-11: la vista dedicada renderiza el cuerpo Markdown completo mediante `MarkdownRenderer`.
- [x] AC-12: no se duplican datos canónicos ni se genera una fuente de verdad adicional.
- [x] AC-13: los valores de credenciales incrustados en campos estructurados son rechazados antes de
  persistirse.
- [x] AC-14: los errores de validación se muestran al usuario sin revelar información sensible.
- [x] AC-15: los perfiles existentes permanecen intactos cuando se actualizan otros campos del Resource.
- [x] AC-16: la documentación explica los riesgos de compartir metadatos internos de infraestructura y su
  posible inclusión en exportaciones OKF.
- [x] AC-17: la interfaz se revisa localmente en light/dark y responsive antes de solicitar autorización
  para el commit.

## Implementation guidance

Archivos clave (verificados): `packages/cli/src/core/resources.ts` (modelo + parsing),
`packages/cli/src/core/resource-write.ts` (writer), `packages/admin-server/src/contracts/schemas.ts`
(contrato), `packages/admin-server/src/core-adapter.ts` (adapter),
`packages/admin/src/lib/api.ts` (tipos cliente), `packages/admin/src/routes/ResourceDetail.tsx` (vista +
formulario crear/editar; hoy solo edita provider+purpose e ignora `markdownBody`),
`packages/admin/src/routes/Resources.tsx` (lista). Reutilizar el `MarkdownRenderer` compartido y los
tokens del Design System. Añadir una validación que rechace con error (no descarte) valores con pinta de
secreto en los perfiles, reutilizando la heurística de `parseAuth`/`redactSecrets`; conservar el parsing
laxo para los campos de configuración. Documentar el versionado y la exportación OKF en la doc del Resource
Contract (`apps/docs`).

## Entry points (grounding técnico — verificado contra el código actual)

- `ResourceDetail` (`ResourceDetail.tsx`) obtiene el detalle vía `api.getResource` y pinta solo un grid
  (Type/Provider/Scope/Environments/Used by modules/Purpose) + interfaces + boundaries + auth refs. El
  tipo cliente `ResourceDetail` (`lib/api.ts`) **incluye `markdownBody`**, y el server lo devuelve
  (`getResourceDetailAdmin` hace spread de `coreGetResource`), pero la vista **no lo renderiza**.
- `core/resources.ts`: `ResourceDetail` = summary + `purpose` + `interfaces` (AccessInterface) +
  `boundaries` + `authRefs`/`authMode` + `markdownBody`. `AccessInterface` no tiene host/endpoint/puerto/
  base de datos/usuario. Diseño: solo lectura, **nunca valores de credenciales** (ver `parseAuth`, que
  descarta refs con `=` o no `[A-Za-z0-9_.-]`).
- `schemas.ts`: `AccessInterfaceInputSchema` = type/tool/provider/purpose/operations/environments/
  constraints; `ResourceCreateSchema`/`ResourceUpdateSchema` no modelan coordenadas de conexión.
- Ejemplo real: `knowledge/tech/resources/telemetry-service.md` pone el endpoint (`telemetry.kaddo.org`)
  y los boundaries en el **cuerpo**, que hoy no se ve en Admin.

## Validation

- **Unit (Core)**: parsing de perfiles de conexión (host/puerto/db/usuario/región/URL por entorno e
  interfaz), campos opcionales por tipo, backward-compat con recursos sin perfiles; validación que
  **rechaza con error** valores con pinta de secreto (p. ej. `password=...`, tokens/keys) sin incluir el
  valor en el mensaje.
- **admin-server**: schema (`ResourceCreateSchema`/`ResourceUpdateSchema`) acepta los nuevos campos y
  rechaza secretos con error mapeado; adapter conserva `markdownBody` y los perfiles.
- **Admin**: `ResourceDetail` renderiza datos estructurados + cuerpo Markdown; crear/editar/consultar un
  perfil por entorno; actualizar otro campo no borra perfiles existentes; la lista muestra tipo/proveedor/
  entornos; estados de error de validación visibles y sin filtrar.
- **Revisión visual local (Commit Gate)**: flujo crear→editar→consultar, render del cuerpo, rechazo con
  error, en light/dark y desktop/móvil; capturas antes de pedir aprobación.
- **Regresión**: suites de CLI (Core), admin-server y Admin sin regresiones.

## Definition of Done

Vista del recurso muestra información completa: datos estructurados primero + cuerpo Markdown renderizado;
perfiles de conexión no secretos por entorno e interfaz, con campos opcionales según el tipo; Admin permite
crear/editar/consultar esos perfiles; modelo/contrato/adapter/tipos extendidos y backward-compatible (los
recursos existentes no se rompen); validación que **rechaza con error claro** los valores con pinta de
secreto, sin revelarlos ni descartarlos en silencio; fuente de verdad única en `knowledge/tech/resources/`
(sin copia en Admin); lista con tipo/proveedor/entornos; ninguna conexión real al sistema; light/dark y
responsive validados; tests en Core/admin-server/Admin; documentación del Resource Contract actualizada,
incluidos versionado y riesgos de exportación OKF. **Commit Gate** respetado.

## Guiding principle

Un recurso solo es útil si se puede entender de un vistazo: qué es, dónde vive y cómo se accede a él —
sin exponer secretos. Admin debe mostrar la configuración no secreta del recurso, no esconderla.

## Learning

El problema tenía dos capas y la de mayor impacto fue la más barata: `ResourceDetail` ya **recibía**
`markdownBody` desde la API pero nunca lo renderizaba. Añadir una sección "Full document" con el
`MarkdownRenderer` compartido (WI-067) hizo visible, sin tocar el backend, todo lo que los autores ya
escribían en prosa (endpoints, boundaries). Lección: antes de modelar campos nuevos, comprobar qué dato
**ya viaja** por la pila y no se muestra.

La capa estructurada —perfiles de conexión por entorno e interfaz, con coordenadas como pares clave/valor
opcionales por tipo— se resolvió con **parsing laxo** (coherente con el resto del Resource Contract) y una
**frontera de seguridad en dos tiempos**: en **escritura** se *rechaza con error* (no se descarta en
silencio) cualquier coordenada con pinta de credencial, y el mensaje nombra el campo y el entorno pero
**nunca el valor**; en **lectura** se *redacta* defensivamente una coordenada sensible escrita a mano, para
que la UI jamás la muestre. Separar "rechazo en write" de "redacción en read" fue clave: el write protege
el conocimiento canónico; el read protege la pantalla aunque alguien edite el Markdown a mano. La heurística
combina nombres de clave (`password`/`token`/`api_key`…) y formas de valor (AKIA/ghp_/sk-/JWT/base64 largo),
favoreciendo el falso positivo renombrable sobre la fuga.

Reutilizar la invariante ya existente (`authentication.refs` solo nombres) mantuvo un único mensaje de
seguridad coherente. Propagar el campo por la pila (Core → schema zod → adapter → tipos cliente → vista)
fue mecánico porque el contrato ya convergía en `resource-write.ts`. Para AC-15, el editor **recarga y
reenvía** los perfiles existentes en cada guardado, de modo que editar otro campo nunca los pierde; los
valores limpios hacen round-trip idempotente. La fuente de verdad sigue siendo el Markdown en
`knowledge/tech/resources/` (sin copia en Admin), lo que lo hace versionable y exportable por OKF — con el
aviso documentado de que son metadatos internos de infraestructura. El Commit Gate volvió a pagar: el flujo
crear→editar→consultar y el rechazo del secreto solo se validan **viéndolos** en Admin, no compilando.
Liberado en **v3.128.0**.
