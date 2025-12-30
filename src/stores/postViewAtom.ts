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
