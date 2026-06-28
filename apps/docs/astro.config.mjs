import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import mermaid from 'astro-mermaid'

export default defineConfig({
  site: 'https://kaddo.trycatch.tv',
  integrations: [
    mermaid({
      theme: 'dark',
      autoTheme: true,
    }),
    starlight({
      title: 'Kaddo',
      description: 'Observable knowledge for evolving software with humans and AI.',
      logo: {
        src: './src/assets/logo-full-white.png',
        alt: 'Kaddo',
        replacesTitle: true,
      },
      favicon: '/favicon.png',
      customCss: ['./src/styles/brand.css', './src/styles/landing.css'],
      head: [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap',
          },
        },
        {
          tag: 'script',
          attrs: { src: '/mermaid-zoom.js', defer: true },
        },
        // Author/creator attribution for SEO + semantic indexing.
        {
          tag: 'meta',
          attrs: { name: 'author', content: 'Julian Dario Luna Patiño' },
        },
        {
          tag: 'meta',
          attrs: { property: 'article:author', content: 'Julian Dario Luna Patiño' },
        },
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Julian Dario Luna Patiño',
            url: 'https://kaddo.trycatch.tv/about/',
            jobTitle: 'Cloud Solutions Architect Lead',
            worksFor: { '@type': 'Organization', name: 'TryCatch.tv', url: 'https://trycatch.tv' },
            sameAs: [
              'https://github.com/judlup',
              'https://www.linkedin.com/in/judlup/',
              'https://github.com/Kaddo-kdd',
            ],
            knowsAbout: [
              'Knowledge Driven Development',
              'Software Architecture',
              'AI-assisted software development',
            ],
          }),
        },
      ],
      components: {
        Footer: './src/components/Footer.astro',
      },
      social: {
        github: 'https://github.com/Kaddo-kdd/kaddo',
      },
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        es: { label: 'Español', lang: 'es' },
      },
      sidebar: [
        {
          label: 'Start here',
          translations: { es: 'Empieza aquí' },
          items: [
            { label: 'Introduction', translations: { es: 'Introducción' }, slug: 'introduction' },
            { label: 'Getting started', translations: { es: 'Primeros pasos' }, slug: 'getting-started' },
            { label: 'Operating Moments', translations: { es: 'Momentos de operación' }, slug: 'operating-moments' },
            { label: 'Workflow', translations: { es: 'Flujo de trabajo' }, slug: 'workflow' },
            { label: 'Visual Guide', translations: { es: 'Guía visual' }, slug: 'visual-guide' },
            { label: 'Project scope', translations: { es: 'Alcance del proyecto' }, slug: 'project-scope' },
            { label: 'Knowledge Levels', translations: { es: 'Niveles de Conocimiento' }, slug: 'knowledge-levels' },
            { label: 'Context efficiency', translations: { es: 'Eficiencia de contexto' }, slug: 'token-efficiency' },
            { label: 'Knowledge Driven Development', translations: { es: 'Knowledge Driven Development' }, slug: 'knowledge-driven-development' },
            { label: 'KDD Manifesto', translations: { es: 'Manifiesto KDD' }, slug: 'manifesto' },
            { label: 'About', translations: { es: 'Acerca de' }, slug: 'about' },
          ],
        },
        {
          label: 'Use Cases',
          translations: { es: 'Casos de uso' },
          items: [
            { label: 'New project', translations: { es: 'Proyecto nuevo' }, slug: 'use-cases/new-project' },
            { label: 'Pre-AI project', translations: { es: 'Proyecto pre-IA' }, slug: 'use-cases/pre-ai-project' },
            { label: 'Legacy project', translations: { es: 'Proyecto legacy' }, slug: 'use-cases/legacy-project' },
            { label: 'Full workflow', translations: { es: 'Flujo completo' }, slug: 'use-cases/full-workflow' },
            { label: 'Examples', translations: { es: 'Ejemplos' }, slug: 'examples' },
          ],
        },
        {
          label: 'Playbook',
          translations: { es: 'Playbook' },
          items: [
            { label: 'Concepts', translations: { es: 'Conceptos' }, slug: 'playbook/concepts' },
            { label: 'Prompt Workflow', slug: 'playbook/prompt-workflow' },
            { label: 'Work Item Traceability', translations: { es: 'Trazabilidad de Work Items' }, slug: 'playbook/work-item-traceability' },
            { label: 'Examples with Other Tools', translations: { es: 'Ejemplos con otras herramientas' }, slug: 'playbook/tool-examples' },
            { label: 'Collaboration Guide', translations: { es: 'Guía de colaboración' }, slug: 'playbook/collaboration' },
          ],
        },
        {
          label: 'Commands',
          translations: { es: 'Comandos' },
          items: [
            { label: 'Overview', translations: { es: 'Resumen' }, slug: 'commands/overview' },
            { label: 'init', slug: 'commands/init' },
            { label: 'scan', slug: 'commands/scan' },
            { label: 'bootstrap', slug: 'commands/bootstrap' },
            { label: 'context', slug: 'commands/context' },
            { label: 'understand', slug: 'commands/understand' },
            { label: 'create', slug: 'commands/create' },
            { label: 'guard', slug: 'commands/guard' },
            { label: 'explain', slug: 'commands/explain' },
          ],
        },
        {
          label: 'Templates',
          translations: { es: 'Plantillas' },
          items: [
            { label: 'Overview', translations: { es: 'Resumen' }, slug: 'templates/overview' },
            { label: 'Business', translations: { es: 'Negocio' }, slug: 'templates/business' },
            { label: 'Product', translations: { es: 'Producto' }, slug: 'templates/product' },
            { label: 'Tech', translations: { es: 'Tech' }, slug: 'templates/tech' },
            { label: 'Delivery', translations: { es: 'Delivery' }, slug: 'templates/delivery' },
            { label: 'Module', translations: { es: 'Módulo' }, slug: 'templates/module' },
            { label: 'Operations', translations: { es: 'Operaciones' }, slug: 'templates/operations' },
            { label: 'Legacy', translations: { es: 'Legacy' }, slug: 'templates/legacy' },
          ],
        },
        {
          label: 'Modules',
          translations: { es: 'Módulos' },
          items: [
            { label: 'Overview', translations: { es: 'Resumen' }, slug: 'modules/overview' },
            { label: 'Agent Prompt Packs', translations: { es: 'Agentes (Prompt Packs)' }, slug: 'modules/agents' },
            { label: 'Skills', translations: { es: 'Habilidades' }, slug: 'skills' },
            { label: 'Domain Owners', translations: { es: 'Domain Owners' }, slug: 'modules/owners' },
            { label: 'Multirepo modules', translations: { es: 'Módulos multirepo' }, slug: 'modules/multirepo' },
            { label: 'Knowledge Capsules', translations: { es: 'Knowledge Capsules' }, slug: 'knowledge-capsules' },
            { label: 'Knowledge Graph Export', translations: { es: 'Exportar el grafo de conocimiento' }, slug: 'knowledge-graph-export' },
            { label: 'MCP Server', translations: { es: 'Servidor MCP' }, slug: 'mcp-server' },
            { label: 'Impact Report', translations: { es: 'Reporte de impacto' }, slug: 'impact-report' },
            { label: 'Savings Report', translations: { es: 'Reporte de ahorro' }, slug: 'savings-report' },
            { label: 'Drift Report', translations: { es: 'Reporte de drift' }, slug: 'drift-report' },
            { label: 'Open Questions Gate', translations: { es: 'Preguntas abiertas' }, slug: 'open-questions' },
            { label: 'Codex Adapter (AGENTS.md)', translations: { es: 'Adaptador Codex (AGENTS.md)' }, slug: 'codex-adapter' },
            { label: 'Claude Code Adapter (CLAUDE.md)', translations: { es: 'Adaptador Claude Code (CLAUDE.md)' }, slug: 'claude-adapter' },
            { label: 'OpenCode Adapter (AGENTS.md)', translations: { es: 'Adaptador OpenCode (AGENTS.md)' }, slug: 'opencode-adapter' },
            { label: 'Antigravity Adapter (AGENTS.md)', translations: { es: 'Adaptador Antigravity (AGENTS.md)' }, slug: 'antigravity-adapter' },
            { label: 'Custom Adapters', translations: { es: 'Adapters custom' }, slug: 'custom-adapters' },
            { label: 'Standards, security & stack', translations: { es: 'Estándares, seguridad y stack' }, slug: 'modules/global-docs' },
            { label: 'Git strategy', translations: { es: 'Estrategia de Git' }, slug: 'modules/git-strategy' },
          ],
        },
      ],
    }),
  ],
})
