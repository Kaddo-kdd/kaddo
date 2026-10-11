// Kaddo Visual Explorer — declarative, versioned content catalog (WI-058).
//
// One source of truth for the concept gallery and the individual concept fiches, in EN and ES. Adding
// a concept = adding one entry here (+ its localized fiche pages that render <ConceptDetail>). No CMS,
// no database, no backend. Images are site assets under /public/visual-explorer; a fiche never
// duplicates the full technical documentation — it links to it. Cards are conceptual illustrations,
// never product screenshots, and illustrative numbers inside an image are not measured metrics.

export type Locale = 'en' | 'es'

/** Editorial navigation categories (NOT Kaddo knowledge-model categories). */
export type CategoryId = 'start' | 'manage' | 'understand' | 'integrate' | 'compare'

export type Localized = { en: string; es: string }

export type ConceptLink = { label: Localized; href: Localized }

export type Concept = {
  /** Stable id; also the fiche slug under /visual-guide/<id>/ and /es/visual-guide/<id>/. */
  id: string
  category: CategoryId
  title: Localized
  description: Localized
  explanation: Localized
  purpose: Localized
  example: Localized
  howToStart?: Localized
  /** Public path to the concept image. Rendered with a placeholder fallback when absent. */
  image: string
  alt: Localized
  /** Links to existing technical docs / blog — only real, existing pages. */
  references: ConceptLink[]
  /** Ids of related concepts (must exist in this catalog). */
  related: string[]
}

export const CATEGORIES: { id: CategoryId; label: Localized }[] = [
  { id: 'start', label: { en: 'Start with Kaddo', es: 'Empieza con Kaddo' } },
  { id: 'manage', label: { en: 'Manage development', es: 'Gestiona el desarrollo' } },
  { id: 'understand', label: { en: 'Understand your system', es: 'Comprende tu sistema' } },
  { id: 'integrate', label: { en: 'Integrate, protect & measure', es: 'Integra, protege y mide' } },
  { id: 'compare', label: { en: 'Compare Kaddo', es: 'Compara Kaddo' } },
]

export function categoryLabel(id: CategoryId, lang: Locale): string {
  return (CATEGORIES.find((c) => c.id === id)?.label[lang]) ?? id
}

const IMG = '/visual-explorer'

export const CONCEPTS: Concept[] = [
  // --- Start with Kaddo ---
  {
    id: 'knowledge-layers', category: 'start',
    title: { en: 'Kaddo knowledge layers', es: 'Capas de conocimiento de Kaddo' },
    description: { en: 'The four macro layers Kaddo uses to frame a project under knowledge/.', es: 'Las cuatro capas macro con que Kaddo enmarca un proyecto bajo knowledge/.' },
    explanation: { en: 'Kaddo organizes a project as four connected layers — Business, Product, Tech and Delivery — all under knowledge/. Each answers one question and stays linked to the one above it, so decisions keep their why.', es: 'Kaddo organiza un proyecto en cuatro capas conectadas — Negocio, Producto, Tech y Delivery — todas bajo knowledge/. Cada una responde una pregunta y se enlaza con la de arriba, para que las decisiones conserven su porqué.' },
    purpose: { en: 'It gives a project a shared, living structure for knowledge so people and AI agents reason from the same context.', es: 'Da al proyecto una estructura viva y compartida para el conocimiento, de modo que personas y agentes razonen desde el mismo contexto.' },
    example: { en: 'A feature traces from a Business goal down to a Product capability, a Tech decision and the Delivery Work Items that implement it.', es: 'Una feature se traza desde un objetivo de Negocio hasta una capacidad de Producto, una decisión de Tech y los Work Items de Delivery que la implementan.' },
    howToStart: { en: 'kaddo bootstrap', es: 'kaddo bootstrap' },
    image: `${IMG}/knowledge-layers.png`,
    alt: { en: 'Conceptual illustration of the four Kaddo knowledge layers.', es: 'Ilustración conceptual de las cuatro capas de conocimiento de Kaddo.' },
    references: [
      { label: { en: 'Knowledge Driven Development', es: 'Knowledge Driven Development' }, href: { en: '/knowledge-driven-development/', es: '/es/knowledge-driven-development/' } },
      { label: { en: 'Getting started', es: 'Primeros pasos' }, href: { en: '/getting-started/', es: '/es/getting-started/' } },
    ],
    related: ['knowledge-levels', 'knowledge-graph'],
  },
  {
    id: 'knowledge-levels', category: 'start',
    title: { en: 'Knowledge levels', es: 'Niveles de conocimiento' },
    description: { en: 'Different tasks need different depths of context — from a file to the business.', es: 'Distintas tareas requieren distinta profundidad de contexto — del archivo al negocio.' },
    explanation: { en: 'Kaddo distinguishes levels of knowledge — Local (file/function/component), Module (rules and dependencies), System (architecture and integrations) and Business (goal and value) — so a task pulls just the right breadth of context.', es: 'Kaddo distingue niveles de conocimiento — Local (archivo/función/componente), Módulo (reglas y dependencias), Sistema (arquitectura e integraciones) y Negocio (objetivo y valor) — para que cada tarea traiga la amplitud justa de contexto.' },
    purpose: { en: 'It keeps context proportional: narrow for a small fix, broad for a cross-cutting change — saving tokens and noise.', es: 'Mantiene el contexto proporcional: estrecho para un arreglo pequeño, amplio para un cambio transversal — ahorrando tokens y ruido.' },
    example: { en: 'A one-line bugfix only needs Local context; a new integration needs System and Business.', es: 'Un bugfix de una línea solo necesita contexto Local; una integración nueva necesita Sistema y Negocio.' },
    image: `${IMG}/knowledge-levels.webp`,
    alt: { en: 'Conceptual illustration of Kaddo knowledge levels from Local to Business.', es: 'Ilustración conceptual de los niveles de conocimiento de Kaddo, de Local a Negocio.' },
    references: [{ label: { en: 'Knowledge Levels', es: 'Niveles de Conocimiento' }, href: { en: '/knowledge-levels/', es: '/es/knowledge-levels/' } }],
    related: ['knowledge-layers', 'knowledge-graph'],
  },
  {
    id: 'pre-ai-project', category: 'start',
    title: { en: 'Pre-AI project', es: 'Proyecto Pre-IA' },
    description: { en: 'Understand and prepare an existing system before evolving it with AI.', es: 'Entiende y prepara un sistema existente antes de evolucionarlo con IA.' },
    explanation: { en: 'For an existing codebase, Kaddo scans the project, builds a context pack and recovers Business, Product and architecture knowledge, so changes start from real understanding instead of guesswork.', es: 'Para un código existente, Kaddo escanea el proyecto, construye un context pack y recupera conocimiento de Negocio, Producto y arquitectura, para que los cambios partan de comprensión real y no de suposiciones.' },
    purpose: { en: 'It turns an opaque legacy or pre-AI system into something a team and its agents can reason about safely.', es: 'Convierte un sistema legacy o pre-IA opaco en algo sobre lo que un equipo y sus agentes pueden razonar con seguridad.' },
    example: { en: 'Before adding a feature to an inherited app you run scan + context to recover how it works.', es: 'Antes de agregar una feature a una app heredada ejecutas scan + context para recuperar cómo funciona.' },
    howToStart: { en: 'kaddo scan', es: 'kaddo scan' },
    image: `${IMG}/pre-ai-project.webp`,
    alt: { en: 'Conceptual illustration of understanding a pre-AI project with Kaddo.', es: 'Ilustración conceptual de entender un proyecto pre-IA con Kaddo.' },
    references: [{ label: { en: 'Pre-AI project', es: 'Proyecto pre-IA' }, href: { en: '/use-cases/pre-ai-project/', es: '/es/use-cases/pre-ai-project/' } }],
    related: ['knowledge-layers', 'knowledge-graph'],
  },

  // --- Manage development ---
  {
    id: 'work-items', category: 'manage',
    title: { en: 'Work Items', es: 'Work Items' },
    description: { en: 'The unit of change in Kaddo, from captured intent to verified completion.', es: 'La unidad de cambio en Kaddo, de la intención capturada a la finalización verificada.' },
    explanation: { en: 'A Work Item carries a change through an explicit lifecycle — draft, ready, in-progress, evidence, verification and completion — keeping its acceptance criteria, scope and learnings in one versioned artifact.', es: 'Un Work Item lleva un cambio por un lifecycle explícito — draft, ready, in-progress, evidencia, verificación y completado — conservando sus criterios de aceptación, alcance y aprendizajes en un artifact versionado.' },
    purpose: { en: 'It replaces throwaway tickets with a traceable record so a change always carries its intent and the evidence it was really done.', es: 'Reemplaza tickets desechables por un registro trazable, para que un cambio siempre lleve su intención y la evidencia de que realmente se hizo.' },
    example: { en: 'You capture an intent, refine its acceptance criteria, implement it, record evidence, and verify it before completing.', es: 'Capturas una intención, refinas sus criterios de aceptación, la implementas, registras evidencia y la verificas antes de completar.' },
    howToStart: { en: 'kaddo create', es: 'kaddo create' },
    image: `${IMG}/work-items.webp`,
    alt: { en: 'Conceptual illustration of a Kaddo Work Item and its connections.', es: 'Ilustración conceptual de un Work Item de Kaddo y sus conexiones.' },
    references: [
      { label: { en: 'Work Item Traceability', es: 'Trazabilidad de Work Items' }, href: { en: '/playbook/work-item-traceability/', es: '/es/playbook/work-item-traceability/' } },
      { label: { en: 'create command', es: 'Comando create' }, href: { en: '/commands/create/', es: '/es/commands/create/' } },
    ],
    related: ['work-item-types', 'lifecycle-v2'],
  },
  {
    id: 'work-item-types', category: 'manage',
    title: { en: 'Types of Work Item', es: 'Tipos de Work Item' },
    description: { en: 'Feature, bugfix, tech task, research and more — each change has a type.', es: 'Feature, bugfix, tarea técnica, investigación y más — cada cambio tiene un tipo.' },
    explanation: { en: 'Work Items are typed (feature, bugfix, hotfix, spike/research, chore, deprecation…). The type shapes how the item is refined and verified, so different kinds of work follow the right path.', es: 'Los Work Items son tipados (feature, bugfix, hotfix, spike/investigación, chore, deprecación…). El tipo moldea cómo se refina y verifica el item, para que cada clase de trabajo siga el camino adecuado.' },
    purpose: { en: 'It makes intent explicit — a bug is not a feature — so expectations, scope and checks match the kind of change.', es: 'Hace explícita la intención — un bug no es una feature — para que expectativas, alcance y verificación encajen con el tipo de cambio.' },
    example: { en: 'You create a bugfix for a regression and a spike to research an unknown, each handled differently.', es: 'Creas un bugfix para una regresión y un spike para investigar una incógnita, y cada uno se maneja distinto.' },
    howToStart: { en: 'kaddo create bugfix', es: 'kaddo create bugfix' },
    image: `${IMG}/work-item-types.webp`,
    alt: { en: 'Conceptual illustration of Work Item types: feature, bug, tech task, research, deprecation.', es: 'Ilustración conceptual de tipos de Work Item: feature, bug, tarea técnica, investigación, deprecación.' },
    references: [{ label: { en: 'create command', es: 'Comando create' }, href: { en: '/commands/create/', es: '/es/commands/create/' } }],
    related: ['work-items', 'deprecation'],
  },
  {
    id: 'lifecycle-v2', category: 'manage',
    title: { en: 'Kaddo Lifecycle V2', es: 'Kaddo Lifecycle V2' },
    description: { en: 'From intent to continuous impact — a knowledge-driven, human-checked cycle.', es: 'Del intent al impacto continuo — un ciclo impulsado por conocimiento y revisado por humanos.' },
    explanation: { en: 'The lifecycle takes a change from captured intent through refinement, human review, ready, implementation handoff, human confirmation, implementation, evidence, verification, completion and learning.', es: 'El lifecycle lleva un cambio desde la intención capturada por refinement, revisión humana, ready, implementation handoff, confirmación humana, implementación, evidencia, verificación, completado y aprendizaje.' },
    purpose: { en: 'It keeps humans in control at the right gates and makes every change traceable end to end.', es: 'Mantiene a los humanos en control en los gates correctos y hace cada cambio trazable de punta a punta.' },
    example: { en: 'An intent is refined, approved, implemented, verified and closed with a recorded learning.', es: 'Una intención se refina, se aprueba, se implementa, se verifica y se cierra con un aprendizaje registrado.' },
    image: `${IMG}/lifecycle-v2.webp`,
    alt: { en: 'Conceptual illustration of the Kaddo Lifecycle V2 from intent to learning.', es: 'Ilustración conceptual del Kaddo Lifecycle V2, del intent al aprendizaje.' },
    references: [
      { label: { en: 'Workflow', es: 'Flujo de trabajo' }, href: { en: '/workflow/', es: '/es/workflow/' } },
      { label: { en: 'Operating Moments', es: 'Momentos de operación' }, href: { en: '/operating-moments/', es: '/es/operating-moments/' } },
    ],
    related: ['work-items', 'poc-mode'],
  },
  {
    id: 'poc-mode', category: 'manage',
    title: { en: 'POC Mode', es: 'Modo POC' },
    description: { en: 'Validate a hypothesis before building too much.', es: 'Valida una hipótesis antes de construir demasiado.' },
    explanation: { en: 'Proof of Concept mode orchestrates a controlled experiment — hypothesis, success criteria, minimum context, experiment, evidence and a decision (validate, reject or iterate) — instead of over-building.', es: 'El modo Proof of Concept orquesta un experimento controlado — hipótesis, criterios de éxito, contexto mínimo, experimento, evidencia y una decisión (validar, rechazar o iterar) — en vez de sobre-construir.' },
    purpose: { en: 'It gives you clarity to decide what is next, with the least effort and resources.', es: 'Te da claridad para decidir qué sigue, con el mínimo esfuerzo y recursos.' },
    example: { en: 'You test "feature X will drive Y" with a small controlled build and real evidence before scaling.', es: 'Pruebas "la feature X generará Y" con una construcción pequeña y controlada y evidencia real antes de escalar.' },
    howToStart: { en: 'kaddo poc', es: 'kaddo poc' },
    image: `${IMG}/poc-mode.webp`,
    alt: { en: 'Conceptual illustration of Kaddo POC Mode steps and outcomes.', es: 'Ilustración conceptual de los pasos y desenlaces del Modo POC de Kaddo.' },
    references: [{ label: { en: 'Proof of Concept mode', es: 'Modo Proof of Concept' }, href: { en: '/poc-mode/', es: '/es/poc-mode/' } }],
    related: ['work-items', 'lifecycle-v2'],
  },
  {
    id: 'deprecation', category: 'manage',
    title: { en: 'Controlled Deprecation', es: 'Deprecación controlada' },
    description: { en: 'Retiring legacy is a managed process, not a delete.', es: 'Retirar legacy es un proceso gestionado, no un borrado.' },
    explanation: { en: 'Controlled Deprecation plans the safe, traceable retirement of legacy functionality — identify candidates, validate real usage, map dependencies, soft-deprecate, observe and remove in order, with human-approved production runbooks.', es: 'La Deprecación controlada planifica el retiro seguro y trazable de funcionalidades legacy — identificar candidatos, validar uso real, mapear dependencias, soft-deprecate, observar y retirar en orden, con runbooks de producción aprobados por humanos.' },
    purpose: { en: 'It replaces risky deletions with an auditable workflow so retirement never surprises dependents.', es: 'Reemplaza borrados arriesgados por un flujo auditable para que el retiro nunca sorprenda a los dependientes.' },
    example: { en: 'You retire a legacy credit flow screen, endpoint and tables in dependency order, never the table first.', es: 'Retiras la pantalla, el endpoint y las tablas de un flujo legacy de créditos en orden de dependencias, nunca la tabla primero.' },
    howToStart: { en: 'kaddo deprecation create --title "…"', es: 'kaddo deprecation create --title "…"' },
    image: `${IMG}/deprecation.webp`,
    alt: { en: 'Conceptual illustration of the Kaddo controlled deprecation workflow.', es: 'Ilustración conceptual del workflow de deprecación controlada de Kaddo.' },
    references: [{ label: { en: 'Controlled Deprecation', es: 'Deprecación controlada' }, href: { en: '/deprecation/', es: '/es/deprecation/' } }],
    related: ['work-item-types', 'project-resources'],
  },

  // --- Understand your system ---
  {
    id: 'knowledge-graph', category: 'understand',
    title: { en: 'Knowledge Graph', es: 'Knowledge Graph' },
    description: { en: 'A file-based graph of how your project knowledge and system connect.', es: 'Un grafo basado en archivos de cómo se conectan el conocimiento y el sistema.' },
    explanation: { en: 'Kaddo derives a lightweight graph from your knowledge artifacts — Work Items, modules, resources, decisions and their relationships — so impact and dependencies can be inspected without a database.', es: 'Kaddo deriva un grafo ligero de tus artifacts de conocimiento — Work Items, módulos, recursos, decisiones y sus relaciones — para inspeccionar impacto y dependencias sin una base de datos.' },
    purpose: { en: 'It lets you see how pieces connect — what a change may affect — grounded in real artifacts.', es: 'Permite ver cómo se conectan las piezas — qué puede afectar un cambio — fundamentado en artifacts reales.' },
    example: { en: 'Before retiring a module you export the graph and inspect which Work Items and resources depend on it.', es: 'Antes de retirar un módulo exportas el grafo e inspeccionas qué Work Items y recursos dependen de él.' },
    howToStart: { en: 'kaddo graph export --scope all --format json', es: 'kaddo graph export --scope all --format json' },
    image: `${IMG}/knowledge-graph.webp`,
    alt: { en: 'Conceptual illustration of a Kaddo Knowledge Graph.', es: 'Ilustración conceptual de un Knowledge Graph de Kaddo.' },
    references: [{ label: { en: 'Knowledge Graph Export', es: 'Exportar el grafo de conocimiento' }, href: { en: '/knowledge-graph-export/', es: '/es/knowledge-graph-export/' } }],
    related: ['system-topology', 'project-resources'],
  },
  {
    id: 'knowledge-capsules', category: 'understand',
    title: { en: 'Knowledge Capsules', es: 'Knowledge Capsules' },
    description: { en: 'Portable, minimal context exported from a system without exposing all of it.', es: 'Contexto portable y mínimo exportado de un sistema sin exponerlo todo.' },
    explanation: { en: 'A Knowledge Capsule packages just the essential context about a system — internal repo, partner API, vendor system — so Kaddo and agents can reason about it without full access to the source.', es: 'Una Knowledge Capsule empaqueta solo el contexto esencial sobre un sistema — repo interno, API de socio, sistema de proveedor — para que Kaddo y los agentes razonen sobre él sin acceso total a la fuente.' },
    purpose: { en: 'It shares the essentials across boundaries while keeping confidential or restricted systems protected.', es: 'Comparte lo esencial entre fronteras manteniendo protegidos los sistemas confidenciales o restringidos.' },
    example: { en: 'You import a capsule describing a partner API to work against it without its private codebase.', es: 'Importas una cápsula que describe una API de socio para trabajar contra ella sin su código privado.' },
    howToStart: { en: 'kaddo capsule', es: 'kaddo capsule' },
    image: `${IMG}/knowledge-capsules.webp`,
    alt: { en: 'Conceptual illustration of Kaddo Knowledge Capsules as portable context.', es: 'Ilustración conceptual de Knowledge Capsules de Kaddo como contexto portable.' },
    references: [{ label: { en: 'Knowledge Capsules', es: 'Knowledge Capsules' }, href: { en: '/knowledge-capsules/', es: '/es/knowledge-capsules/' } }],
    related: ['knowledge-graph', 'project-resources'],
  },
  {
    id: 'project-resources', category: 'understand',
    title: { en: 'Project Resources', es: 'Project Resources' },
    description: { en: 'Connect a system’s real dependencies to the rest of the project knowledge.', es: 'Conecta las dependencias reales de un sistema con el resto del conocimiento.' },
    explanation: { en: 'Project Resources model the external systems a project depends on — databases, APIs, queues, storage, cloud services — as first-class knowledge, with access boundaries and only secret reference names, never values.', es: 'Los Project Resources modelan los sistemas externos de los que depende un proyecto — bases de datos, APIs, colas, storage, servicios cloud — como conocimiento de primera clase, con boundaries de acceso y solo nombres de referencia de secretos, nunca valores.' },
    purpose: { en: 'It ties architecture and Work Items to the real infrastructure they touch, safely and without secrets.', es: 'Ata la arquitectura y los Work Items a la infraestructura real que tocan, de forma segura y sin secretos.' },
    example: { en: 'A Work Item that changes a database links to its Project Resource and respects its production boundary.', es: 'Un Work Item que cambia una base de datos enlaza su Project Resource y respeta su boundary de producción.' },
    howToStart: { en: 'kaddo resources list', es: 'kaddo resources list' },
    image: `${IMG}/project-resources.webp`,
    alt: { en: 'Conceptual illustration of Kaddo Project Resources connecting systems and knowledge.', es: 'Ilustración conceptual de Project Resources de Kaddo conectando sistemas y conocimiento.' },
    references: [{ label: { en: 'Project Resources', es: 'Project Resources' }, href: { en: '/project-resources/', es: '/es/project-resources/' } }],
    related: ['knowledge-graph', 'deprecation'],
  },
  {
    id: 'system-topology', category: 'understand',
    title: { en: 'System Topology', es: 'System Topology' },
    description: { en: 'A semantic map of your system: entities and how they relate.', es: 'Un mapa semántico de tu sistema: entidades y cómo se relacionan.' },
    explanation: { en: 'System Topology captures the semantic shape of a system — services, data stores, external APIs, frontend modules and their relationships — proposed by an agent and confirmed by a human before Kaddo applies it.', es: 'System Topology captura la forma semántica de un sistema — servicios, data stores, APIs externas, módulos de frontend y sus relaciones — propuesta por un agente y confirmada por un humano antes de que Kaddo la aplique.' },
    purpose: { en: 'It gives impact analysis and the Knowledge Graph a grounded picture of how the system fits together.', es: 'Da al análisis de impacto y al Knowledge Graph una imagen fundamentada de cómo encaja el sistema.' },
    example: { en: 'An agent proposes the topology of an app; you confirm it and Kaddo uses it for impact analysis.', es: 'Un agente propone la topología de una app; la confirmas y Kaddo la usa para el análisis de impacto.' },
    howToStart: { en: 'kaddo topology', es: 'kaddo topology' },
    image: `${IMG}/system-topology.webp`,
    alt: { en: 'Conceptual illustration of a system topology with services and data stores.', es: 'Ilustración conceptual de una topología de sistema con servicios y data stores.' },
    references: [],
    related: ['knowledge-graph', 'project-resources'],
  },
  {
    id: 'knowledge-drift', category: 'understand',
    title: { en: 'Knowledge Drift', es: 'Knowledge Drift' },
    description: { en: 'When code, knowledge and Work Items stop agreeing.', es: 'Cuando código, conocimiento y Work Items dejan de coincidir.' },
    explanation: { en: 'Knowledge drift is the gap that grows when implementation moves ahead of its documentation, Work Items or architecture. Kaddo surfaces it so the knowledge layer can be brought back in sync.', es: 'El knowledge drift es la brecha que crece cuando la implementación se adelanta a su documentación, Work Items o arquitectura. Kaddo lo hace visible para volver a sincronizar la capa de conocimiento.' },
    purpose: { en: 'It keeps knowledge trustworthy by making divergence visible instead of silent.', es: 'Mantiene el conocimiento confiable al hacer visible la divergencia en vez de silenciosa.' },
    example: { en: 'A changed flow no longer matches its documented diagram, and the drift is flagged for review.', es: 'Un flujo cambiado ya no coincide con su diagrama documentado, y el drift se marca para revisión.' },
    howToStart: { en: 'kaddo drift', es: 'kaddo drift' },
    image: `${IMG}/knowledge-drift.webp`,
    alt: { en: 'Conceptual illustration of knowledge drift between code, docs and Work Items.', es: 'Ilustración conceptual del knowledge drift entre código, docs y Work Items.' },
    references: [{ label: { en: 'Drift Report', es: 'Reporte de drift' }, href: { en: '/drift-report/', es: '/es/drift-report/' } }],
    related: ['drift-report', 'knowledge-graph'],
  },

  // --- Integrate, protect & measure ---
  {
    id: 'mcp', category: 'integrate',
    title: { en: 'MCP server', es: 'Servidor MCP' },
    description: { en: 'Expose Kaddo knowledge to AI agents through the Model Context Protocol.', es: 'Expón el conocimiento de Kaddo a agentes de IA vía el Model Context Protocol.' },
    explanation: { en: 'The Kaddo MCP server lets MCP-connected agents read project knowledge and perform safe lifecycle transitions — reads are open, and writes follow a proposal, preview and human-confirmation contract.', es: 'El servidor MCP de Kaddo deja que agentes conectados por MCP lean el conocimiento del proyecto y hagan transiciones de lifecycle seguras — las lecturas son abiertas y las escrituras siguen un contrato de propuesta, vista previa y confirmación humana.' },
    purpose: { en: 'It connects your AI tools to the same knowledge the CLI uses, so agents work from real context and never change state without confirmation.', es: 'Conecta tus herramientas de IA con el mismo conocimiento que usa el CLI, para que los agentes trabajen con contexto real y nunca cambien el estado sin confirmación.' },
    example: { en: 'An agent reads a Work Item through MCP, proposes marking it ready, and the change applies only after you confirm.', es: 'Un agente lee un Work Item por MCP, propone marcarlo como ready, y el cambio se aplica solo tras tu confirmación.' },
    image: `${IMG}/mcp.png`,
    alt: { en: 'Conceptual illustration of the Kaddo MCP server connecting agents to knowledge.', es: 'Ilustración conceptual del servidor MCP de Kaddo conectando agentes con el conocimiento.' },
    references: [{ label: { en: 'MCP Server', es: 'Servidor MCP' }, href: { en: '/mcp-server/', es: '/es/mcp-server/' } }],
    related: ['kaddo-admin', 'knowledge-graph'],
  },
  {
    id: 'kaddo-admin', category: 'integrate',
    title: { en: 'Kaddo Admin', es: 'Kaddo Admin' },
    description: { en: 'A local UI to see and follow your project knowledge.', es: 'Una UI local para ver y seguir el conocimiento de tu proyecto.' },
    explanation: { en: 'Kaddo Admin is a local web interface that reads the same canonical knowledge as the CLI — Work Items, resources, deprecations, reports — so you can browse and track the project visually.', es: 'Kaddo Admin es una interfaz web local que lee el mismo conocimiento canónico que el CLI — Work Items, recursos, deprecaciones, reportes — para navegar y seguir el proyecto visualmente.' },
    purpose: { en: 'It makes the knowledge layer explorable for people who prefer a UI over the terminal, without a separate source of truth.', es: 'Hace explorable la capa de conocimiento para quien prefiere una UI al terminal, sin una fuente de verdad aparte.' },
    example: { en: 'You open Admin to review Work Items and follow a deprecation plan’s lifecycle.', es: 'Abres Admin para revisar Work Items y seguir el lifecycle de un plan de deprecación.' },
    howToStart: { en: 'kaddo admin', es: 'kaddo admin' },
    image: `${IMG}/kaddo-admin.webp`,
    alt: { en: 'Conceptual illustration of the Kaddo Admin interface.', es: 'Ilustración conceptual de la interfaz de Kaddo Admin.' },
    references: [{ label: { en: 'admin command', es: 'Comando admin' }, href: { en: '/commands/admin/', es: '/es/commands/admin/' } }],
    related: ['mcp', 'work-items'],
  },
  {
    id: 'guard', category: 'integrate',
    title: { en: 'Guard', es: 'Guard' },
    description: { en: 'Check whether changed code has related knowledge that was not updated.', es: 'Comprueba si el código cambiado tiene conocimiento relacionado sin actualizar.' },
    explanation: { en: 'Guard compares modified code against the knowledge artifacts that relate to it and points out what may be out of sync, so documentation and Work Items keep up with the code.', es: 'Guard compara el código modificado con los artifacts de conocimiento relacionados y señala lo que puede estar desincronizado, para que documentación y Work Items sigan al código.' },
    purpose: { en: 'It helps keep knowledge current as code changes — a signal for review, surfacing gaps rather than forcing a hard block.', es: 'Ayuda a mantener el conocimiento al día conforme cambia el código — una señal para revisar, que expone brechas en vez de imponer un bloqueo rígido.' },
    example: { en: 'You change a module and Guard notes that its documentation and owners were not touched.', es: 'Cambias un módulo y Guard advierte que su documentación y owners no se tocaron.' },
    howToStart: { en: 'kaddo guard', es: 'kaddo guard' },
    image: `${IMG}/guard.webp`,
    alt: { en: 'Conceptual illustration of Guard reviewing a change in a pipeline.', es: 'Ilustración conceptual de Guard revisando un cambio en un pipeline.' },
    references: [{ label: { en: 'guard command', es: 'Comando guard' }, href: { en: '/commands/guard/', es: '/es/commands/guard/' } }],
    related: ['knowledge-drift', 'work-items'],
  },
  {
    id: 'savings-report', category: 'integrate',
    title: { en: 'Savings Report', es: 'Reporte de ahorro' },
    description: { en: 'Estimate savings from reused context and less repeated work.', es: 'Estima el ahorro por contexto reutilizado y menos trabajo repetido.' },
    explanation: { en: 'The Savings Report estimates the value of Kaddo’s knowledge reuse — less repeated work and more efficient agent usage — from recorded impact evidence and configurable assumptions.', es: 'El Reporte de ahorro estima el valor de la reutilización de conocimiento de Kaddo — menos trabajo repetido y uso más eficiente de agentes — a partir de evidencia de impacto registrada y supuestos configurables.' },
    purpose: { en: 'It turns the knowledge layer’s benefit into a figure teams can discuss, grounded in recorded evidence and stated assumptions.', es: 'Convierte el beneficio de la capa de conocimiento en una cifra que los equipos pueden discutir, fundamentada en evidencia registrada y supuestos declarados.' },
    example: { en: 'After several Work Items you generate the report to estimate reused-context savings.', es: 'Tras varios Work Items generas el reporte para estimar el ahorro por contexto reutilizado.' },
    howToStart: { en: 'kaddo savings', es: 'kaddo savings' },
    image: `${IMG}/savings-report.webp`,
    alt: { en: 'Conceptual illustration of a Kaddo Savings Report (illustrative figures, not measured results).', es: 'Ilustración conceptual de un Reporte de ahorro de Kaddo (cifras ilustrativas, no resultados medidos).' },
    references: [{ label: { en: 'Savings Report', es: 'Reporte de ahorro' }, href: { en: '/savings-report/', es: '/es/savings-report/' } }],
    related: ['drift-report', 'work-items'],
  },
  {
    id: 'drift-report', category: 'integrate',
    title: { en: 'Drift Report', es: 'Reporte de drift' },
    description: { en: 'Track how code, knowledge, Work Items and architecture drift over time.', es: 'Sigue cómo derivan código, conocimiento, Work Items y arquitectura en el tiempo.' },
    explanation: { en: 'The Drift Report summarizes recorded drift signals across code, knowledge, Work Items and architecture and their trend, built from Guard history you record over time.', es: 'El Reporte de drift resume las señales de drift registradas en código, conocimiento, Work Items y arquitectura y su tendencia, a partir del historial de Guard que registras en el tiempo.' },
    purpose: { en: 'It makes divergence measurable and trackable so teams can act before knowledge rots.', es: 'Hace la divergencia medible y rastreable para que los equipos actúen antes de que el conocimiento se degrade.' },
    example: { en: 'You review the trend and see architecture drift rising, then schedule a sync.', es: 'Revisas la tendencia y ves subir el drift de arquitectura, y agendas una sincronización.' },
    howToStart: { en: 'kaddo drift', es: 'kaddo drift' },
    image: `${IMG}/drift-report.webp`,
    alt: { en: 'Conceptual illustration of a Kaddo Drift Report (illustrative figures, not measured results).', es: 'Ilustración conceptual de un Reporte de drift de Kaddo (cifras ilustrativas, no resultados medidos).' },
    references: [{ label: { en: 'Drift Report', es: 'Reporte de drift' }, href: { en: '/drift-report/', es: '/es/drift-report/' } }],
    related: ['knowledge-drift', 'guard'],
  },

  // --- Compare Kaddo ---
  {
    id: 'compare-bmad', category: 'compare',
    title: { en: 'Kaddo vs BMad', es: 'Kaddo vs BMad' },
    description: { en: 'Different focus: Kaddo connects knowledge and delivery; they can complement each other.', es: 'Enfoque distinto: Kaddo conecta conocimiento y delivery; pueden complementarse.' },
    explanation: { en: 'Kaddo focuses on a living knowledge layer that connects business, product, tech and delivery to evolve a system. Tools like BMad focus on an agile method to plan and build with AI. They are not the same thing and can be used together.', es: 'Kaddo se centra en una capa viva de conocimiento que conecta negocio, producto, tech y delivery para evolucionar un sistema. Herramientas como BMad se centran en un método ágil para planear y construir con IA. No son lo mismo y pueden usarse juntas.' },
    purpose: { en: 'It helps you place Kaddo next to a planning/build method and see where each adds value.', es: 'Te ayuda a ubicar Kaddo junto a un método de planeación/construcción y ver dónde aporta cada uno.' },
    example: { en: 'You use a planning method to shape stories and Kaddo to keep the knowledge and delivery traceable.', es: 'Usas un método de planeación para dar forma a las historias y Kaddo para mantener trazables el conocimiento y el delivery.' },
    image: `${IMG}/compare-bmad.webp`,
    alt: { en: 'Conceptual comparison illustration: Kaddo vs BMad.', es: 'Ilustración conceptual de comparación: Kaddo vs BMad.' },
    references: [{ label: { en: 'Examples with Other Tools', es: 'Ejemplos con otras herramientas' }, href: { en: '/playbook/tool-examples/', es: '/es/playbook/tool-examples/' } }],
    related: ['compare-gentle-ai', 'compare-graphify'],
  },
  {
    id: 'compare-gentle-ai', category: 'compare',
    title: { en: 'Kaddo vs Gentle-AI', es: 'Kaddo vs Gentle-AI' },
    description: { en: 'Different focus: Kaddo connects knowledge and delivery; they can be complementary.', es: 'Enfoque distinto: Kaddo conecta conocimiento y delivery; pueden ser complementarios.' },
    explanation: { en: 'Kaddo connects knowledge and delivery across a project. Agent-tuning tools like Gentle-AI focus on configuring and strengthening the agent you already use — memory, workflow, evidence. They are not the same thing and can be complementary.', es: 'Kaddo conecta conocimiento y delivery en un proyecto. Herramientas de agente como Gentle-AI se centran en configurar y fortalecer el agente que ya usas — memoria, workflow, evidencia. No son lo mismo y pueden ser complementarios.' },
    purpose: { en: 'It clarifies that improving your agent and building a project’s knowledge layer are different goals.', es: 'Aclara que mejorar tu agente y construir la capa de conocimiento de un proyecto son objetivos distintos.' },
    example: { en: 'You strengthen your agent with one tool and keep project knowledge and delivery in Kaddo.', es: 'Fortaleces tu agente con una herramienta y mantienes el conocimiento y el delivery del proyecto en Kaddo.' },
    image: `${IMG}/compare-gentle-ai.webp`,
    alt: { en: 'Conceptual comparison illustration: Kaddo vs Gentle-AI.', es: 'Ilustración conceptual de comparación: Kaddo vs Gentle-AI.' },
    references: [{ label: { en: 'Examples with Other Tools', es: 'Ejemplos con otras herramientas' }, href: { en: '/playbook/tool-examples/', es: '/es/playbook/tool-examples/' } }],
    related: ['compare-bmad', 'compare-graphify'],
  },
  {
    id: 'compare-graphify', category: 'compare',
    title: { en: 'Kaddo vs Graphify', es: 'Kaddo vs Graphify' },
    description: { en: 'Different focus: Kaddo connects knowledge and delivery; they can be complementary.', es: 'Enfoque distinto: Kaddo conecta conocimiento y delivery; pueden ser complementarios.' },
    explanation: { en: 'Kaddo connects knowledge and delivery across a project. Code-graph tools like Graphify focus on revealing how code and documentation are connected. They are not the same thing and can be complementary.', es: 'Kaddo conecta conocimiento y delivery en un proyecto. Herramientas de grafo de código como Graphify se centran en revelar cómo se conectan el código y la documentación. No son lo mismo y pueden ser complementarios.' },
    purpose: { en: 'It clarifies that a code graph and a project knowledge layer answer different questions.', es: 'Aclara que un grafo de código y una capa de conocimiento del proyecto responden preguntas distintas.' },
    example: { en: 'You explore code relationships with one tool and keep project knowledge and delivery in Kaddo.', es: 'Exploras relaciones de código con una herramienta y mantienes el conocimiento y el delivery del proyecto en Kaddo.' },
    image: `${IMG}/compare-graphify.webp`,
    alt: { en: 'Conceptual comparison illustration: Kaddo vs Graphify.', es: 'Ilustración conceptual de comparación: Kaddo vs Graphify.' },
    references: [{ label: { en: 'Examples with Other Tools', es: 'Ejemplos con otras herramientas' }, href: { en: '/playbook/tool-examples/', es: '/es/playbook/tool-examples/' } }],
    related: ['compare-bmad', 'compare-gentle-ai'],
  },
]

export function getConcept(id: string): Concept | undefined {
  return CONCEPTS.find((c) => c.id === id)
}

export function conceptsByCategory(category: CategoryId): Concept[] {
  return CONCEPTS.filter((c) => c.category === category)
}
