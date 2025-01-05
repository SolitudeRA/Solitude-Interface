import {create} from 'zustand'
import {persist, createJSONStorage} from "zustand/middleware";

interface ThemeState {
    themeMode: string,
    setThemeMode: (themeMode: string) => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (setState) => ({
            themeMode: 'light',
            setThemeMode: (themeMode: string) => {
                setState({themeMode: themeMode})
                const event = new CustomEvent('themeModeChanged', {
                    detail: {newValue: themeMode}
                });
                window.dispatchEvent(event)
            },
        }),
        {
            name: 'theme',
            storage: createJSONStorage(() => localStorage),
        }
    )
);