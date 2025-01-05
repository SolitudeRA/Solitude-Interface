import type React from "react";
import {Switch} from "@nextui-org/switch";
import {useThemeStore} from "../../../stores/themeStore.ts";

import {GrSun, GrMoon} from "react-icons/gr";

export default function ThemeSwitch() {

    const { themeMode, setThemeMode } = useThemeStore();

    const isDarkMode = themeMode === 'dark';

    return (
        <Switch
            isSelected={isDarkMode}
            color="success"
            size="lg"
            startContent={<GrMoon/>}
            endContent={<GrSun/>}
            className={"shadow-xl rounded-2xl"}
            onValueChange={(isSelected: boolean) => {
                isSelected ? setThemeMode("dark") : setThemeMode("light")
            }}
        />
    );
}