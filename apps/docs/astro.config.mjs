import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://docs.kaddo.trycatch.tv',
  integrations: [
    starlight({
      title: 'Kaddo',
      description: 'Observable knowledge for evolving software with humans and AI.',
      logo: {
        src: './src/assets/banner.png',
        alt: 'Kaddo',
        replacesTitle: true,
      },
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
