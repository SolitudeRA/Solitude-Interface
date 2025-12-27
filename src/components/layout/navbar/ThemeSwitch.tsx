import { Switch } from '@components/common/switch';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { themeSwitchAtom } from '@stores/themeAtom';

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

    return <Switch checked={isLightMode} onCheckedChange={handleThemeChange} />;
}
