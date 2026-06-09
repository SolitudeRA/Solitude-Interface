export interface BasePost {
    id: string;
    slug?: string;
    title: string;
    url: URL;
    feature_image: URL;
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
    logo: URL;
    icon: URL;
    cover_image: URL;
    twitter: string;
    timezone: string;
    navigation?: SiteNavigation[];
}

export interface SiteNavigation {
    label: string;
    url: URL;
}
