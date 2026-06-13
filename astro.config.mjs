// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { extractDomains } from './src/api/utils/url';

// 配置远程图片允许的域名
const imageDomains = extractDomains(process.env.GHOST_URL, process.env.IMAGE_HOST_URL);

// https://astro.build/config
export default defineConfig({
    site: process.env.SITE_URL,
    devToolbar: {
        enabled: false,
    },

    env: {
        schema: {
            GHOST_URL: envField.string({ context: 'server', access: 'public' }),
            GHOST_CONTENT_KEY: envField.string({
                context: 'server',
                access: 'secret',
            }),
            GHOST_VERSION: envField.string({
                context: 'server',
                access: 'public',
                default: 'v5.0',
            }),
            GHOST_TIMEOUT: envField.number({
                context: 'server',
                access: 'public',
                default: 5000,
            }),
            SITE_URL: envField.string({ context: 'server', access: 'public' }),
            IMAGE_HOST_URL: envField.string({
                context: 'server',
                access: 'public',
                optional: true,
                default: '',
            }),
            GOOGLE_ANALYTICS_TAG_ID: envField.string({
                context: 'client',
                access: 'public',
                optional: true,
                default: '',
            }),
            CF_ACCESS_CLIENT_ID: envField.string({
                context: 'server',
                access: 'secret',
                optional: true,
                default: '',
            }),
            CF_ACCESS_CLIENT_SECRET: envField.string({
                context: 'server',
                access: 'secret',
                optional: true,
                default: '',
            }),
        },
    },

    i18n: {
        // 语言集合的单一真源是 src/lib/i18n.ts 的 LOCALES；此处顺序仅用于路由前缀、
        // 对生成站点无可观察影响，但与 LOCALES 保持一致以免困惑。
        locales: ['zh', 'ja', 'en'],
        defaultLocale: 'zh',
        routing: {
            prefixDefaultLocale: true,
        },
    },

    prefetch: true,
    integrations: [react()],

    image: {
        domains: imageDomains,
    },

    vite: {
        resolve: {
            dedupe: ['react', 'react-dom'],
        },
        // @ts-expect-error - @tailwindcss/vite uses Vite 7.x types, Astro uses Vite 6.x
        plugins: [tailwindcss()],
    },
});
