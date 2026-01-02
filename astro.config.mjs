// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { extractDomains } from './src/api/utils/url';

// 配置远程图片允许的域名
// 注意：在 astro.config.mjs 中仍需使用 process.env，
// 因为配置文件在 Astro 框架初始化前加载
// 环境变量验证由 env.schema 在构建时处理
const imageDomains = extractDomains(
    process.env.GHOST_URL,
    process.env.IMAGE_HOST_URL,
);

// https://astro.build/config
export default defineConfig({
    site: process.env.SITE_URL,

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
        },
    },

    i18n: {
        locales: ['zh', 'en', 'ja'],
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
        plugins: [tailwindcss()],
    },
});
