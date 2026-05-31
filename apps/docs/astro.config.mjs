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
      customCss: ['./src/styles/brand.css'],
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
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Introduction', slug: 'introduction' },
            { label: 'Getting started', slug: 'getting-started' },
            { label: 'Knowledge Levels', slug: 'knowledge-levels' },
          ],
        },
        {
          label: 'Commands',
          items: [
            { label: 'Overview', slug: 'commands/overview' },
            { label: 'init', slug: 'commands/init' },
            { label: 'scan', slug: 'commands/scan' },
            { label: 'create', slug: 'commands/create' },
            { label: 'guard', slug: 'commands/guard' },
            { label: 'explain', slug: 'commands/explain' },
          ],
        },
        {
          label: 'Modules',
          items: [
            { label: 'Overview', slug: 'modules/overview' },
            { label: 'Domain Owners', slug: 'modules/owners' },
            { label: 'Multirepo', slug: 'modules/multirepo' },
          ],
        },
      ],
    }),
  ],
})
