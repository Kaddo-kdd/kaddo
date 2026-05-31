import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://kaddo.trycatch.tv',
  integrations: [
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
      ],
      social: {
        github: 'https://github.com/judlup/kaddo',
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
            { label: 'Workflow', translations: { es: 'Flujo de trabajo' }, slug: 'workflow' },
            { label: 'Project scope', translations: { es: 'Alcance del proyecto' }, slug: 'project-scope' },
            { label: 'Knowledge Levels', translations: { es: 'Niveles de Conocimiento' }, slug: 'knowledge-levels' },
            { label: 'KDD Manifesto', translations: { es: 'Manifiesto KDD' }, slug: 'manifesto' },
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
          ],
        },
        {
          label: 'Commands',
          translations: { es: 'Comandos' },
          items: [
            { label: 'Overview', translations: { es: 'Resumen' }, slug: 'commands/overview' },
            { label: 'init', slug: 'commands/init' },
            { label: 'scan', slug: 'commands/scan' },
            { label: 'context', slug: 'commands/context' },
            { label: 'understand', slug: 'commands/understand' },
            { label: 'create', slug: 'commands/create' },
            { label: 'guard', slug: 'commands/guard' },
            { label: 'explain', slug: 'commands/explain' },
          ],
        },
        {
          label: 'Modules',
          translations: { es: 'Módulos' },
          items: [
            { label: 'Overview', translations: { es: 'Resumen' }, slug: 'modules/overview' },
            { label: 'Agent Prompt Packs', translations: { es: 'Agentes (Prompt Packs)' }, slug: 'modules/agents' },
            { label: 'Domain Owners', translations: { es: 'Domain Owners' }, slug: 'modules/owners' },
            { label: 'Multirepo', slug: 'modules/multirepo' },
          ],
        },
      ],
    }),
  ],
})
