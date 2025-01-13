// @ts-check
import {defineConfig} from 'astro/config';

import tailwind from '@astrojs/tailwind';

import react from '@astrojs/react';

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
    integrations: [tailwind(), react()],
});