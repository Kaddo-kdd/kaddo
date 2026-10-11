---
type: feature
id: WI-059
title: Unified Visual Experience & Brand Identity
status: completed
work_type: feature
created_at: '2026-10-11'
source:
  type: external
  imported_at: '2026-10-11'
  source_format: markdown-frontmatter
  source_hash: 1fe4a56ea2d04ce71b876e27c573106bd89b1f0624627eb58b61b91c584353cd
  inferred: false
generated_by: kaddo-admin
affected_modules: []
summary: >-
  Unificar y elevar la identidad visual de Kaddo para que Website, Blog,
  documentación y Admin se sientan parte de un mismo ecosistema — minimalista,
  tecnológico y moderno — sin perder propósito ni usabilidad ni modificar
  innecesariamente el comportamiento funcional. Inspirado e…
original_snapshot:
  title: Unified Visual Experience & Brand Identity
  description: >-
    Unificar y elevar la identidad visual de Kaddo para que Website, Blog,
    documentación y Admin se sientan parte de un mismo ecosistema — minimalista,
    tecnológico y moderno — sin perder propósito ni usabilidad ni modificar
    innecesariamente el comportamiento funcional. Inspirado e…
  type: feature
  status: draft
---

# Unified Visual Experience & Brand Identity

## Intent

Unificar y elevar la identidad visual de Kaddo para que Website, Blog, documentación y Admin se sientan
parte de un mismo ecosistema — minimalista, tecnológico y moderno — sin perder propósito ni usabilidad
ni modificar innecesariamente el comportamiento funcional. Inspirado en el kit de marca y referencias
suministradas, conservando: fondos blancos cálidos, azul noche principal + ámbar acento, ilustraciones
isométricas con profundidad y nodos/líneas ámbar, tarjetas con bordes redondeados y jerarquía
tipográfica clara, y representación visual de conocimiento conectado, arquitectura y observabilidad.

## Restricción obligatoria (Sección 7) — NO commit sin aprobación

**Requisito de aceptación, no omitible.** Al terminar la implementación, el agente DEBE detenerse antes
de cualquier `git commit`/`push`. Debe: levantar las apps localmente, informar URLs/puertos/pasos,
permitir la revisión del usuario, presentar capturas (incl. responsive), entregar un resumen de cambios
+ validaciones + limitaciones, y **solicitar confirmación explícita** para commitear. Prohibido:
`git commit`/`push`/release/deploy sin autorización específica; interpretar pruebas exitosas como
aprobación; asumir que completar el WI autoriza el commit; cerrar como aprobado sin confirmación. Los
cambios pueden permanecer en el working tree durante la revisión. Si se piden ajustes, re-implementar y
re-visualizar antes de pedir nueva aprobación. El push/deploy requiere autorización independiente.

## Scope

1. **Design Foundation** — auditar estilos/componentes/tokens existentes antes de crear nuevos.
   Formalizar tokens: Night Blue `#141B2D`, Amber `#F4B942`, Warm White `#F8F6F0`, Soft Black `#232122`,
   Technical Gray `#6B7280`; tipografía Display Poppins ExtraBold, UI/Body Inter Regular/SemiBold; más
   sombras, radios, espaciados, estados, divisores, iconografía y superficies. Componentes reutilizables
   documentados. No duplicar tokens/componentes ya existentes y extensibles.
2. **Website** (apps/docs) — hero con jerarquía clara (mensaje/propuesta/CTA), ilustraciones isométricas
   consistentes, mejor presentación de capacidades/beneficios/casos, unificar tarjetas/botones/secciones/
   nav, continuidad visual landing↔docs↔recursos. Conservar rutas, contenido, SEO y multilenguaje. Evitar
   que la landing parezca una colección de tarjetas sin narrativa.
3. **Blog** (apps/docs) — experiencia editorial técnica: rediseñar índice y tarjetas, sistema reutilizable
   de portadas por concepto/categoría (16:9), tipografía/legibilidad/jerarquía, etiquetas/metadatos/
   relacionados estandarizados. Compatibilidad con el sistema de publicación actual. Ilustraciones que
   expliquen conceptos, no solo decorativas.
4. **Admin** (packages/admin) — sidebar azul noche con selección clara, superficies limpias, tarjetas
   consistentes, badges/tablas/formularios/acciones armonizados, jerarquía de métricas, coherencia en
   Knowledge/Work Items/Project Resources/System Explorer/reportes/módulos, estados loading/empty/
   success/warning/error diferenciados. Preservar flujos/permisos/operaciones/lógica. **Métricas con
   datos reales; no introducir datos simulados como resultados del sistema.**
5. **Sistema de ilustraciones** — isometría suave con profundidad controlada, bloques/módulos/superficies
   flotantes, nodos/líneas ámbar, iconografía simplificada geométrica, iluminación cálida/sombras
   sutiles, espacio negativo. Isotipo fiel a la marca (no reinterpretar el logo con generativos).
   Distinguir **ilustraciones conceptuales** (páginas/portadas/explicativas) de **componentes operativos**
   (Admin/diagramas/reportes, legibilidad y precisión). No convertir todo en 3D.

## Requisitos técnicos y de calidad

Respetar arquitectura/tecnologías actuales; reutilizar estilos/tokens/componentes; responsive (móvil/
tablet/desktop); contraste y accesibilidad WCAG AA; prefers-reduced-motion; optimizar imágenes/fuentes;
no degradar rendimiento/Core Web Vitals; no nuevas dependencias sin justificación; conservar
funcionalidades; no modificar contratos de API/estructura de datos/lógica salvo necesidad demostrada y
autorizada; mantener temas visuales existentes ajustándolos coherentemente.

## Out of scope

Rediseñar el logo oficial; reestructurar lógica funcional; nuevas capacidades de negocio; modificar
contratos de API; métricas sin fuentes verificables; migraciones técnicas no relacionadas con diseño;
despliegues/publicaciones automáticos.

## Acceptance criteria

- [x] AC-01 — Página, blog y Admin usan una identidad visual coherente.
- [x] AC-02 — La identidad se ajusta al kit de marca y referencias.
- [x] AC-03 — Se mantiene correctamente el logo oficial.
- [x] AC-04 — El lenguaje gráfico refleja conocimiento conectado, arquitectura y observabilidad.
- [x] AC-05 — Los elementos isométricos no perjudican la usabilidad.
- [x] AC-06 — No hay componentes visuales innecesariamente duplicados.
- [x] AC-07 — Diseño responsive y accesible.
- [x] AC-08 — Se conservan funcionalidades, rutas y flujos.
- [x] AC-09 — No se presentan datos ficticios en vistas operativas.
- [x] AC-10 — Cambios probados y visualizados localmente.
- [x] AC-11 — Hay evidencia visual (capturas) para revisión.
- [x] AC-12 — El usuario aprobó explícitamente antes de crear el commit.

## Plan de ejecución

Fase 1 Auditoría (proyectos/componentes, design system actual, duplicados/inconsistencias, dependencias,
riesgos de regresión). Fase 2 Design Foundation (paleta/tipografía, tokens semánticos y componentes
compartidos, documentar lenguaje visual, recursos gráficos). Fase 3 Implementación (website, blog,
Admin, consistencia entre las tres). Fase 4 Verificación (ejecutar local, vistas/interacciones, móvil/
desktop, validaciones, accesibilidad/regresiones, capturas antes/después).

## Entregables

Website/Blog/Admin actualizados; Design Foundation documentado; recursos visuales reutilizables;
evidencia de pruebas y capturas comparativas; instrucciones de ejecución/revisión local; solicitud de
aprobación explícita.

## Definition of Done

Implementación "técnicamente terminada y pendiente de aprobación" cuando los cambios están desarrollados,
probados y disponibles para visualización local. Pasa a **Completed** solo cuando el usuario revisó,
aprobó, autorizó el commit y ese commit se ejecutó. Terminar la implementación NO autoriza versionar ni
publicar.

Principio final: Kaddo debe comunicar visualmente lo mismo que propone técnicamente — transformar
conocimiento disperso en contexto conectado, comprensible y accionable.

## Slice activo

**Website, Blog y Admin.** La landing bilingüe, el Blog editorial y el Admin operativo usan ahora la
misma dirección visual: fondo cálido claro, azul noche para jerarquía, ámbar para énfasis y superficies
blancas elevadas. Los datos y flujos de Admin se preservan; el cambio es de presentación.

## Nota de entrega por slices

Los assets de marca/ilustración suministrados (kit de marca, dirección visual e ilustraciones isométricas
16:9) se usan como referencia del sistema visual y se integran solamente donde ayudan a explicar un
concepto, sin introducirlos como decoración operativa.

## Cierre

El usuario revisó las aplicaciones locales y autorizó explícitamente el cierre, commit, push y merge el
2026-10-11. Se validaron `pnpm --filter @kaddo/docs build` (255 páginas),
`pnpm --filter @kaddo/admin build` y `pnpm --filter @kaddo/admin exec vitest run tests` (62 tests).
La revisión visual cubrió la landing, el índice y artículo de Blog, y el Admin en sus temas claro y
oscuro. La ejecución del comando heredado `pnpm --filter @kaddo/admin test` aún incluye por
configuración seis especificaciones Playwright de e2e en Vitest; no representa una regresión del cambio
visual ni bloquea las pruebas unitarias ejecutadas explícitamente.
