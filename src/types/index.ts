/**
 * 全局类型定义
 *
 * API 相关类型请从 @api/ghost/types 导入
 * 例如: import type { Post, FeaturedPost } from '@api/ghost/types';
 */

// 通用工具类型
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// 通用响应类型
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

// 分页相关类型
export interface PaginationMeta {
    page: number;
    limit: number;
    pages: number;
    total: number;
    prev: number | null;
    next: number | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

// 主题类型
export type Theme = 'light' | 'dark';

// 导航项类型
export interface NavItem {
    label: string;
    href: string;
    icon?: string;
    isExternal?: boolean;
}
