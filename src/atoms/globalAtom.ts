import {atomWithStorage} from "jotai/utils"

export const globalThemeAtom = atomWithStorage('theme', 'light', {
    getItem(key, initialValue) {
        const storedValue = localStorage.getItem(key)
        return storedValue ?? initialValue
    },
    setItem(key, value) {
        localStorage.setItem(key, value);
        const event = new CustomEvent('storage', {
            detail: {key, newValue: value}
        });
        window.dispatchEvent(event);
    },
    removeItem(key) {
        localStorage.removeItem(key)
    }
})
