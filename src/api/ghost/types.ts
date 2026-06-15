export interface BasePost {
    id: string;
    slug?: string;
    title: string;
    url: URL;
    // 适配后为 URL 对象;无封面图或源 URL 畸形时为 null(消费方一律用 `?.toString()` 容错)
    feature_image: URL | null;
    primary_tag?: PostTag;
    tags?: PostTag[];
    published_at: string;
}

export interface Post extends BasePost {
    comment_id: string;
    excerpt: string;
    html: string;
    post_type: string;
    post_type_label?: string;
    post_category: string;
    post_category_label?: string;
    post_series: string;
    post_series_slug?: string;
    post_series_label?: string;
    post_series_number?: string;
    post_general_tags?: string[];
    post_general_tag_slugs?: string[];
}

export interface FeaturedPost extends BasePost {
    post_type: string;
    post_type_label?: string;
    post_category: string;
    post_category_label?: string;
    post_series: string;
    post_series_slug?: string;
    post_series_label?: string;
    post_series_number?: string;
    post_general_tags?: string[];
    post_general_tag_slugs?: string[];
}

export interface PostTag {
    slug: string;
    id: string;
    name: string;
    description?: string;
    feature_image?: string;
    url?: URL;
}

export enum PostType {
    DEFAULT = 'default',
    ARTICLE = 'article',
    MUSIC = 'music',
    VIDEO = 'video',
    GALLERY = 'gallery',
}

export interface SiteInformation {
    title: string;
    description: string;
    // Ghost Content API 返回的是字符串 URL(运行时为 string,集成测试亦断言 typeof string)
    logo: string;
    icon: string;
    cover_image: string;
    twitter: string;
    timezone: string;
    navigation?: SiteNavigation[];
}

export interface SiteNavigation {
    label: string;
    url: URL;
}
