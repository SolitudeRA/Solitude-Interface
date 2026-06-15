/**
 * i18n 公共入口(barrel)。实现按职责拆分到:
 * - ./i18nCore     语言集合、UI 文案、tag/slug 身份解析(叶子)
 * - ./i18nRouting  多语言路径 / 文章详情页路径 / hreflang(依赖 core)
 * - ./i18nFiltering fallback 文案 / 多语言文章过滤(依赖 core)
 *
 * 依赖单向(core ← routing/filtering ← 本 barrel),无循环。
 * 外部统一从 `@lib/i18n` 导入即可,无需关心内部分文件。
 */
export * from './i18nCore';
export * from './i18nRouting';
export * from './i18nFiltering';
