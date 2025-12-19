// @ts-check
import dotenv from 'dotenv';
dotenv.config();  // 确保环境变量在配置读取前加载

import {defineConfig} from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import {extractDomains} from './src/api/utils/url';

// 配置远程图片允许的域名
const imageDomains = extractDomains(
    process.env.GHOST_URL,
    process.env.IMAGE_HOST_URL
);

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

  image: {
    domains: imageDomains,
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
