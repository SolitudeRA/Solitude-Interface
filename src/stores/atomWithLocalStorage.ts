import { atom } from 'jotai';

/**
 * 创建一个与 localStorage 同步的 Jotai atom
 * @param key - localStorage 的键名
 * @param initialValue - 初始值
 * @returns 一个与 localStorage 同步的 atom
 */
export const atomWithLocalStorage = <T>(key: string, initialValue: T) => {
    const getInitialValue = (): T => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const item = localStorage.getItem(key);
            if (item !== null) {
                try {
                    return JSON.parse(item) as T;
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

    const baseAtom = atom<T>(getInitialValue());

    const derivedAtom = atom(
        (get) => get(baseAtom),
        (get, set, update: T | ((prev: T) => T)) => {
            const nextValue =
                typeof update === 'function'
                    ? (update as (prev: T) => T)(get(baseAtom))
                    : update;
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
