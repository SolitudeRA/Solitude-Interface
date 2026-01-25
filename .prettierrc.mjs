/** @type {import("prettier").Config} */
export default {
    plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
    overrides: [
        {
            files: '*.astro',
            options: {
                parser: 'astro',
            },
        },
        {
            files: ['*.json', '*.yml', '*.yaml'],
            options: {
                tabWidth: 2,
            },
        },
    ],

    // 基础配置
    tabWidth: 4,
    useTabs: false,
    endOfLine: 'lf',

    // 引号与分号
    singleQuote: true,
    jsxSingleQuote: false,
    semi: true,

    // 尾逗号与括号
    trailingComma: 'es5',
    bracketSpacing: true,
    bracketSameLine: false,

    // 代码宽度
    printWidth: 100,

    // 箭头函数参数
    arrowParens: 'always',

    // HTML 空格敏感度
    htmlWhitespaceSensitivity: 'css',

    // 内嵌语言格式化
    embeddedLanguageFormatting: 'auto',
};
