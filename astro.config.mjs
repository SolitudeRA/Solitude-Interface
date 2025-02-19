// @ts-check
import {defineConfig} from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.solitudera.com',

  i18n: {
      locales: ['zh', 'en', 'ja'],
      defaultLocale: 'zh',
      routing: {
          prefixDefaultLocale: false,
      },
  },

  prefetch: true,
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});