// Kaddo Visual Explorer — declarative, versioned content catalog (WI-058).
//
// One source of truth for the concept gallery and the individual concept fiches, in EN and ES. Adding
// a concept = adding one entry here (+ its localized fiche pages that render <ConceptDetail>). No CMS,
// no database, no backend. Images are site assets dropped at `image` under /public; a fiche never
// duplicates the full technical documentation — it links to it.

export type Locale = 'en' | 'es'

/** Editorial navigation categories (NOT Kaddo knowledge-model categories). */
export type CategoryId = 'start' | 'manage' | 'understand' | 'integrate'

export type Localized = { en: string; es: string }

export type ConceptLink = { label: Localized; href: Localized }

export type Concept = {
  /** Stable id; also the fiche slug under /visual-guide/<id>/ and /es/visual-guide/<id>/. */
  id: string
  category: CategoryId
  title: Localized
  /** One-line description shown on the card. */
  description: Localized
  /** Plain-language explanation of what it is. */
  explanation: Localized
  /** The problem it helps solve ("What is it for?"). */
  purpose: Localized
  /** A concrete usage scenario. */
  example: Localized
  /** Command or route to get started, when applicable. */
  howToStart?: Localized
  /** Public path to the concept image (dropped in later). Rendered with a placeholder fallback. */
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
]

export function categoryLabel(id: CategoryId, lang: Locale): string {
  return (CATEGORIES.find((c) => c.id === id)?.label[lang]) ?? id
}

export const CONCEPTS: Concept[] = [
  {
    id: 'knowledge-layers',
    category: 'start',
    title: { en: 'Kaddo knowledge layers', es: 'Capas de conocimiento de Kaddo' },
    description: {
      en: 'The four macro layers Kaddo uses to frame a project under knowledge/.',
      es: 'Las cuatro capas macro con que Kaddo enmarca un proyecto bajo knowledge/.',
    },
    explanation: {
      en: 'Kaddo organizes a project as four connected layers of knowledge — Business, Product, Tech and Delivery — all living under the knowledge/ directory. Each answers one question and stays linked to the one above it, so decisions keep their why.',
      es: 'Kaddo organiza un proyecto en cuatro capas de conocimiento conectadas — Negocio, Producto, Tech y Delivery — todas bajo el directorio knowledge/. Cada una responde una pregunta y se mantiene enlazada con la de arriba, para que las decisiones conserven su porqué.',
    },
    purpose: {
      en: 'It gives a project a shared, living structure for knowledge so people and AI agents reason from the same context instead of scattered notes.',
      es: 'Da al proyecto una estructura viva y compartida para el conocimiento, de modo que personas y agentes de IA razonen desde el mismo contexto en vez de notas dispersas.',
    },
    example: {
      en: 'A new feature traces from a Business goal, down to a Product capability, a Tech decision, and the Delivery Work Items that implement it.',
      es: 'Una feature nueva se traza desde un objetivo de Negocio, baja a una capacidad de Producto, una decisión de Tech y los Work Items de Delivery que la implementan.',
    },
    howToStart: { en: 'kaddo bootstrap', es: 'kaddo bootstrap' },
    image: '/visual-explorer/knowledge-layers.png',
    alt: {
      en: 'Diagram of the four Kaddo knowledge layers: Business, Product, Tech and Delivery.',
      es: 'Diagrama de las cuatro capas de conocimiento de Kaddo: Negocio, Producto, Tech y Delivery.',
    },
    references: [
      { label: { en: 'Knowledge Driven Development', es: 'Knowledge Driven Development' }, href: { en: '/knowledge-driven-development/', es: '/es/knowledge-driven-development/' } },
      { label: { en: 'Getting started', es: 'Primeros pasos' }, href: { en: '/getting-started/', es: '/es/getting-started/' } },
    ],
    related: ['work-items', 'knowledge-graph'],
  },
  {
    id: 'work-items',
    category: 'manage',
    title: { en: 'Work Items', es: 'Work Items' },
    description: {
      en: 'The unit of change in Kaddo, from captured intent to verified completion.',
      es: 'La unidad de cambio en Kaddo, de la intención capturada a la finalización verificada.',
    },
    explanation: {
      en: 'A Work Item carries a change through an explicit lifecycle — draft, ready, in-progress, evidence, verification and completion — keeping its acceptance criteria, scope and learnings in one versioned artifact.',
      es: 'Un Work Item lleva un cambio por un lifecycle explícito — draft, ready, in-progress, evidencia, verificación y completado — conservando sus criterios de aceptación, alcance y aprendizajes en un artifact versionado.',
    },
    purpose: {
      en: 'It replaces throwaway tickets with a traceable record so a change always carries its intent, its scope and the evidence it was really done.',
      es: 'Reemplaza tickets desechables por un registro trazable, para que un cambio siempre lleve su intención, su alcance y la evidencia de que realmente se hizo.',
    },
    example: {
      en: 'You capture "add npm README sync", refine its acceptance criteria, implement it, record evidence, and verify it before marking it complete.',
      es: 'Capturas "sincronizar el README de npm", refinas sus criterios de aceptación, lo implementas, registras evidencia y lo verificas antes de marcarlo como completado.',
    },
    howToStart: { en: 'kaddo create', es: 'kaddo create' },
    image: '/visual-explorer/work-items.png',
    alt: {
      en: 'Diagram of the Kaddo Work Item lifecycle from captured intent to completion.',
      es: 'Diagrama del lifecycle de un Work Item de Kaddo, de la intención capturada al completado.',
    },
    references: [
      { label: { en: 'Work Item Traceability', es: 'Trazabilidad de Work Items' }, href: { en: '/playbook/work-item-traceability/', es: '/es/playbook/work-item-traceability/' } },
      { label: { en: 'create command', es: 'Comando create' }, href: { en: '/commands/create/', es: '/es/commands/create/' } },
    ],
    related: ['knowledge-layers', 'project-resources'],
  },
  {
    id: 'knowledge-graph',
    category: 'understand',
    title: { en: 'Knowledge Graph', es: 'Knowledge Graph' },
    description: {
      en: 'A file-based graph of how your project’s knowledge and system connect.',
      es: 'Un grafo basado en archivos de cómo se conectan el conocimiento y el sistema de tu proyecto.',
    },
    explanation: {
      en: 'Kaddo derives a lightweight graph from your knowledge artifacts — Work Items, modules, resources, decisions and their relationships — so impact and dependencies can be inspected without a database.',
      es: 'Kaddo deriva un grafo ligero de tus artifacts de conocimiento — Work Items, módulos, recursos, decisiones y sus relaciones — para inspeccionar impacto y dependencias sin una base de datos.',
    },
    purpose: {
      en: 'It lets you see how pieces connect — what a change may affect — grounded in real artifacts rather than guesswork.',
      es: 'Permite ver cómo se conectan las piezas — qué puede afectar un cambio — fundamentado en artifacts reales y no en suposiciones.',
    },
    example: {
      en: 'Before retiring a module you export the graph and inspect which Work Items and resources depend on it.',
      es: 'Antes de retirar un módulo exportas el grafo e inspeccionas qué Work Items y recursos dependen de él.',
    },
    howToStart: { en: 'kaddo graph export --scope all --format json', es: 'kaddo graph export --scope all --format json' },
    image: '/visual-explorer/knowledge-graph.png',
    alt: {
      en: 'Diagram of a Kaddo Knowledge Graph connecting Work Items, modules and resources.',
      es: 'Diagrama de un Knowledge Graph de Kaddo que conecta Work Items, módulos y recursos.',
    },
    references: [
      { label: { en: 'Knowledge Graph Export', es: 'Exportar el grafo de conocimiento' }, href: { en: '/knowledge-graph-export/', es: '/es/knowledge-graph-export/' } },
    ],
    related: ['knowledge-layers', 'project-resources'],
  },
  {
    id: 'mcp',
    category: 'integrate',
    title: { en: 'MCP server', es: 'Servidor MCP' },
    description: {
      en: 'Expose Kaddo knowledge to AI agents through the Model Context Protocol.',
      es: 'Expón el conocimiento de Kaddo a agentes de IA vía el Model Context Protocol.',
    },
    explanation: {
      en: 'The Kaddo MCP server lets MCP-connected agents read project knowledge and perform safe lifecycle transitions — reads are open, and writes follow a proposal, preview and human-confirmation contract.',
      es: 'El servidor MCP de Kaddo deja que agentes conectados por MCP lean el conocimiento del proyecto y hagan transiciones de lifecycle seguras — las lecturas son abiertas y las escrituras siguen un contrato de propuesta, vista previa y confirmación humana.',
    },
    purpose: {
      en: 'It connects your AI tools to the same knowledge the CLI uses, so agents work from real context and never change state without confirmation.',
      es: 'Conecta tus herramientas de IA con el mismo conocimiento que usa el CLI, para que los agentes trabajen con contexto real y nunca cambien el estado sin confirmación.',
    },
    example: {
      en: 'An agent reads a Work Item through MCP, proposes marking it ready, and the change applies only after you confirm.',
      es: 'Un agente lee un Work Item por MCP, propone marcarlo como ready, y el cambio se aplica solo después de que confirmas.',
    },
    image: '/visual-explorer/mcp.png',
    alt: {
      en: 'Diagram of the Kaddo MCP server connecting AI agents to project knowledge.',
      es: 'Diagrama del servidor MCP de Kaddo conectando agentes de IA con el conocimiento del proyecto.',
    },
    references: [
      { label: { en: 'MCP Server', es: 'Servidor MCP' }, href: { en: '/mcp-server/', es: '/es/mcp-server/' } },
    ],
    related: ['work-items', 'knowledge-graph'],
  },
]

export function getConcept(id: string): Concept | undefined {
  return CONCEPTS.find((c) => c.id === id)
}

export function conceptsByCategory(category: CategoryId): Concept[] {
  return CONCEPTS.filter((c) => c.category === category)
}
