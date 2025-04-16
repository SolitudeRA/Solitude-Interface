import { atom } from 'jotai';

export const atomWithLocalStorage = (key: string, initialValue: any) => {
    const getInitialValue = () => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const item = localStorage.getItem(key);
            if (item !== null) {
                try {
                    return JSON.parse(item);
                } catch (error) {
                    console.error(
                        `Error parsing localStorage item for key "${key}":`,
                        error,
                    );
                    return initialValue;
                }
            }
        }
        return initialValue;
    };

    const baseAtom = atom(getInitialValue());

    const derivedAtom = atom(
        (get) => get(baseAtom),
        (get, set, update) => {
            const nextValue =
                typeof update === 'function' ? update(get(baseAtom)) : update;
            set(baseAtom, nextValue);

            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    localStorage.setItem(key, JSON.stringify(nextValue));
                } catch (error) {
                    console.error(
                        `Error saving to localStorage for key "${key}":`,
                        error,
                    );
                }
            }
        },
    );

    return derivedAtom;
};
