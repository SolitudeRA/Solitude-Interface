import { atomWithLocalStorage } from './atomWithLocalStorage';
import type { ThemeMode } from '../types/theme';

export const themeSwitchAtom = atomWithLocalStorage<ThemeMode>('theme', 'dark');
