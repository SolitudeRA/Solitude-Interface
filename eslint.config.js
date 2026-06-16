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
            // 预留：若将来采用 Emotion CSS-in-JS（见 docs/cline 方案 C）则放行 css prop；当前未使用
            'react/no-unknown-property': ['error', { ignore: ['css'] }],

            // Hooks 规则
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            // 允许在 effect 中设置初始状态（客户端初始化场景常见）
            'react-hooks/set-state-in-effect': 'off',
            // 允许修改 window.location 等浏览器全局对象
            'react-hooks/immutability': 'off',

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
            // 纯格式规则（trailing spaces、连续空行等）交由 Prettier 处理，此处不重复
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
];
