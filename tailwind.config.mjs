import {nextui} from "@nextui-org/react";

const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
        './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        fontFamily: {
            sans: ['Noto Sans SC Variable', ...defaultTheme.fontFamily.sans],
            serif: ['Noto Serif SC Variable', defaultTheme.fontFamily.serif]
        },
        extend: {
            colors: {}
        }
    },
    darkMode: "class",
    plugins: [nextui({
    })],
};
