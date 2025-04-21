import { Switch } from '@api/shadcn/components/ui/switch';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { themeSwitchAtom } from '../../../atoms/themeAtom';

export default function ThemeSwitch() {
    const [theme, setTheme] = useAtom(themeSwitchAtom);
    
    const isLightMode = theme === 'light';
    
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const handleThemeChange = (checked: boolean) => {
        setTheme(checked ? 'light' : 'dark');
    };

    return <Switch 
        checked={isLightMode} 
        onCheckedChange={handleThemeChange} 
    />;
}
