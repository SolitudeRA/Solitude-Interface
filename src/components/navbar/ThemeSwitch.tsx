import {Switch} from "@nextui-org/switch";
import type React from "react";
import {useAtom} from "jotai";
import {globalThemeAtom} from "../../atoms/globalAtom.ts";

import {GrSun, GrMoon} from "react-icons/gr";

export default function ThemeSwitch() {
    const [globalTheme, setGlobalTheme] = useAtom(globalThemeAtom)

    return (
        <Switch
            color="success"
            size="lg"
            startContent={<GrMoon/>}
            endContent={<GrSun/>}
            className={"shadow-xl rounded-2xl"}
            onValueChange={(isSelected: boolean) => {
                isSelected ? setGlobalTheme("dark") : setGlobalTheme("light")
            }}
        />
    );
}