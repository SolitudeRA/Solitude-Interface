import { Switch } from '@api/shadcn/components/ui/switch';

export default function ThemeSwitch() {
    const { themeMode, setThemeMode } = useThemeStore();

    const isLightMode = themeMode === 'light';

    return <Switch onCheckedChange={} />;
}

function themeSwitch() {
    
}
