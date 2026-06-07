import * as SwitchPrimitive from '@radix-ui/react-switch';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { themeSwitchAtom } from '@stores/themeAtom';
import { cn } from '@components/common/lib/utils';

export default function ThemeSwitch() {
    const [theme, setTheme] = useAtom(themeSwitchAtom);

    const isLightMode = theme === 'light';

    useEffect(() => {
        // 更新 DOM 类名
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');

        // 触发自定义事件通知其他组件主题已更改
        const event = new CustomEvent('themeChanged', {
            detail: { theme },
        });
        window.dispatchEvent(event);
    }, [theme]);

    const handleThemeChange = (checked: boolean) => {
        const newTheme = checked ? 'light' : 'dark';
        setTheme(newTheme);
    };

    return (
        <SwitchPrimitive.Root
            checked={isLightMode}
            onCheckedChange={handleThemeChange}
            className={cn(
                'peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full',
                'border transition-all duration-300',
                'border-[var(--top-control-border)] bg-[var(--top-control-bg)] text-[var(--top-control-text)]',
                'shadow-[0_8px_24px_var(--top-control-shadow)] hover:bg-[var(--top-control-bg-hover)] hover:shadow-[0_10px_28px_var(--top-control-shadow-hover)]',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            )}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    'pointer-events-none flex h-6 w-6 items-center justify-center rounded-full',
                    'transition-all duration-300',
                    'data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-1',
                    'bg-[var(--top-control-thumb-bg)] text-[var(--top-control-thumb-text)]',
                    'shadow-[0_6px_18px_var(--top-control-thumb-shadow)]'
                )}
            >
                {isLightMode ? (
                    <Sun
                        className="h-4 w-4 text-current transition-transform duration-300"
                        strokeWidth={2.5}
                    />
                ) : (
                    <Moon
                        className="h-4 w-4 text-current transition-transform duration-300"
                        strokeWidth={2.5}
                    />
                )}
            </SwitchPrimitive.Thumb>
        </SwitchPrimitive.Root>
    );
}
