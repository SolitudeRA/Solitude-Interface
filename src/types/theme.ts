/**
 * 主题模式类型定义
 */
export type ThemeMode = 'light' | 'dark';

/**
 * 主题更改事件详情
 */
export interface ThemeChangedEventDetail {
    theme: ThemeMode;
}

/**
 * 主题更改自定义事件
 */
export interface ThemeChangedEvent extends CustomEvent<ThemeChangedEventDetail> {
    detail: ThemeChangedEventDetail;
}

/**
 * 声明全局 Window 接口，添加主题事件类型
 */
declare global {
    interface WindowEventMap {
        themeChanged: ThemeChangedEvent;
    }
}
