import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
    // ============================================================
    // 全局忽略
    // ============================================================
    {
        ignores: [
            'dist/**',
            'build/**',
            'output/**',
            '.astro/**',
            'node_modules/**',
            'coverage/**',
            'public/**',
            '*.d.ts',
            '*.min.js',
            '*.min.css',
            // 配置文件（由 Prettier 处理）
            '.prettierrc.mjs',
            // Astro 布局文件（复杂模板导致解析问题）
            'src/layouts/base/BaseLayout.astro',
        ],
    },

    // ============================================================
    // 基础 JavaScript 规则
    // ============================================================
    js.configs.recommended,

    // ============================================================
    // 全局变量配置
    // ============================================================
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                // React JSX runtime
                React: 'readonly',
                // Google Analytics
                dataLayer: 'readonly',
                gtag: 'readonly',
            },
        },
    },

    // ============================================================
    // TypeScript 配置
    // ============================================================
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
        },
        rules: {
            // TypeScript 推荐规则
            ...typescript.configs.recommended.rules,

            // 自定义 TypeScript 规则
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'inline-type-imports',
                },
            ],
            '@typescript-eslint/no-import-type-side-effects': 'error',

            // 禁用基础规则，使用 TypeScript 版本
            'no-unused-vars': 'off',
        },
    },

    // ============================================================
    // React 配置
    // ============================================================
    {
        files: ['**/*.tsx', '**/*.jsx'],
        plugins: {
            react: react,
            'react-hooks': reactHooks,
            'jsx-a11y': jsxA11y,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            // React 推荐规则
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,

            // 可访问性规则
            ...jsxA11y.configs.recommended.rules,

            // 自定义 React 规则
            'react/prop-types': 'off', // TypeScript 已处理
            'react/react-in-jsx-scope': 'off', // React 17+ 不需要
            'react/display-name': 'off',
            'react/no-unknown-property': ['error', { ignore: ['css'] }], // Emotion CSS prop

            // Hooks 规则
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            // 允许在 effect 中设置初始状态（客户端初始化场景常见）
            ...(reactHooks.configs.recommended.rules['react-hooks/set-state-in-effect'] && {
                'react-hooks/set-state-in-effect': 'off',
            }),
            // 允许修改 window.location 等浏览器全局对象
            ...(reactHooks.configs.recommended.rules['react-hooks/immutability'] && {
                'react-hooks/immutability': 'off',
            }),

            // 可访问性规则调整
            'jsx-a11y/anchor-is-valid': 'warn',
            'jsx-a11y/anchor-has-content': 'warn', // 组件化场景下内容通过 props 传入
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/no-static-element-interactions': 'warn',
        },
    },

    // ============================================================
    // Astro 配置
    // ============================================================
    ...astro.configs.recommended,
    {
        files: ['**/*.astro'],
        rules: {
            // Astro 特定规则调整
            'astro/no-unused-css-selector': 'off', // 允许动态类名
        },
    },

    // ============================================================
    // 通用规则覆盖
    // ============================================================
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.astro'],
        rules: {
            // 代码质量
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-debugger': 'warn',
            'no-alert': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always', { null: 'ignore' }],

            // 代码风格 (与 Prettier 配合)
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
            'no-trailing-spaces': 'error',
        },
    },

    // ============================================================
    // 测试文件配置
    // ============================================================
    {
        files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'no-console': 'off',
        },
    },

    // ============================================================
    // 配置文件 (允许 CommonJS)
    // ============================================================
    {
        files: ['*.config.js', '*.config.mjs', '*.config.cjs', 'postcss.config.cjs'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
];
