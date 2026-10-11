---
type: feature
id: WI-058
title: 'Kaddo Visual Explorer: galería de conceptos y aprendizaje visual'
status: in-progress
work_type: feature
created_at: '2026-10-11'
source:
  type: external
  imported_at: '2026-10-11'
  source_format: markdown-frontmatter
  source_hash: 559535cdf2aa5fb3beafa4cd5a1ed97a400884611fed633284f13a0bfb115734
  inferred: false
generated_by: kaddo-admin
affected_modules: [docs]
delivery_note: >-
  Entrega por slices (decisión del usuario: "slice vertical primero"). Slice 1 entregado:
  infraestructura completa + 4 conceptos EN/ES. Restante: 11 conceptos + imágenes reales + pulido.
summary: >-
  Las personas que llegan por primera vez a Kaddo deben comprender muchos
  conceptos antes de identificar cuáles les sirven. Existe una Guía visual (solo
  diagramas Mermaid) y documentación por funcionalidades, pero no una
  experiencia de **exploración visual** para descubrir el pr…
original_snapshot:
  title: 'Kaddo Visual Explorer: galería de conceptos y aprendizaje visual'
  description: >-
    Las personas que llegan por primera vez a Kaddo deben comprender muchos
    conceptos antes de identificar cuáles les sirven. Existe una Guía visual
    (solo diagramas Mermaid) y documentación por funcionalidades, pero no una
    experiencia de **exploración visual** para descubrir el pr…
  type: feature
  status: draft
ready_at: '2026-10-11'
---

# Kaddo Visual Explorer: galería de conceptos y aprendizaje visual

## Intent

Las personas que llegan por primera vez a Kaddo deben comprender muchos conceptos antes de identificar
cuáles les sirven. Existe una Guía visual (solo diagramas Mermaid) y documentación por funcionalidades,
pero no una experiencia de **exploración visual** para descubrir el producto mediante imágenes,
explicaciones sencillas, ejemplos y rutas de aprendizaje. Implementar **Kaddo Visual Explorer**: una
galería visual integrada en la documentación (`apps/docs`, Astro Starlight) que permita descubrir,
comprender y consultar los conceptos de Kaddo sin conocimientos previos, con una única fuente de verdad
técnica (las fichas enlazan a la documentación existente, no la duplican).

## Scope

1. **Evolucionar la Guía visual** — reutilizar `/visual-guide/` y `/es/visual-guide/` como punto de
   entrada. Introducción + categorías + galería de tarjetas. Conservar los diagramas Mermaid actuales en
   una sección "Diagramas técnicos" (no eliminar contenido ni romper enlaces). Nombre en nav:
   "Explore Kaddo" (EN) / "Explora Kaddo" (ES) si es compatible con la organización actual.
2. **Galería de conceptos** — tarjetas con imagen, título, descripción breve y categoría; responsive
   (escritorio y móvil); filtros por categoría + búsqueda simple por nombre/palabras; vista de todos los
   conceptos; estado vacío comprensible. Jerarquía visual clara con la identidad de Kaddo; no una lista
   de enlaces ni infografías sin contexto.
3. **Ficha individual por concepto** — URL propia y permanente (p. ej. `/es/visual-guide/work-items/`).
   Contiene: nombre + descripción sencilla; imagen ampliable; "¿Para qué sirve?"; "Ejemplo de uso";
   "¿Cómo empezar?" (comando/ruta cuando aplique); Referencias (doc técnica y artículo, solo si existen);
   Conceptos relacionados (enlaces a otras fichas). No duplica el contenido técnico completo.
4. **Organización del contenido** (4 categorías editoriales de navegación, NO categorías del modelo de
   conocimiento):
   - Empieza con Kaddo: capas de conocimiento, niveles de conocimiento, estados New/Pre-IA/Legacy.
   - Gestiona el desarrollo: Work Items, Lifecycle V2, POC Mode, gestión de cambios.
   - Comprende tu sistema: Knowledge Graph, Knowledge Capsules, Project Resources, módulos y relaciones.
   - Integra, protege y mide: MCP, agentes y skills, Guard, Admin y seguimiento.
5. **Catálogo inicial** — ≥15 conceptos completos en la primera entrega: (1) Capas de conocimiento,
   (2) Niveles de conocimiento, (3) Proyectos New, (4) Proyectos Pre-IA, (5) Proyectos Legacy,
   (6) Work Items, (7) Lifecycle V2, (8) Knowledge Capsules, (9) Knowledge Graph, (10) Project Resources,
   (11) MCP, (12) Agentes y Skills, (13) Guard, (14) POC Mode, (15) Kaddo Admin. Dejar la estructura
   preparada para añadir después: tipos de Work Items, deprecación, Knowledge Drift, System Topology,
   Savings/Drift/Performance Report y comparaciones, previa validación de estado y documentación.
6. **Integración con la documentación** — cada ficha enlaza explícitamente a las páginas técnicas
   existentes (sin versiones independientes de la explicación). Accesos a Visual Explorer desde la
   página principal, Getting Started y la navegación. Evaluar enlaces desde páginas técnicas hacia su
   ficha visual. Los artículos de blog son complementarios y opcionales.
7. **Gestión del contenido** — catálogo **declarativo y versionado** en `apps/docs` (sin CMS, base de
   datos ni backend). Cada concepto: id estable, slugs localizados, categoría, título, descripción,
   explicación, ejemplo, referencia a imagen, alt text, enlaces y relaciones. Componente de tarjeta
   reutilizable + plantilla común de ficha (añadir un concepto no debe duplicar componentes ni editar la
   navegación en varios lugares). Imágenes como assets del sitio, optimizadas. Paleta oficial: azul
   noche `#141B2D`, ámbar `#F4B942`, blanco cálido `#F8F6F0`, negro suave `#232122`, gris técnico
   `#6B7280`.
8. **Exactitud del contenido** — verificar que cada imagen representa el comportamiento ACTUAL de Kaddo.
   Las imágenes conceptuales no se confunden con capturas reales; no presentar métricas ilustrativas como
   medidas; no representar a Kaddo como ejecutor autónomo; no mostrar Guard como bloqueo obligatorio si no
   lo es. Distinguir capacidades implementadas / ejemplos conceptuales / funcionalidades futuras; no
   describir como estable lo que no está disponible o documentado. Revisar el contenido contra la
   documentación y capacidades existentes.
9. **Idiomas, accesibilidad y SEO** — EN y ES con la estructura localizada de Starlight. Cada ficha con
   título/descripción para indexación, URL permanente y enlaces internos (sin keyword stuffing). Alt text
   descriptivo, carga optimizada, ampliación accesible. Galería navegable por teclado, contraste
   suficiente, correcta en pantallas pequeñas. Sin dependencias pesadas ni solicitudes de red
   innecesarias para filtros/navegación.

## Out of scope / no objetivos

No modificar CLI, Core, MCP, Admin ni el modelo de conocimiento de los proyectos. No crear
autenticación, CMS, editor de imágenes, analíticas nuevas, contribuciones desde la web ni cursos
interactivos. No convertir cada concepto en un tutorial completo ni **generar contenido automáticamente
con LLM** (contenido curado, revisado y versionado). Comparaciones con terceros: posibles después, como
contenido editorial sustentado en documentación verificable.

## Acceptance criteria

- [ ] AC-01 — Punto de entrada: `/visual-guide/` y `/es/visual-guide/` muestran la nueva galería; la navegación y enlaces previos a la Guía visual siguen funcionando.
- [ ] AC-02 — Catálogo inicial: ≥15 conceptos publicados, cada uno con imagen, título, descripción, categoría y ficha individual funcional.
- [ ] AC-03 — Exploración: filtrar por categoría, buscar de forma sencilla y volver al catálogo sin perder contexto.
- [ ] AC-04 — Ficha individual: explicación accesible, ejemplo concreto, imagen correspondiente y enlaces válidos para continuar.
- [ ] AC-05 — Navegación relacionada: fichas enlazan conceptos relacionados y documentación/artículos existentes; sin enlaces vacíos o ficticios.
- [ ] AC-06 — Contenido verificable: descripciones/ejemplos/imágenes contrastados con lo implementado; representaciones conceptuales diferenciadas de interfaces/métricas reales.
- [ ] AC-07 — Compatibilidad: no elimina los diagramas Mermaid ni rompe rutas de Guía visual, Getting Started o referencias internas.
- [ ] AC-08 — Localización: catálogo, fichas y navegación en EN y ES, sin mezclar traducciones en una misma página.
- [ ] AC-09 — Accesibilidad y responsive: tarjetas/filtros/imágenes/enlaces por teclado y en móvil; alt text adecuado.
- [ ] AC-10 — Mantenibilidad: un concepto nuevo se incorpora con contenido declarativo + assets, sin copiar toda la implementación visual.
- [ ] AC-11 — Integración: acceso visible desde la página principal y Getting Started; la navegación refleja el nuevo espacio.
- [ ] AC-12 — Validación técnica: `pnpm --filter @kaddo/docs build` termina OK; rutas/imágenes/enlaces verificados; sin regresiones en páginas existentes.

## Definition of Done

Una persona sin experiencia previa entra desde la página principal, explora las categorías, abre una
imagen, comprende qué problema resuelve el concepto, identifica un ejemplo y llega a la documentación
técnica, sin orientación adicional. Evidencia: build exitoso, validación de rutas/enlaces, revisión
responsive y confirmación de que la Guía visual técnica (Mermaid) sigue accesible; galería EN/ES, fichas
individuales, catálogo versionado, assets optimizados y documentación de cómo añadir conceptos.

## Implementation handoff guidance

1. Inspeccionar `apps/docs`: Guía visual actual, componentes Astro, configuración de navegación
   (`astro.config.mjs`), convenciones de imágenes (`apps/docs/src/assets`) y páginas de documentación de
   referencia. 2. Definir el **contrato de contenido** del concepto y la estructura de URLs. 3. Construir
   componentes reutilizables de galería y detalle sobre Astro Starlight, respetando el diseño. 4.
   Incorporar las 15 fichas, validar imágenes, revisar enlaces, integrar accesos desde home y Getting
   Started. 5. Cerrar con build, navegación, accesibilidad, visualización móvil y revisión editorial
   EN/ES. Terminar con `pnpm --filter @kaddo/docs build`.

## Riesgo / dependencia conocida

La "colección de imágenes conceptuales" que el spec asume reutilizar **no está en el repositorio** (solo
hay logos/banner en `apps/docs/src/assets`). Antes de publicar fichas con imagen hay que resolver el
origen de los visuales (proveerlos, o usar visuales vectoriales/diagramas por concepto claramente
marcados como conceptuales), sin inventar capturas ni generar contenido por LLM.

## Relación

Docs-only (NO bump/tag por la regla del proyecto). Evoluciona la Guía visual existente; enlaza a la
documentación técnica ya publicada (incluida Controlled Deprecation).

## Progreso — Slice 1 (infraestructura + 4 conceptos)

Decisión del usuario: entregar un **slice vertical primero** y ampliar luego a los 15 conceptos; las
imágenes reales las aportará el usuario después (se dejaron slots con ruta definida + placeholder de
marca con fallback automático).

Entregado y verificado con `pnpm --filter @kaddo/docs build` (217 páginas, sin errores ni regresiones):

- **Contrato de contenido declarativo** `apps/docs/src/data/visual-explorer.ts` (bilingüe EN/ES,
  tipado) + README de autoría `visual-explorer.README.md`.
- **Componentes reutilizables**: `ConceptGallery.astro` (filtros por categoría + búsqueda, JS vanilla
  sin deps, estado vacío, responsive, paleta oficial), `ConceptCard.astro`, `ConceptDetail.astro`
  (imagen ampliable + fallback placeholder).
- **Galería en `/visual-guide/`** (EN) y `/es/visual-guide/` (ES) como `.mdx` ("Explore Kaddo" /
  "Explora Kaddo").
- **Mermaid conservados** en `/visual-guide/diagrams/` (movidos con `git mv`, contenido intacto; 31
  bloques mermaid presentes en el build) — AC-07.
- **4 conceptos** completos EN/ES con ficha propia: knowledge-layers, work-items, knowledge-graph, mcp
  (uno por categoría).
- **Navegación**: label "Explore Kaddo"/"Explora Kaddo" + "Technical diagrams"/"Diagramas técnicos".
- **Integración**: acceso desde la home (acción del hero) y Getting Started (EN/ES).
- **Imágenes**: `apps/docs/public/visual-explorer/` con README y convención `<id>.png`; placeholder de
  marca hasta que existan.

Verificación estructural del build: 4 `ve-card` EN + 4 ES, chips de filtro, `ve-thumb-ph` (fallback),
rutas EN/ES de galería, diagramas y fichas presentes en `dist/`. No se arrancó el browser por
presupuesto de sesión (mismo criterio que WI-056/057).

### Restante (siguientes slices)

- 11 conceptos: niveles de conocimiento, New/Pre-IA/Legacy, Lifecycle V2, Knowledge Capsules, Project
  Resources, Agentes y Skills, Guard, POC Mode, Kaddo Admin (y preparar deprecación, Drift, Topology,
  reports, comparaciones).
- Imágenes reales (las aporta el usuario) y revisión editorial/accesibilidad final en ambos idiomas.
- Enlaces desde páginas técnicas hacia su ficha visual (opcional, AC-05/06 refuerzo).
