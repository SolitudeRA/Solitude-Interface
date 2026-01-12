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
                'border-border border transition-all duration-300',
                'shadow-md hover:shadow-lg',
                'data-[state=checked]:bg-amber-100 data-[state=unchecked]:bg-neutral-900',
                'data-[state=checked]:border-amber-300 data-[state=unchecked]:border-neutral-700',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            )}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    'pointer-events-none flex h-6 w-6 items-center justify-center rounded-full',
                    'shadow-lg transition-all duration-300',
                    'data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-1',
                    'data-[state=checked]:bg-amber-400 data-[state=unchecked]:bg-neutral-600',
                    'data-[state=checked]:shadow-amber-300/50 data-[state=unchecked]:shadow-black/50',
                )}
            >
                {isLightMode ? (
                    <Sun
                        className="h-4 w-4 text-amber-800 transition-transform duration-300"
                        strokeWidth={2.5}
                    />
                ) : (
                    <Moon
                        className="h-4 w-4 text-slate-200 transition-transform duration-300"
                        strokeWidth={2.5}
                    />
                )}
            </SwitchPrimitive.Thumb>
        </SwitchPrimitive.Root>
    );
}
