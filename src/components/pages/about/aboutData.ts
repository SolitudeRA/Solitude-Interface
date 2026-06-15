import type { IconType } from 'react-icons';
import type { Locale } from '@lib/i18n';
import {
    SiAmazonwebservices,
    SiAnaconda,
    SiAstro,
    SiBootstrap,
    SiClaude,
    SiCloudflare,
    SiCplusplus,
    SiCss3,
    SiDocker,
    SiFigma,
    SiGit,
    SiGithubactions,
    SiGithubcopilot,
    SiGo,
    SiGooglechrome,
    SiGooglecloud,
    SiGooglegemini,
    SiGrafana,
    SiHtml5,
    SiJavascript,
    SiJenkins,
    SiJetbrains,
    SiJira,
    SiKotlin,
    SiLess,
    SiLinux,
    SiMendeley,
    SiMongodb,
    SiMysql,
    SiNeo4J,
    SiNginx,
    SiNodedotjs,
    SiNotion,
    SiNpm,
    SiOllama,
    SiOpenai,
    SiOpenjdk,
    SiPhp,
    SiPython,
    SiPytorch,
    SiReact,
    SiRedis,
    SiRust,
    SiSass,
    SiSlack,
    SiSpring,
    SiTailwindcss,
    SiTensorflow,
    SiTypescript,
} from 'react-icons/si';

/**
 * 关于页(AboutContent)的数据:多语言文案、个人项目、技术栈分组。
 * 从组件 frontmatter 抽离,使 AboutContent.astro 专注于模板与样式。
 */

// 多语言文本
export const aboutI18n = {
    zh: {
        atAGlance: 'At a Glance',
        profile: '简介',
        intro: '非典型二次元理工科男，自闭死宅，爱吃，爱听歌，爱打游戏',
        spokenLanguages: 'Spoken Languages',
        languages: '中文（母语） / 日语（JLPT N1） / 英语（CEFR B2）',
        focus: '个人项目',
        techStack: 'Tech Stack',
        hobbies: 'Hobbies',
        gaming: '游戏',
        gamingDesc:
            'FPS/TPS、ARPG、CRPG、MOBA、音游、卡牌... 什么品类都玩，擅长FPS，最爱Counter-Strike',
        hardwareSpec: '主力机配置',
        hardwareSpecs: [
            { label: 'GPU', value: 'ASUS Strix RTX 4080', featured: true },
            { label: 'CPU', value: 'AMD 5900X' },
            { label: '内存', value: '32GB RAM' },
            { label: '主板', value: 'ASUS B550-A Gaming' },
        ],
        peripheral: '外设',
        mouse: '鼠标',
        mouseDetail: 'Razer DeathAdder V3 Pro & Razer DeadAdder V2 Pro (backup)',
        keyboard: '键盘',
        keyboardDetail: 'Razer Huntsman V3 Pro Mini (gaming) & WASD CODE Keyboard (coding)',
        headset: '耳机',
        headsetDetail:
            'SteelSeries Arctis 7 (for wireless gaming) & Audio-Technica ATH W1000z (music & gaming) & Audio-Technica ATH IM04 (music)',
        music: '音乐',
        musicDesc: '什么都听',
        equipment: '装备',
        equipmentDetail:
            'TEAC Al-301DA (DAC) · Audio-Technica ATH W1000z · Audio-Technica ATH IM04',
        instruments: '乐器',
        instrumentsDetail: '民谣吉他/古典吉他/电吉他（都会一点）',
        bandExp: '玩过三年乐队（小打小闹）',
        band: '乐队',
    },
    ja: {
        atAGlance: 'ひと目でわかる',
        profile: '概要',
        intro: '理系オタク。食べるのが好きで、音楽を聴くのもゲームをするのも好き。',
        spokenLanguages: '言語',
        languages: '中国語（母語） / 日本語（JLPT N1） / 英語（CEFR B2）',
        focus: '個人プロジェクト',
        techStack: '技術スタック',
        hobbies: '趣味',
        gaming: 'ゲーム',
        gamingDesc:
            'FPS/TPS、ARPG、CRPG、MOBA、音ゲー、カード系…ジャンルは何でも遊びます。得意なのはFPSで、いちばん好きなのはCounter-Strike',
        hardwareSpec: 'メインPCスペック',
        hardwareSpecs: [
            { label: 'GPU', value: 'ASUS Strix RTX 4080', featured: true },
            { label: 'CPU', value: 'AMD 5900X' },
            { label: 'メモリ', value: '32GB RAM' },
            { label: 'マザー', value: 'ASUS B550-A Gaming' },
        ],
        peripheral: '周辺機器',
        mouse: 'マウス',
        mouseDetail: 'Razer DeathAdder V3 Pro & Razer DeathAdder V2 Pro（予備）',
        keyboard: 'キーボード',
        keyboardDetail:
            'Razer Huntsman V3 Pro Mini（ゲーム用） & WASD CODE Keyboard（コーディング用）',
        headset: 'ヘッドホン/イヤホン',
        headsetDetail:
            'SteelSeries Arctis 7（ワイヤレスでゲーム用） & Audio-Technica ATH W1000z（音楽・ゲーム） & Audio-Technica ATH IM04（音楽）',
        music: '音楽',
        musicDesc: 'ジャンル限らず、何でも聴きます',
        equipment: '機材',
        equipmentDetail:
            'TEAC Al-301DA（DAC）· Audio-Technica ATH W1000z · Audio-Technica ATH IM04',
        instruments: '楽器',
        instrumentsDetail:
            'アコースティックギター／クラシックギター／エレキギター（どれも少し弾けます）',
        bandExp: '3年間バンド経験あり（遊びだけ）',
        band: 'バンド',
    },
    en: {
        atAGlance: 'At a Glance',
        profile: 'Profile',
        intro: 'A not-so-typical nerdy otaku (STEM guy). Socially awkward, homebody, loves food, music, and gaming.',
        spokenLanguages: 'Spoken Languages',
        languages: 'Chinese (Native) / Japanese (JLPT N1) / English (CEFR B2)',
        focus: 'Personal Projects',
        techStack: 'Tech Stack',
        hobbies: 'Hobbies',
        gaming: 'Gaming',
        gamingDesc:
            "I play pretty much every genre—FPS/TPS, ARPG, CRPG, MOBA, rhythm games, card games, etc. I'm best at FPS, and my all-time favorite is Counter-Strike.",
        hardwareSpec: 'Main PC Specs',
        hardwareSpecs: [
            { label: 'GPU', value: 'ASUS Strix RTX 4080', featured: true },
            { label: 'CPU', value: 'AMD 5900X' },
            { label: 'Memory', value: '32GB RAM' },
            { label: 'Motherboard', value: 'ASUS B550-A Gaming' },
        ],
        peripheral: 'Peripherals',
        mouse: 'Mouse',
        mouseDetail: 'Razer DeathAdder V3 Pro & Razer DeathAdder V2 Pro (backup)',
        keyboard: 'Keyboard',
        keyboardDetail: 'Razer Huntsman V3 Pro Mini (gaming) & WASD CODE Keyboard (coding)',
        headset: 'Headphones / IEMs',
        headsetDetail:
            'SteelSeries Arctis 7 (wireless gaming) & Audio-Technica ATH W1000z (music & gaming) & Audio-Technica ATH IM04 (music)',
        music: 'Music',
        musicDesc: 'I listen to pretty much everything.',
        equipment: 'Gear',
        equipmentDetail:
            'TEAC AI-301DA (DAC) · Audio-Technica ATH W1000z · Audio-Technica ATH IM04',
        instruments: 'Instruments',
        instrumentsDetail: 'Acoustic / classical / electric guitar (a bit of each)',
        bandExp: 'Played in a band for three years (just for fun)',
        band: 'Band',
    },
} satisfies Record<Locale, Record<string, unknown>>;

export const personalProjects = [
    {
        name: 'SolitudeRA/Solitude-Interface',
        href: 'https://github.com/SolitudeRA/Solitude-Interface',
    },
    {
        name: 'SolitudeRA/noema',
        href: 'https://github.com/SolitudeRA/noema',
    },
];

export type TechItem = {
    name: string;
    icon?: IconType;
    color: string;
    fallback?: string;
    muted?: boolean;
};

export type TechGroup = {
    marker: string;
    title: string;
    accent: string;
    featured?: boolean;
    items: TechItem[];
};

export const techGroups: TechGroup[] = [
    {
        marker: 'WEB',
        title: 'Product & Web',
        accent: '#06b6d4',
        items: [
            { name: 'TypeScript', icon: SiTypescript, color: '#3178c6' },
            { name: 'JavaScript', icon: SiJavascript, color: '#f7df1e' },
            { name: 'React', icon: SiReact, color: '#61dafb' },
            { name: 'Astro', icon: SiAstro, color: '#ff5d01' },
            { name: 'Tailwind CSS', icon: SiTailwindcss, color: '#06b6d4' },
            { name: 'HTML5', icon: SiHtml5, color: '#e34f26' },
            { name: 'CSS3', icon: SiCss3, color: '#1572b6' },
            { name: 'Sass', icon: SiSass, color: '#cc6699', muted: true },
            { name: 'Less', icon: SiLess, color: '#1d365d', muted: true },
            { name: 'Bootstrap', icon: SiBootstrap, color: '#7952b3', muted: true },
            { name: 'Chrome Extension', icon: SiGooglechrome, color: '#4285f4', muted: true },
            { name: 'npm', icon: SiNpm, color: '#cb3837', muted: true },
        ],
    },
    {
        marker: 'AI',
        title: 'AI & Agentic Workflow',
        accent: '#8b5cf6',
        featured: true,
        items: [
            { name: 'OpenAI Codex', icon: SiOpenai, color: '#10a37f' },
            { name: 'Claude Code', icon: SiClaude, color: '#d97757' },
            { name: 'GitHub Copilot', icon: SiGithubcopilot, color: '#ffffff' },
            { name: 'Gemini', icon: SiGooglegemini, color: '#8e75b2' },
            { name: 'Ollama', icon: SiOllama, color: '#ffffff' },
            { name: 'PyTorch', icon: SiPytorch, color: '#ee4c2c', muted: true },
            { name: 'TensorFlow', icon: SiTensorflow, color: '#ff6f00', muted: true },
            { name: 'Anaconda', icon: SiAnaconda, color: '#44a833', muted: true },
        ],
    },
    {
        marker: 'API',
        title: 'Backend & Services',
        accent: '#f59e0b',
        items: [
            { name: 'Java', icon: SiOpenjdk, color: '#ed8b00' },
            { name: 'Kotlin', icon: SiKotlin, color: '#7f52ff' },
            { name: 'Spring Framework', icon: SiSpring, color: '#6db33f' },
            { name: 'Node.js', icon: SiNodedotjs, color: '#5fa04e' },
            { name: 'Python', icon: SiPython, color: '#3776ab' },
            { name: 'Go', icon: SiGo, color: '#00add8' },
            { name: 'PHP', icon: SiPhp, color: '#777bb4', muted: true },
            { name: 'Rust', icon: SiRust, color: '#ffffff', muted: true },
            { name: 'C++', icon: SiCplusplus, color: '#00599c', muted: true },
        ],
    },
    {
        marker: 'DATA',
        title: 'Data & Storage',
        accent: '#22c55e',
        items: [
            { name: 'MySQL', icon: SiMysql, color: '#4479a1' },
            { name: 'Redis', icon: SiRedis, color: '#dc382d' },
            { name: 'MongoDB', icon: SiMongodb, color: '#47a248' },
            { name: 'Neo4j', icon: SiNeo4J, color: '#4581c3' },
        ],
    },
    {
        marker: 'OPS',
        title: 'Infrastructure & Cloud',
        accent: '#3b82f6',
        items: [
            { name: 'Linux', icon: SiLinux, color: '#fcc624' },
            { name: 'Docker', icon: SiDocker, color: '#2496ed' },
            { name: 'Nginx', icon: SiNginx, color: '#009639' },
            { name: 'Cloudflare', icon: SiCloudflare, color: '#f38020' },
            { name: 'AWS', icon: SiAmazonwebservices, color: '#ff9900', muted: true },
            { name: 'GCP', icon: SiGooglecloud, color: '#4285f4', muted: true },
        ],
    },
    {
        marker: 'FLOW',
        title: 'Engineering Workflow',
        accent: '#ec4899',
        items: [
            { name: 'Git', icon: SiGit, color: '#f05032' },
            { name: 'GitHub Actions', icon: SiGithubactions, color: '#2088ff' },
            { name: 'Jenkins', icon: SiJenkins, color: '#d24939' },
            { name: 'Grafana', icon: SiGrafana, color: '#f46800' },
            { name: 'JetBrains', icon: SiJetbrains, color: '#ffffff' },
            { name: 'Figma', icon: SiFigma, color: '#f24e1e' },
            { name: 'Jira', icon: SiJira, color: '#0052cc', muted: true },
            { name: 'Notion', icon: SiNotion, color: '#ffffff', muted: true },
            { name: 'Slack', icon: SiSlack, color: '#e01e5a', muted: true },
            { name: 'Mendeley', icon: SiMendeley, color: '#9d1620', muted: true },
        ],
    },
];
