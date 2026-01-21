/**
 * PostCSS 配置
 *
 * @see https://tailwindcss.com/docs/installation/vite
 */
const isProduction = process.env.NODE_ENV === 'production';

export default {
    plugins: {
        // 自动添加浏览器前缀
        autoprefixer: {},

        // 仅在生产环境中压缩 CSS
        ...(isProduction && {
            cssnano: {
                preset: [
                    'default',
                    {
                        // 移除所有注释
                        discardComments: { removeAll: true },
                        // 规范化空白
                        normalizeWhitespace: true,
                        // 合并相同规则
                        mergeRules: true,
                        // 移除重复规则
                        discardDuplicates: true,
                    },
                ],
            },
        }),
    },
};
