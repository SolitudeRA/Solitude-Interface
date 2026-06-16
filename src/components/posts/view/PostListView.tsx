import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@components/common/lib/utils';
import { getUIText, type Locale } from '@lib/i18n';
import {
    extractFacets,
    filterPosts,
    paginate,
    parseBrowseParams,
    type BrowsePost,
    type FacetOption,
} from '@lib/postBrowse';

/**
 * 注入岛的精简文章元数据：去掉庞大的 html，URL 一律转成字符串，
 * 字段名与 BrowsePost 对齐，故可直接喂给 filterPosts / extractFacets。
 */
export interface PostListItem extends BrowsePost {
    id: string;
    url: string;
    feature_image: string | null;
    published_at: string;
}

type PostViewKey =
    | 'galleryView'
    | 'listView'
    | 'viewAll'
    | 'category'
    | 'type'
    | 'all'
    | 'searchPlaceholder'
    | 'clear'
    | 'resultCount'
    | 'empty'
    | 'prevPage'
    | 'nextPage';

interface PostListViewProps {
    posts: PostListItem[];
    locale: Locale;
    perPage?: number;
}

const DEFAULT_PER_PAGE = 24;

interface ListFilters {
    category: string | null;
    type: string | null;
    query: string;
    page: number;
}

const INITIAL_FILTERS: ListFilters = { category: null, type: null, query: '', page: 1 };

/** 从当前 URL 读取筛选态（view 由页面脚本管理，这里忽略） */
function readFiltersFromUrl(): ListFilters {
    const state = parseBrowseParams(new URLSearchParams(window.location.search));
    return { category: state.category, type: state.type, query: state.query, page: state.page };
}

/** 写回 URL，只动自己的键，保留 view 等其它参数 */
function writeFiltersToUrl(filters: ListFilters): void {
    const params = new URLSearchParams(window.location.search);
    const set = (key: string, value: string | null) => {
        if (value && value.trim() !== '') params.set(key, value);
        else params.delete(key);
    };
    set('category', filters.category);
    set('type', filters.type);
    set('q', filters.query);
    set('page', filters.page > 1 ? String(filters.page) : null);

    const qs = params.toString();
    window.history.replaceState(
        null,
        '',
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
}

function formatDate(value: string): string {
    return value?.split('T')[0] ?? '';
}

export default function PostListView({
    posts,
    locale,
    perPage = DEFAULT_PER_PAGE,
}: PostListViewProps) {
    const [filters, setFilters] = useState<ListFilters>(INITIAL_FILTERS);

    // 挂载后从 URL 读取（深链）；SSR 用默认态，避免 hydration 不一致
    useEffect(() => {
        setFilters(readFiltersFromUrl());
        const onPopState = () => setFilters(readFiltersFromUrl());
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const facets = useMemo(() => extractFacets(posts), [posts]);

    const filtered = useMemo(
        () =>
            filterPosts(posts, {
                category: filters.category,
                type: filters.type,
                query: filters.query,
            }),
        [posts, filters.category, filters.type, filters.query]
    );

    const pageResult = useMemo(
        () => paginate(filtered, filters.page, perPage),
        [filtered, filters.page, perPage]
    );

    // 筛选变化导致当前页越界时，夹回到合法页
    useEffect(() => {
        if (pageResult.page !== filters.page) {
            setFilters((prev) => ({ ...prev, page: pageResult.page }));
        }
    }, [pageResult.page, filters.page]);

    const commit = useCallback((next: ListFilters) => {
        setFilters(next);
        writeFiltersToUrl(next);
    }, []);

    const setCategory = (slug: string | null) =>
        commit({ ...filters, category: filters.category === slug ? null : slug, page: 1 });
    const setType = (slug: string | null) =>
        commit({ ...filters, type: filters.type === slug ? null : slug, page: 1 });
    const setQuery = (query: string) => commit({ ...filters, query, page: 1 });
    const setPage = (page: number) => commit({ ...filters, page });
    const clearAll = () => commit(INITIAL_FILTERS);

    const hasActiveFilter =
        filters.category !== null || filters.type !== null || filters.query.trim() !== '';

    const t = (key: PostViewKey) => getUIText('postView', key, locale);
    const resultText = t('resultCount')
        .replace('{total}', String(posts.length))
        .replace('{count}', String(filtered.length));

    return (
        <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
            <FilterBar
                facets={facets}
                filters={filters}
                locale={locale}
                onCategory={setCategory}
                onType={setType}
                onQuery={setQuery}
                onClear={clearAll}
                hasActiveFilter={hasActiveFilter}
                resultText={resultText}
            />

            {pageResult.items.length > 0 ? (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {pageResult.items.map((post) => (
                        <li key={post.id}>
                            <PostListCard post={post} />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted-foreground border-border bg-card/60 mt-6 rounded-lg border px-5 py-10 text-center text-sm">
                    {t('empty')}
                </p>
            )}

            {pageResult.totalPages > 1 && (
                <Pagination
                    page={pageResult.page}
                    totalPages={pageResult.totalPages}
                    locale={locale}
                    onPage={setPage}
                />
            )}
        </div>
    );
}

interface FilterBarProps {
    facets: { categories: FacetOption[]; types: FacetOption[] };
    filters: ListFilters;
    locale: Locale;
    onCategory: (slug: string | null) => void;
    onType: (slug: string | null) => void;
    onQuery: (query: string) => void;
    onClear: () => void;
    hasActiveFilter: boolean;
    resultText: string;
}

function FilterBar({
    facets,
    filters,
    locale,
    onCategory,
    onType,
    onQuery,
    onClear,
    hasActiveFilter,
    resultText,
}: FilterBarProps) {
    const t = (key: PostViewKey) => getUIText('postView', key, locale);

    return (
        <div className="border-border/70 bg-background/85 sticky top-[12svh] z-20 -mx-4 mb-6 border-b px-4 py-3 backdrop-blur-md sm:top-[13svh] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {facets.categories.length > 0 && (
                <ChipRow
                    label={t('category')}
                    options={facets.categories}
                    selected={filters.category}
                    allLabel={t('all')}
                    onSelect={onCategory}
                />
            )}
            {facets.types.length > 0 && (
                <ChipRow
                    label={t('type')}
                    options={facets.types}
                    selected={filters.type}
                    allLabel={t('all')}
                    onSelect={onType}
                />
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="border-border bg-card focus-within:ring-ring relative flex min-w-[14rem] flex-1 items-center gap-2 rounded-lg border px-3 py-1.5 focus-within:ring-2">
                    <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
                    <input
                        type="search"
                        value={filters.query}
                        onChange={(event) => onQuery(event.target.value)}
                        placeholder={t('searchPlaceholder')}
                        aria-label={t('searchPlaceholder')}
                        className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
                    />
                </label>

                <p className="text-muted-foreground text-xs" aria-live="polite">
                    {resultText}
                </p>

                {hasActiveFilter && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
                    >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('clear')}
                    </button>
                )}
            </div>
        </div>
    );
}

interface ChipRowProps {
    label: string;
    options: FacetOption[];
    selected: string | null;
    allLabel: string;
    onSelect: (slug: string | null) => void;
}

function ChipRow({ label, options, selected, allLabel, onSelect }: ChipRowProps) {
    return (
        <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground mr-1 text-[0.7rem] font-medium tracking-wide uppercase">
                {label}
            </span>
            <Chip active={selected === null} onClick={() => onSelect(null)}>
                {allLabel}
            </Chip>
            {options.map((option) => (
                <Chip
                    key={option.slug}
                    active={selected === option.slug}
                    onClick={() => onSelect(option.slug)}
                >
                    {option.label}
                    <span className="ml-1 opacity-60">{option.count}</span>
                </Chip>
            ))}
        </div>
    );
}

function Chip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                'focus-visible:ring-ring inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2',
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            )}
        >
            {children}
        </button>
    );
}

function PostListCard({ post }: { post: PostListItem }) {
    const hasImage = Boolean(post.feature_image && post.feature_image.length > 0);
    const date = formatDate(post.published_at);
    const typeLabel =
        post.post_type_label && post.post_type_label.toLowerCase() !== 'default'
            ? post.post_type_label
            : '';
    const categoryLabel =
        post.post_category_label && post.post_category_label.toLowerCase() !== 'default'
            ? post.post_category_label
            : '';

    return (
        <a
            href={post.url}
            aria-label={post.title}
            className={cn(
                'group focus-visible:ring-ring relative flex h-full flex-col overflow-hidden rounded-2xl border',
                'border-border bg-card transition-[border-color,box-shadow] duration-300',
                'hover:border-foreground/30 hover:shadow-lg focus:outline-none focus-visible:ring-2'
            )}
        >
            <div className="bg-muted relative aspect-[16/10] overflow-hidden">
                {hasImage ? (
                    <img
                        src={post.feature_image ?? ''}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
                    />
                ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,var(--card-image-fallback-highlight),transparent_32%),linear-gradient(135deg,var(--card-image-fallback-start),var(--card-image-fallback-end))]" />
                )}
                {(typeLabel || categoryLabel) && (
                    <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
                        {typeLabel ? (
                            <span className="rounded-full border border-cyan-200/50 bg-cyan-300/20 px-2 py-0.5 text-[0.6rem] font-bold text-white/90 backdrop-blur-md [text-shadow:0_1px_6px_rgba(3,7,18,0.6)]">
                                {typeLabel}
                            </span>
                        ) : (
                            <span />
                        )}
                        {categoryLabel && (
                            <span className="rounded-full border border-lime-200/45 bg-lime-300/20 px-2 py-0.5 text-[0.6rem] font-bold text-white/90 backdrop-blur-md [text-shadow:0_1px_6px_rgba(3,7,18,0.6)]">
                                {categoryLabel}
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col p-3">
                <h3 className="text-foreground line-clamp-2 text-sm leading-snug font-semibold">
                    {post.title}
                </h3>
                {date && (
                    <time className="text-muted-foreground mt-auto pt-2 text-xs" dateTime={date}>
                        {date}
                    </time>
                )}
            </div>
        </a>
    );
}

interface PaginationProps {
    page: number;
    totalPages: number;
    locale: Locale;
    onPage: (page: number) => void;
}

function Pagination({ page, totalPages, locale, onPage }: PaginationProps) {
    const t = (key: PostViewKey) => getUIText('postView', key, locale);

    return (
        <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Pagination">
            <button
                type="button"
                onClick={() => onPage(page - 1)}
                disabled={page <= 1}
                aria-label={t('prevPage')}
                className="border-border text-foreground hover:bg-accent inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-muted-foreground text-sm tabular-nums">
                {page} / {totalPages}
            </span>
            <button
                type="button"
                onClick={() => onPage(page + 1)}
                disabled={page >= totalPages}
                aria-label={t('nextPage')}
                className="border-border text-foreground hover:bg-accent inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronRight className="h-5 w-5" />
            </button>
        </nav>
    );
}
