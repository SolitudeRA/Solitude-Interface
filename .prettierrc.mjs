/** @type {import("prettier").Config} */
export default {
    plugins: ['prettier-plugin-astro'],
    overrides: [
        {
            files: '*.astro',
            options: {
                parser: 'astro',
            },
        },
        {
            files: ['*.json', '*.yml'],
            options: {
                tabWidth: 2,
            },
        },
    ],
    tabWidth: 4,
    endOfLine: 'lf',
    singleQuote: true,
};
