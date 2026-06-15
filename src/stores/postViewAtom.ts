import { atom } from 'jotai';

/**
 * 文章视图滚动状态
 */
export interface PostViewState {
    /** 文章总数 */
    totalPosts: number;
    /** 当前可见的文章索引数组 */
    visibleIndices: number[];
    /** 当前主要可见的文章索引（用于时间线显示） */
    activeIndex: number;
    /** 各文章的发布日期 */
    postDates: string[];
}

/**
 * 初始状态
 */
const initialPostViewState: PostViewState = {
    totalPosts: 0,
    visibleIndices: [],
    activeIndex: 0,
    postDates: [],
};

/**
 * 文章视图状态 atom
 * 用于跨组件共享滚动状态（PostViewScrollContainer <-> DockTimeline）
 */
export const postViewAtom = atom<PostViewState>(initialPostViewState);

/**
 * 滚动容器度量（px），用于 minimap 总览滑块的尺寸与定位。
 * 单独成 atom：滚动每帧都会更新它，只让订阅它的 minimap 重渲染，
 * 不波及只读 postViewAtom 的时间线（避免每帧重渲染时间线）。
 */
export interface PostViewScrollMetrics {
    /** 容器当前水平滚动量 */
    scrollLeft: number;
    /** 容器内容总宽 */
    scrollWidth: number;
    /** 容器可视宽 */
    clientWidth: number;
}

const initialScrollMetrics: PostViewScrollMetrics = {
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
};

export const postViewScrollAtom = atom<PostViewScrollMetrics>(initialScrollMetrics);

/**
 * 只读派生 atom：获取当前活动文章的日期
 */
export const activePostDateAtom = atom((get) => {
    const state = get(postViewAtom);
    if (state.postDates.length === 0 || state.activeIndex < 0) {
        return null;
    }
    return state.postDates[state.activeIndex] || null;
});

/**
 * 只读派生 atom：获取可见范围
 */
export const visibleRangeAtom = atom((get) => {
    const state = get(postViewAtom);
    const { visibleIndices } = state;
    if (visibleIndices.length === 0) {
        return { first: -1, last: -1 };
    }
    return {
        first: Math.min(...visibleIndices),
        last: Math.max(...visibleIndices),
    };
});

/**
 * 请求滚动到指定文章的 atom
 * 设置为目标索引后，PostViewScrollContainer 会响应并滚动
 * 滚动完成后会重置为 null
 */
export const scrollToPostAtom = atom<number | null>(null);
