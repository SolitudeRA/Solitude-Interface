import { describe, it, expect } from 'vitest';
import {
    LOCALES,
    DEFAULT_LOCALE,
    isLocale,
    localeToLangTag,
    i18nKeyToTag,
    extractLocaleFromTagSlug,
    extractI18nKeyFromTagSlug,
    extractLocaleFromTags,
    extractI18nKey,
    buildLocalePath,
    buildPostPath,
    generateAlternateLinks,
    getFallbackMessage,
    LOCALE_HTML_LANG,
    LOCALE_NAMES,
} from '@lib/i18n';
import type { PostTag } from '@api/ghost/types';

describe('i18n utilities', () => {
    describe('constants', () => {
        it('should have correct LOCALES', () => {
            expect(LOCALES).toEqual(['zh', 'ja', 'en']);
        });

        it('should have correct DEFAULT_LOCALE', () => {
            expect(DEFAULT_LOCALE).toBe('zh');
        });

        it('should have LOCALE_NAMES for all locales', () => {
            for (const locale of LOCALES) {
                expect(LOCALE_NAMES[locale]).toBeDefined();
                expect(typeof LOCALE_NAMES[locale]).toBe('string');
            }
        });

        it('should have LOCALE_HTML_LANG for all locales', () => {
            for (const locale of LOCALES) {
                expect(LOCALE_HTML_LANG[locale]).toBeDefined();
            }
            expect(LOCALE_HTML_LANG.zh).toBe('zh-CN');
            expect(LOCALE_HTML_LANG.ja).toBe('ja');
            expect(LOCALE_HTML_LANG.en).toBe('en');
        });
    });

    describe('isLocale', () => {
        it('should return true for valid locales', () => {
            expect(isLocale('zh')).toBe(true);
            expect(isLocale('ja')).toBe(true);
            expect(isLocale('en')).toBe(true);
        });

        it('should return false for invalid locales', () => {
            expect(isLocale('fr')).toBe(false);
            expect(isLocale('de')).toBe(false);
            expect(isLocale('')).toBe(false);
            expect(isLocale(null)).toBe(false);
            expect(isLocale(undefined)).toBe(false);
            expect(isLocale(123)).toBe(false);
        });
    });

    describe('localeToLangTag', () => {
        it('should convert locale to Ghost lang tag format', () => {
            expect(localeToLangTag('zh')).toBe('hash-lang-zh');
            expect(localeToLangTag('ja')).toBe('hash-lang-ja');
            expect(localeToLangTag('en')).toBe('hash-lang-en');
        });
    });

    describe('i18nKeyToTag', () => {
        it('should convert i18n key to Ghost tag format', () => {
            expect(i18nKeyToTag('intro-to-solitude')).toBe(
                'hash-i18n-intro-to-solitude',
            );
            expect(i18nKeyToTag('ghost-headless-001')).toBe(
                'hash-i18n-ghost-headless-001',
            );
            expect(i18nKeyToTag('test')).toBe('hash-i18n-test');
        });
    });

    describe('extractLocaleFromTagSlug', () => {
        it('should extract locale from valid tag slug', () => {
            expect(extractLocaleFromTagSlug('hash-lang-zh')).toBe('zh');
            expect(extractLocaleFromTagSlug('hash-lang-ja')).toBe('ja');
            expect(extractLocaleFromTagSlug('hash-lang-en')).toBe('en');
        });

        it('should return null for invalid tag slug', () => {
            expect(extractLocaleFromTagSlug('hash-lang-fr')).toBe(null);
            expect(extractLocaleFromTagSlug('lang-zh')).toBe(null);
            expect(extractLocaleFromTagSlug('hash-i18n-test')).toBe(null);
            expect(extractLocaleFromTagSlug('')).toBe(null);
        });
    });

    describe('extractI18nKeyFromTagSlug', () => {
        it('should extract i18n key from valid tag slug', () => {
            expect(
                extractI18nKeyFromTagSlug('hash-i18n-intro-to-solitude'),
            ).toBe('intro-to-solitude');
            expect(
                extractI18nKeyFromTagSlug('hash-i18n-ghost-headless-001'),
            ).toBe('ghost-headless-001');
            expect(extractI18nKeyFromTagSlug('hash-i18n-test')).toBe('test');
        });

        it('should return null for invalid tag slug', () => {
            expect(extractI18nKeyFromTagSlug('hash-lang-zh')).toBe(null);
            expect(extractI18nKeyFromTagSlug('i18n-test')).toBe(null);
            expect(extractI18nKeyFromTagSlug('')).toBe(null);
        });
    });

    describe('extractLocaleFromTags', () => {
        const createTag = (slug: string): PostTag => ({
            id: 'tag-id',
            slug,
            name: 'Tag Name',
        });

        it('should extract locale from tags array', () => {
            const tags = [
                createTag('category-tech'),
                createTag('hash-lang-ja'),
                createTag('hash-i18n-test'),
            ];
            expect(extractLocaleFromTags(tags)).toBe('ja');
        });

        it('should return null if no lang tag found', () => {
            const tags = [
                createTag('category-tech'),
                createTag('hash-i18n-test'),
            ];
            expect(extractLocaleFromTags(tags)).toBe(null);
        });

        it('should return null for empty or undefined tags', () => {
            expect(extractLocaleFromTags([])).toBe(null);
            expect(extractLocaleFromTags(undefined)).toBe(null);
        });
    });

    describe('extractI18nKey', () => {
        const createTag = (slug: string): PostTag => ({
            id: 'tag-id',
            slug,
            name: 'Tag Name',
        });

        it('should extract i18n key from tags array', () => {
            const tags = [
                createTag('category-tech'),
                createTag('hash-lang-zh'),
                createTag('hash-i18n-intro-to-solitude'),
            ];
            expect(extractI18nKey(tags)).toBe('intro-to-solitude');
        });

        it('should return null if no i18n tag found', () => {
            const tags = [
                createTag('category-tech'),
                createTag('hash-lang-zh'),
            ];
            expect(extractI18nKey(tags)).toBe(null);
        });

        it('should return null for empty or undefined tags', () => {
            expect(extractI18nKey([])).toBe(null);
            expect(extractI18nKey(undefined)).toBe(null);
        });
    });

    describe('buildLocalePath', () => {
        it('should build locale path correctly', () => {
            expect(buildLocalePath('zh')).toBe('/zh');
            expect(buildLocalePath('ja', '')).toBe('/ja');
            expect(buildLocalePath('en', 'about')).toBe('/en/about');
            expect(buildLocalePath('zh', '/about')).toBe('/zh/about');
        });
    });

    describe('buildPostPath', () => {
        it('should build post path correctly', () => {
            expect(buildPostPath('zh', 'intro-to-solitude')).toBe(
                '/zh/p/intro-to-solitude',
            );
            expect(buildPostPath('ja', 'ghost-headless')).toBe(
                '/ja/p/ghost-headless',
            );
            expect(buildPostPath('en', 'test')).toBe('/en/p/test');
        });
    });

    describe('generateAlternateLinks', () => {
        it('should generate alternate links for available locales', () => {
            const links = generateAlternateLinks(
                'https://example.com',
                '/p/test',
                ['zh', 'en'],
            );

            expect(links).toHaveLength(3); // zh, en, x-default
            expect(links).toContainEqual({
                hreflang: 'zh-CN',
                href: 'https://example.com/zh/p/test',
            });
            expect(links).toContainEqual({
                hreflang: 'en',
                href: 'https://example.com/en/p/test',
            });
            expect(links).toContainEqual({
                hreflang: 'x-default',
                href: 'https://example.com/zh/p/test',
            });
        });

        it('should not include x-default if DEFAULT_LOCALE is not available', () => {
            const links = generateAlternateLinks(
                'https://example.com',
                '/p/test',
                ['ja', 'en'],
            );

            expect(links).toHaveLength(2); // ja, en only
            expect(
                links.find((l) => l.hreflang === 'x-default'),
            ).toBeUndefined();
        });
    });

    describe('getFallbackMessage', () => {
        it('should return empty string when same locale', () => {
            expect(getFallbackMessage('zh', 'zh')).toBe('');
            expect(getFallbackMessage('ja', 'ja')).toBe('');
            expect(getFallbackMessage('en', 'en')).toBe('');
        });

        it('should return correct message for zh user seeing fallback', () => {
            expect(getFallbackMessage('ja', 'zh')).toContain('中国語版');
            expect(getFallbackMessage('en', 'zh')).toContain('Chinese');
        });

        it('should return correct message for ja user seeing fallback', () => {
            expect(getFallbackMessage('zh', 'ja')).toContain('日文');
            expect(getFallbackMessage('en', 'ja')).toContain('Japanese');
        });

        it('should return correct message for en user seeing fallback', () => {
            expect(getFallbackMessage('zh', 'en')).toContain('英文');
            expect(getFallbackMessage('ja', 'en')).toContain('英語');
        });
    });
});
