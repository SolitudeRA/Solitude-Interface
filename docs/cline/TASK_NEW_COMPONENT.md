# 任务上下文: 创建新组件

## 📋 任务类型

创建新的 UI 组件

## 🎯 快速参考

### 组件放置位置

```
src/components/
├── common/           # 通用基础组件 (Button, Card, Badge, Tooltip, Switch 等)
│   └── lib/          # 组件工具函数 (cn, utils)
├── home/             # 首页专用组件
├── i18n/             # 国际化组件 (FallbackNotice)
├── layout/           # 布局组件
│   ├── dock/         # Dock 底部导航栏
│   └── navbar/       # 顶部导航栏
├── pages/            # 页面专用组件
│   ├── about/
│   ├── contact/
│   └── privacy-policy/
├── posts/            # 文章展示组件
│   ├── detail/       # 文章详情组件 (PostContent, PostHeader, TableOfContents)
│   └── view/         # 列表视图组件 (PostViewContainer, PostViewScrollContainer, PostViewPagination)
└── utils/            # 工具组件 (GoogleAnalytics 等)
```

### 文件命名

- Astro 组件: `PascalCase.astro`
- React 组件: `PascalCase.tsx`

### 选择 Astro 还是 React?

| 使用 Astro (.astro) | 使用 React (.tsx)       |
| ------------------- | ----------------------- |
| 纯静态内容          | 需要客户端交互          |
| 服务端数据获取      | 使用 useState/useEffect |
| 无 JavaScript 开销  | 需要动画 (Motion)       |
| 布局容器            | 需要 Jotai 状态         |

---

## ✅ 创建步骤

### 1. 创建组件文件

**React 组件示例:**

```tsx
import * as React from 'react';
import { cn } from '@components/common/lib/utils';

interface MyComponentProps {
    title: string;
    className?: string;
}

export default function MyComponent({ title, className }: MyComponentProps) {
    return (
        <div className={cn('rounded-lg p-4', className)}>
            <h2>{title}</h2>
        </div>
    );
}
```

**Astro 组件示例:**

```astro
---
interface Props {
    title: string;
}

const { title } = Astro.props;
---

<div class="rounded-lg p-4">
    <h2>{title}</h2>
    <slot />
</div>
```

### 2. 导入路径

使用路径别名导入:

```typescript
import MyComponent from '@components/common/MyComponent';
```

### 3. 样式方案

**方案 A: TailwindCSS (推荐)**

```tsx
<div className="bg-background text-foreground rounded-lg p-4">
```

**方案 B: CSS 变量 + Tailwind**

```tsx
<div className="rounded-lg p-4" style={{ background: 'var(--card-background)' }}>
```

**方案 C: Emotion CSS-in-JS (仅需要动态样式时)**

```tsx
import { css } from '@emotion/react';

const style = css`
    background: var(--background);
    padding: 1rem;
`;

<div css={style}>
```

---

## 🔧 常用依赖

### Radix UI (无样式原语组件)

```typescript
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Switch from '@radix-ui/react-switch';
import { Slot } from '@radix-ui/react-slot';
```

**Tooltip 使用示例:**

```tsx
import * as Tooltip from '@radix-ui/react-tooltip';

export function MyTooltip({ children, content }: Props) {
    return (
        <Tooltip.Provider>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        className="bg-popover rounded px-3 py-1.5 text-sm shadow-md"
                        sideOffset={5}
                    >
                        {content}
                        <Tooltip.Arrow className="fill-popover" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}
```

### 图标库

```typescript
// Lucide React (推荐)
import { Menu, X, Sun, Moon, ChevronRight } from 'lucide-react';

// React Icons (多图标库合集)
import { FaGithub, FaTwitter } from 'react-icons/fa';
import { SiDiscord } from 'react-icons/si';
```

### 动画 (Motion)

```typescript
import { motion, AnimatePresence } from 'motion/react';

// 基础动画
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
>
    内容
</motion.div>

// 条件渲染动画
<AnimatePresence>
    {isVisible && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            内容
        </motion.div>
    )}
</AnimatePresence>
```

### 样式工具

```typescript
// cn() - 合并 className
import { cn } from '@components/common/lib/utils';

<div className={cn('base-class', isActive && 'active-class', className)} />

// cva - Class Variance Authority (变体组件)
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('rounded-lg font-medium', {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground',
            outline: 'border border-input bg-background',
        },
        size: {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4',
            lg: 'h-12 px-6 text-lg',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'md',
    },
});
```

### 状态管理 (Jotai)

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// 定义 atom
const countAtom = atom(0);

// 读取和写入
const [count, setCount] = useAtom(countAtom);

// 仅读取
const count = useAtomValue(countAtom);

// 仅写入
const setCount = useSetAtom(countAtom);
```

---

## 📁 相关文件

| 文件                                       | 用途           |
| ------------------------------------------ | -------------- |
| `src/components/common/lib/utils.ts`       | cn() 工具函数  |
| `src/styles/theme/`                        | 主题变量定义   |
| `docs/cline/templates/react-component.tsx` | React 组件模板 |

---

## ⚠️ 注意事项

1. **客户端指令**: React 交互组件需要在 Astro 中使用 `client:*` 指令

    ```astro
    <MyComponent client:load />
    <!-- 页面加载时立即水合 -->
    <MyComponent client:visible />
    <!-- 进入视口时水合 -->
    <MyComponent client:idle />
    <!-- 浏览器空闲时水合 -->
    ```

2. **导出方式**: 确保使用正确的导出方式
    - 默认导出: `export default function Component()`
    - 命名导出: `export function Component()`

3. **类型定义**: 始终为 Props 定义 TypeScript 接口

4. **可访问性**: 使用语义化标签，添加 `role` 和 `aria-*` 属性
