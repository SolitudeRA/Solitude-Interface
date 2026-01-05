/**
 * React 组件模板
 *
 * 用法: 复制此文件到 src/components/{category}/ 目录并重命名
 *
 * 功能:
 * - TypeScript 类型定义
 * - TailwindCSS 样式
 * - Motion 动画 (可选)
 * - Jotai 状态管理 (可选)
 */
import * as React from 'react';
import { useState, useCallback } from 'react';
// import { motion } from 'motion/react';
// import { useAtom } from 'jotai';
import { cn } from '@components/common/lib/utils';

// ============================================================
// 类型定义
// ============================================================

interface ComponentNameProps {
    /** 组件标题 */
    title: string;
    /** 可选的子元素 */
    children?: React.ReactNode;
    /** 额外的 CSS 类名 */
    className?: string;
    /** 点击事件回调 */
    onClick?: () => void;
}

// ============================================================
// 组件实现
// ============================================================

export default function ComponentName({
    title,
    children,
    className,
    onClick,
}: ComponentNameProps) {
    // 状态管理
    const [isActive, setIsActive] = useState(false);

    // 事件处理
    const handleClick = useCallback(() => {
        setIsActive((prev) => !prev);
        onClick?.();
    }, [onClick]);

    return (
        <div
            className={cn(
                // 基础样式
                'rounded-lg border p-4',
                // 条件样式
                isActive && 'border-primary bg-primary/10',
                // 外部传入的类名
                className,
            )}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            <h3 className="text-lg font-semibold">{title}</h3>
            {children && <div className="mt-2">{children}</div>}
        </div>
    );
}

// ============================================================
// 子组件 (可选)
// ============================================================

interface ComponentNameItemProps {
    label: string;
}

ComponentName.Item = function ComponentNameItem({
    label,
}: ComponentNameItemProps) {
    return <span className="text-muted-foreground text-sm">{label}</span>;
};
