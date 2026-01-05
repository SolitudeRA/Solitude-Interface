# Cline 任务上下文文档

此目录包含针对特定任务类型的上下文参考文档和代码模板，帮助 Cline AI 助手更快速、准确地完成任务。

## 📁 目录结构

```
docs/cline/
├── README.md                 # 本文件
├── TASK_NEW_COMPONENT.md     # 创建组件任务参考
├── TASK_ADD_PAGE.md          # 添加页面任务参考
├── TASK_API_CHANGE.md        # API 修改任务参考
└── templates/                # 代码模板
    ├── astro-page.astro      # Astro 页面模板
    ├── react-component.tsx   # React 组件模板
    └── unit-test.test.ts     # 单元测试模板
```

## 📋 任务上下文文件

| 文件                    | 用途                   |
| ----------------------- | ---------------------- |
| `TASK_NEW_COMPONENT.md` | 创建新 UI 组件时的参考 |
| `TASK_ADD_PAGE.md`      | 添加新页面路由时的参考 |
| `TASK_API_CHANGE.md`    | 修改 API 层时的参考    |

## 📄 代码模板

| 模板                            | 用途                  |
| ------------------------------- | --------------------- |
| `templates/astro-page.astro`    | 多语言 Astro 页面模板 |
| `templates/react-component.tsx` | React 交互组件模板    |
| `templates/unit-test.test.ts`   | Vitest 单元测试模板   |

## 🎯 使用方法

当您需要执行特定类型的任务时，可以：

1. **直接告诉 Cline**:

    > "请参考 `docs/cline/TASK_NEW_COMPONENT.md` 创建一个新组件"

2. **让 Cline 自动参考**:
   Cline 会根据 `.clinerules` 中的目录结构信息，在需要时自动查阅相关文档。

## 🔧 扩展

如果您有其他常见任务类型，可以按照相同格式创建新的上下文文档：

```markdown
# 任务上下文: [任务名称]

## 📋 任务类型

[简要描述]

## 🎯 快速参考

[关键信息]

## ✅ 创建步骤

[步骤说明]

## 📁 相关文件

[文件列表]

## ⚠️ 注意事项

[注意事项]
```
