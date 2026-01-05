# 任务上下文: 修改 API 层

## 📋 任务类型

修改或扩展 Ghost API 集成层

## 🎯 快速参考

### API 层结构

```
src/api/
├── config/
│   └── env.ts              # 环境变量配置
├── clients/
│   └── ghost.ts            # Axios 客户端实例
├── ghost/
│   ├── posts.ts            # 文章 API
│   ├── settings.ts         # 站点设置 API
│   └── types.ts            # 类型定义
├── adapters/
│   └── ghost.ts            # 数据转换器
├── utils/
│   ├── cache.ts            # 请求缓存
│   ├── errorHandlers.ts    # 错误处理
│   └── url.ts              # URL 工具
└── __tests__/              # 测试文件
```

### 数据流向

```
页面/组件 → ghost/posts.ts → adapters/ghost.ts → clients/ghost.ts → Ghost API
                                    ↑
                              utils/cache.ts
```

---

## ✅ 常见任务

### 1. 添加新的 API 端点

**步骤 1: 定义类型 (types.ts)**

```typescript
// src/api/ghost/types.ts
export interface NewResource {
    id: string;
    slug: string;
    name: string;
    // ...
}
```

**步骤 2: 实现 API 函数**

```typescript
// src/api/ghost/newResource.ts
import { ghostClient } from '@api/clients/ghost';
import { withCache } from '@api/utils/cache';
import type { NewResource } from './types';

export async function getNewResources(): Promise<NewResource[]> {
    return withCache('new-resources', async () => {
        const response = await ghostClient.get('/new-resources');
        return response.data.new_resources;
    });
}
```

**步骤 3: 添加适配器 (如需转换)**

```typescript
// src/api/adapters/ghost.ts
export function adaptNewResource(raw: RawNewResource): NewResource {
    return {
        ...raw,
        // 转换逻辑
    };
}
```

### 2. 修改现有 API

```typescript
// 添加新参数
export interface GetPostsOptions {
    filter?: string;
    limit?: number;
    include?: string;
    // 新增参数
    newParam?: string;
}

// 在函数中处理
export async function getPosts(options?: GetPostsOptions) {
    const params = {
        // 现有参数...
        new_param: options?.newParam,
    };
    // ...
}
```

### 3. 添加缓存

```typescript
import { withCache, clearCache } from '@api/utils/cache';

// 使用缓存
const data = await withCache('cache-key', fetchFunction);

// 清除缓存
clearCache('cache-key');
```

---

## 🧪 测试要求

### 单元测试 (必须)

```typescript
// src/api/__tests__/ghost/newResource.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@api/clients/ghost');

describe('getNewResources', () => {
    it('应该返回资源列表', async () => {
        // ...
    });
});
```

### 集成测试 (推荐)

```typescript
// src/api/__tests__/ghost/newResource.integration.test.ts
describe('Integration: getNewResources', () => {
    it('应该从真实 API 获取数据', async () => {
        // 需要配置 .env
    });
});
```

### 运行测试

```bash
pnpm test:unit              # 单元测试
pnpm test:integration       # 集成测试
pnpm test:run               # 全部测试
```

---

## 📁 相关文件

| 文件                                     | 用途         |
| ---------------------------------------- | ------------ |
| `src/api/config/env.ts`                  | 环境变量配置 |
| `src/api/clients/ghost.ts`               | Axios 实例   |
| `src/api/utils/cache.ts`                 | 缓存工具     |
| `src/api/utils/errorHandlers.ts`         | 错误处理     |
| `docs/cline/templates/unit-test.test.ts` | 测试模板     |

---

## 🔧 Ghost API 参考

### 常用端点

| 端点                | 用途         |
| ------------------- | ------------ |
| `/posts`            | 文章列表     |
| `/posts/:id`        | 单篇文章     |
| `/posts/slug/:slug` | 按 slug 获取 |
| `/tags`             | 标签列表     |
| `/settings`         | 站点设置     |

### 过滤语法

```typescript
// 标签过滤
filter: 'tag:hash-lang-zh';

// 多条件
filter: 'tag:hash-lang-zh+featured:true';

// 日期过滤
filter: 'published_at:>2024-01-01';
```

### include 参数

```typescript
include: 'tags,authors'; // 包含标签和作者信息
```

---

## ⚠️ 注意事项

1. **类型安全**: 始终定义完整的 TypeScript 类型
2. **缓存策略**: 构建时数据使用内存缓存
3. **错误处理**: 使用 `errorHandlers.ts` 统一处理
4. **测试覆盖**: 新功能必须有单元测试
5. **文档更新**: 重大变更更新 ARCHITECTURE.md
