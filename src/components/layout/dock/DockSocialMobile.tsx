import { useState, useEffect } from 'react';
import {
    FaGithub,
    FaSquareXTwitter,
    FaSteam,
    FaSpotify,
    FaBilibili,
    FaShareNodes,
} from 'react-icons/fa6';

const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/SolitudeRA', icon: FaGithub },
    {
        name: 'X (Twitter)',
        href: 'https://x.com/SolitudeRA',
        icon: FaSquareXTwitter,
    },
    {
        name: 'Steam',
        href: 'https://steamcommunity.com/id/SolitudeRA/',
        icon: FaSteam,
    },
    {
        name: 'Spotify',
        href: 'https://open.spotify.com/user/29a85ixn15w4zcbmb0lkix9h3?si=1c70dc8fa5dc418c',
        icon: FaSpotify,
    },
    {
        name: 'Bilibili',
        href: 'https://space.bilibili.com/1724972',
        icon: FaBilibili,
    },
];

export default function DockSocialMobile() {
    const [isOpen, setIsOpen] = useState(false);

    // 处理 ESC 键关闭菜单
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            // 防止背景滚动
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <>
            {/* 汉堡按钮 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100/85 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 sm:h-11 sm:w-11 dark:bg-zinc-800/85 ${isOpen ? 'ring-2 ring-blue-400' : ''} `}
                aria-label="Social links menu"
                aria-expanded={isOpen}
            >
                <FaShareNodes className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* 遮罩层 */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* 弹出菜单 */}
            {isOpen && (
                <div
                    className={`animate-in slide-in-from-bottom-4 fade-in fixed right-4 bottom-24 z-50 min-w-[200px] rounded-2xl bg-gray-100/95 p-4 shadow-2xl backdrop-blur-md duration-200 sm:right-6 dark:bg-zinc-800/95`}
                >
                    <div className="flex flex-col gap-3">
                        {socialLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-200/80 dark:hover:bg-zinc-700/80"
                                onClick={() => setIsOpen(false)}
                            >
                                <link.icon className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                    {link.name}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
