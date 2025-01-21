import {Switch} from "@heroui/switch";
import {useThemeStore} from "@stores/themeStore.ts";

import {GrSun, GrMoon} from "react-icons/gr";

export default function ThemeSwitch() {

    const {themeMode, setThemeMode} = useThemeStore();

    const isLightMode = themeMode === 'light';

    return (
        <Switch
            isSelected={isLightMode}
            classNames={{
                wrapper: "bg-default-200"
            }}
            color="warning"
            size="lg"
            startContent={<GrSun/>}
            endContent={<GrMoon/>}
            className={"shadow-xl rounded-2xl"}
            onValueChange={(isSelected: boolean) => {
                isSelected ?  setThemeMode("light") : setThemeMode("dark")
            }}
        />
    );
}