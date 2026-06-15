import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    /** 出错时的兜底 UI;默认 null(静默隐藏出错的 island,不拖垮页面其余部分) */
    fallback?: ReactNode | undefined;
    /** 出错处的标识,便于日志定位 */
    label?: string | undefined;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

/**
 * React 错误边界:捕获子树渲染/生命周期中的运行时异常,避免单个 island 崩溃拖垮整棵组件树。
 * 仅捕获 React 渲染期错误(不含事件回调/异步;那些需各自 try-catch)。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    override componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error(
            `[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`,
            error,
            info
        );
    }

    override render(): ReactNode {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}

/**
 * 把组件包进 ErrorBoundary 的高阶组件:返回的组件作为 island 入口时,
 * 边界即为内部组件的父级,可捕获其渲染期异常。
 */
export function withErrorBoundary<P extends object>(
    Wrapped: ComponentType<P>,
    options: { fallback?: ReactNode; label?: string } = {}
): ComponentType<P> {
    // 局部转为非泛型组件类型,规避泛型 props 展开的重载推断问题
    const Inner = Wrapped as ComponentType<Record<string, unknown>>;
    const WithBoundary = (props: P) => (
        <ErrorBoundary fallback={options.fallback} label={options.label}>
            <Inner {...(props as Record<string, unknown>)} />
        </ErrorBoundary>
    );
    WithBoundary.displayName = `withErrorBoundary(${Wrapped.displayName || Wrapped.name || 'Component'})`;
    return WithBoundary;
}
