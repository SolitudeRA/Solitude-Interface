/**
 * 统一的缓存键定义(单一来源)。
 *
 * 集中定义,避免缓存键字符串散落在各处难以排查、易拼写漂移、未来易键冲突。
 * 注:此处保持与历史一致的键字符串(`all_posts:…` / `site_information:…` 等),
 * 仅做集中化;键的具体命名是历史约定,改名需同步更新相关断言。
 * 缓存本体见 @api/utils/cache(构建时全局 Map)。
 */
export const CACHE_KEYS = {
    /** 站点信息(按请求字段区分) */
    siteInformation: (fields: string) => `site_information:${fields}`,
    /** 精选/高亮文章 */
    featuredPosts: (limit: number, fields: string, include: string) =>
        `featured_posts:${limit}:${fields}:${include}`,
    /** 按语言分页的文章列表 */
    postsByLocale: (locale: string, page: number, limit: number) =>
        `posts_by_locale:${locale}:${page}:${limit}`,
    /** 指定翻译组 + 语言的单篇 */
    postByGroup: (key: string, locale: string) => `post_by_group:${key}:${locale}`,
    /** 指定翻译组的全部语言变体 */
    variantsByGroup: (key: string) => `variants_by_group:${key}`,
    /** 全部翻译组 key */
    allGroupKeys: () => `all_group_keys`,
    /** 全部文章(按 include 区分) */
    allPosts: (include: string) => `all_posts:${include}`,
    /** 视图用文章列表(分页或全量) */
    allPostsView: (page: number | undefined, limit: number) =>
        `all_posts_view:${page ?? 'all'}:${limit}`,
    /** 翻译组索引(key → 各语言变体) */
    postIndexByGroup: () => `post_index_by_group`,
} as const;
