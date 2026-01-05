# 任务上下文: 创建新组件

## 📋 任务类型

创建新的 UI 组件

## 🎯 快速参考

### 组件放置位置

```
src/components/
├── common/       # 通用基础组件 (Button, Card, Badge)
├── home/         # 首页专用组件
├── layout/       # 布局组件 (Navbar, Dock)
├── posts/        # 文章展示组件
│   ├── view/     # 列表视图组件
│   └── detail/   # 详情页组件
└── pages/        # 页面专用组件
    ├── about/
    └── contact/
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

**方案 B: Emotion CSS-in-JS**

```tsx
import { css } from '@emotion/react';

const style = css`
    background: var(--background);
    padding: 1rem;
`;

<div css={style}>
```

---

## 📁 相关文件

| 文件                                       | 用途           |
| ------------------------------------------ | -------------- |
| `src/components/common/lib/utils.ts`       | cn() 工具函数  |
| `src/styles/theme.css`                     | 主题变量定义   |
| `docs/cline/templates/react-component.tsx` | React 组件模板 |
| `docs/cline/templates/astro-page.astro`    | Astro 页面模板 |

---

## 🔧 常用依赖

```typescript
// 样式工具
import { cn } from '@components/common/lib/utils';

// 动画
import { motion, AnimatePresence } from 'motion/react';

// 状态管理
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

// 图标
import { IconName } from 'lucide-react';
import { IconName } from 'react-icons/xx';
```
