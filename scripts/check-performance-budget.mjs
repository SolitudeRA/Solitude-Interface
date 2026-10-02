import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const KIB = 1024;
const DIST_DIRECTORY = resolve(process.cwd(), 'dist');

// Remote executable resources cannot be included in the local byte graph. Keep
// the exceptions deliberately path-specific so a new CDN or third-party asset
// fails the budget instead of disappearing from the report.
const EXTERNAL_RESOURCE_ALLOWLIST = [
    {
        type: 'javascript',
        origin: 'https://www.googletagmanager.com',
        pathname: '/gtag/js',
    },
    {
        type: 'javascript',
        origin: 'https://www.google-analytics.com',
        pathname: '/analytics.js',
    },
];

// Budgets are gzip-transfer approximations, expressed in KiB. They intentionally
// leave modest headroom while still catching accidental React/client-island or
// global-stylesheet regressions on routes that should stay mostly static.
const ROUTE_BUDGETS = [
    {
        id: 'zh-home',
        label: 'zh home',
        htmlPath: () => join(DIST_DIRECTORY, 'zh', 'index.html'),
        // Horizontal cards intentionally ship their tiny 160px previews so fast scrolling never
        // exposes a dark placeholder. Keep roughly 20% headroom around that fixed-src floor.
        limits: { html: 21.7, javascript: 15.8, stylesheets: 28, eagerImages: 29.5 },
        expectsWebFont: false,
    },
    {
        id: 'zh-post-view',
        label: 'zh post view',
        htmlPath: () => join(DIST_DIRECTORY, 'zh', 'post-view', 'index.html'),
        limits: { html: 27.5, javascript: 20.5, stylesheets: 32.5, eagerImages: 43 },
        expectsWebFont: false,
    },
    {
        id: 'zh-article',
        label: 'largest zh article (strongest gzip HTML sample)',
        htmlPath: findLargestZhArticle,
        limits: { html: 32, javascript: 17.2, stylesheets: 84, eagerImages: 4.3 },
        expectsWebFont: true,
    },
];

const DIRECT_PATH_BUDGETS = [
    {
        id: 'zh-post-archive',
        label: 'zh post archive direct list (initial + activation)',
        route: '/zh/post-view?view=list',
        htmlPath: () => join(DIST_DIRECTORY, 'zh', 'post-view', 'index.html'),
        componentUrlIncludes: 'PostArchiveView',
        clients: ['visible', 'media'],
        dataPath: () => join(DIST_DIRECTORY, 'zh', 'post-archive.json'),
        // Activation stays independently bounded so a heavy dependency cannot
        // hide behind chunks already present in the initial route graph.
        limits: { activationJavascript: 103, javascript: 118, data: 12.5 },
    },
];

function fail(message) {
    process.stderr.write(`Performance budget error: ${message}\n`);
    process.exitCode = 1;
}

function findLargestZhArticle() {
    const articlesDirectory = join(DIST_DIRECTORY, 'zh', 'p');

    if (!existsSync(articlesDirectory)) {
        return join(articlesDirectory, '<missing>', 'index.html');
    }

    const articles = readdirSync(articlesDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(articlesDirectory, entry.name, 'index.html'))
        .filter(existsSync);

    let article;
    let largestSize = -1;
    for (const candidate of articles) {
        const candidateSize = gzipSize(candidate);
        if (candidateSize > largestSize) {
            article = candidate;
            largestSize = candidateSize;
        }
    }

    return article ?? join(articlesDirectory, '<missing>', 'index.html');
}

function parseAttributes(source) {
    const attributes = new Map();
    const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

    for (const match of source.matchAll(attributePattern)) {
        attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
    }

    return attributes;
}

function stripUrlSuffix(value) {
    return value.split(/[?#]/, 1)[0];
}

function parseExternalResource(specifier) {
    const value = specifier.trim();
    if (value.startsWith('//')) return new URL(`https:${value}`);
    if (!/^[a-z][a-z\d+.-]*:/i.test(value)) return null;

    try {
        return new URL(value);
    } catch {
        throw new Error(`invalid external resource URL: ${value}`);
    }
}

function assertExternalResourceAllowed(specifier, type) {
    const resource = parseExternalResource(specifier);
    if (!resource) return null;

    const allowed = EXTERNAL_RESOURCE_ALLOWLIST.some(
        (entry) =>
            entry.type === type &&
            entry.origin === resource.origin &&
            entry.pathname === resource.pathname
    );

    if (!allowed) {
        throw new Error(
            `unbudgeted external ${type} resource is not allowlisted: ${resource.href}`
        );
    }

    return resource.href;
}

function resolveAsset(specifier, importer) {
    const cleanSpecifier = stripUrlSuffix(specifier);

    if (
        cleanSpecifier.length === 0 ||
        cleanSpecifier.startsWith('data:') ||
        cleanSpecifier.startsWith('//') ||
        /^[a-z][a-z\d+.-]*:/i.test(cleanSpecifier)
    ) {
        return null;
    }

    const assetPath = cleanSpecifier.startsWith('/')
        ? resolve(DIST_DIRECTORY, `.${cleanSpecifier}`)
        : resolve(dirname(importer), cleanSpecifier);
    const relativePath = relative(DIST_DIRECTORY, assetPath);

    if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
        return null;
    }

    return assetPath;
}

function resolveMeasuredAsset(specifier, importer, type, externalResources) {
    const externalResource = assertExternalResourceAllowed(specifier, type);
    if (externalResource) {
        externalResources?.add(externalResource);
        return null;
    }

    return resolveAsset(specifier, importer);
}

function extractHtmlEntrypoints(html, htmlPath) {
    const javascript = new Set();
    const stylesheets = new Set();
    const externalJavascript = new Set();
    const externalStylesheets = new Set();

    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        const attributes = parseAttributes(match[1]);
        const type = attributes.get('type')?.toLowerCase();
        const source = attributes.get('src');
        const isJavascript = !type || type === 'module' || /(?:java|ecma)script/.test(type);
        if (source && isJavascript) {
            const asset = resolveMeasuredAsset(source, htmlPath, 'javascript', externalJavascript);
            if (asset) javascript.add(asset);
        }

        if (type !== 'module') continue;

        // A literal import() at top level in an inline module starts loading as
        // soon as that module executes, so include it as an HTML entrypoint.
        for (const specifier of extractModuleSpecifiers(match[2], { includeDynamic: true })) {
            const asset = resolveMeasuredAsset(
                specifier,
                htmlPath,
                'javascript',
                externalJavascript
            );
            if (asset) javascript.add(asset);
        }
    }

    for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
        const attributes = parseAttributes(match[1]);
        const relValues = (attributes.get('rel') ?? '').toLowerCase().split(/\s+/);
        const href = attributes.get('href');

        if (!href) continue;

        if (relValues.includes('stylesheet')) {
            const asset = resolveMeasuredAsset(href, htmlPath, 'stylesheet', externalStylesheets);
            if (asset) stylesheets.add(asset);
        }

        if (relValues.includes('modulepreload')) {
            const asset = resolveMeasuredAsset(href, htmlPath, 'javascript', externalJavascript);
            if (asset) javascript.add(asset);
        }
    }

    // Astro stores hydrated island entrypoints in attributes rather than in
    // import literals. load/idle/only islands join the early-load graph; visible
    // and media islands remain deferred and are deliberately excluded.
    for (const match of html.matchAll(/<astro-island\b([^>]*)>/gi)) {
        const attributes = parseAttributes(match[1]);
        const clientDirective = attributes.get('client')?.toLowerCase();

        if (!clientDirective || !['load', 'idle', 'only'].includes(clientDirective)) {
            continue;
        }

        for (const attribute of ['component-url', 'renderer-url']) {
            const source = attributes.get(attribute);
            if (!source) continue;

            const asset = resolveMeasuredAsset(source, htmlPath, 'javascript', externalJavascript);
            if (asset) javascript.add(asset);
        }
    }

    return { javascript, stylesheets, externalJavascript, externalStylesheets };
}

function extractDeferredIslandEntrypoints(html, htmlPath, budget) {
    const javascript = new Set();
    const externalJavascript = new Set();
    let expectedMatches = 0;

    for (const match of html.matchAll(/<astro-island\b([^>]*)>/gi)) {
        const attributes = parseAttributes(match[1]);
        const clientDirective = attributes.get('client')?.toLowerCase();
        const componentUrl = attributes.get('component-url') ?? '';

        if (!clientDirective || !budget.clients.includes(clientDirective)) {
            continue;
        }

        if (!componentUrl.includes(budget.componentUrlIncludes)) continue;

        expectedMatches += 1;
        for (const attribute of ['component-url', 'renderer-url']) {
            const source = attributes.get(attribute);
            if (!source) continue;

            const asset = resolveMeasuredAsset(source, htmlPath, 'javascript', externalJavascript);
            if (asset) javascript.add(asset);
        }
    }

    if (expectedMatches === 0) {
        throw new Error(
            `${budget.label} island was not found (${budget.clients.join('/')} + ${budget.componentUrlIncludes})`
        );
    }

    return { javascript, externalJavascript };
}

function extractModuleSpecifiers(source, { includeDynamic = false } = {}) {
    const specifiers = new Set();
    // Vite removes whitespace in production (`import{x}from"./chunk.js"`), so
    // do not require spaces around `from`. Stop at statement/string boundaries
    // to avoid drifting into unrelated literals.
    const staticImportPattern = /\b(?:import|export)(?:[^'"`;]*?\bfrom)?\s*["']([^"']+)["']/g;
    const dynamicImportPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

    const patterns = includeDynamic
        ? [staticImportPattern, dynamicImportPattern]
        : [staticImportPattern];

    for (const pattern of patterns) {
        for (const match of source.matchAll(pattern)) {
            specifiers.add(match[1]);
        }
    }

    return specifiers;
}

function extractStylesheetImportSpecifiers(source) {
    const specifiers = new Set();
    const importPattern =
        /@import\s+(?:url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)'";]+))\s*\)|"([^"]+)"|'([^']+)')/gi;

    for (const match of source.matchAll(importPattern)) {
        const specifier = match.slice(1).find((candidate) => candidate !== undefined);
        if (specifier) specifiers.add(specifier);
    }

    return specifiers;
}

function collectJavascriptGraph(entrypoints, externalResources = new Set()) {
    const graph = new Set();
    const queue = [...entrypoints];

    while (queue.length > 0) {
        const asset = queue.pop();
        if (!asset || graph.has(asset)) continue;

        if (!existsSync(asset) || !statSync(asset).isFile()) {
            throw new Error(`referenced JavaScript asset is missing: ${relativeToDist(asset)}`);
        }

        graph.add(asset);
        const source = readFileSync(asset, 'utf8');

        for (const specifier of extractModuleSpecifiers(source)) {
            const dependency = resolveMeasuredAsset(
                specifier,
                asset,
                'javascript',
                externalResources
            );
            if (dependency && !graph.has(dependency)) queue.push(dependency);
        }
    }

    return graph;
}

function collectStylesheetGraph(entrypoints, externalResources = new Set()) {
    const graph = new Set();
    const queue = [...entrypoints];

    while (queue.length > 0) {
        const asset = queue.pop();
        if (!asset || graph.has(asset)) continue;

        if (!existsSync(asset) || !statSync(asset).isFile()) {
            throw new Error(`referenced stylesheet is missing: ${relativeToDist(asset)}`);
        }

        graph.add(asset);
        const source = readFileSync(asset, 'utf8');

        for (const specifier of extractStylesheetImportSpecifiers(source)) {
            const dependency = resolveMeasuredAsset(
                specifier,
                asset,
                'stylesheet',
                externalResources
            );
            if (dependency && !graph.has(dependency)) queue.push(dependency);
        }
    }

    return graph;
}

function collectEagerFixedImageSources(html, htmlPath) {
    // A static artifact cannot know which srcset candidate a viewport chooses or
    // when a data-progressive-src upgrade runs. Measure only eager/default local
    // img[src] values outside <picture>/<noscript>; this is an exact raw-file
    // footprint for fixed sources, not a claim about total runtime image bytes.
    const fixedSourceHtml = html
        .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
        .replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, '');
    const images = new Set();

    for (const match of fixedSourceHtml.matchAll(/<img\b([^>]*)>/gi)) {
        const attributes = parseAttributes(match[1]);
        const source = attributes.get('src');
        if (!source || attributes.has('srcset')) continue;
        if (attributes.get('loading')?.toLowerCase() === 'lazy') continue;

        const image = resolveAsset(source, htmlPath);
        if (!image) continue;
        if (!existsSync(image) || !statSync(image).isFile()) {
            throw new Error(`referenced eager image is missing: ${relativeToDist(image)}`);
        }

        images.add(image);
    }

    return images;
}

function gzipSize(filePath) {
    return gzipSync(readFileSync(filePath), { level: 9 }).byteLength;
}

function sumGzipSizes(files) {
    return [...files].reduce((total, filePath) => total + gzipSize(filePath), 0);
}

function sumRawSizes(files) {
    return [...files].reduce((total, filePath) => total + statSync(filePath).size, 0);
}

function relativeToDist(filePath) {
    return relative(DIST_DIRECTORY, filePath).split(sep).join('/');
}

function formatKib(bytes) {
    return (bytes / KIB).toFixed(1);
}

function formatMeasurement(value, limit, fileCount) {
    const count = fileCount === undefined ? '' : `, ${fileCount} files`;
    return `${formatKib(value)} / ${limit.toFixed(1)} KiB${count}`;
}

function measureRoute(route) {
    const htmlPath = route.htmlPath();

    if (!existsSync(htmlPath)) {
        throw new Error(`required route output is missing: ${relativeToDist(htmlPath)}`);
    }

    const html = readFileSync(htmlPath, 'utf8');
    const entrypoints = extractHtmlEntrypoints(html, htmlPath);
    const javascript = collectJavascriptGraph(
        entrypoints.javascript,
        entrypoints.externalJavascript
    );
    const stylesheets = collectStylesheetGraph(
        entrypoints.stylesheets,
        entrypoints.externalStylesheets
    );
    const eagerImages = collectEagerFixedImageSources(html, htmlPath);

    return {
        ...route,
        htmlPath,
        hasWebFont: /<link\b(?=[^>]*\bdata-solitude-font(?:\s|=|>))[^>]*>/i.test(html),
        sizes: {
            html: gzipSize(htmlPath),
            javascript: sumGzipSizes(javascript),
            stylesheets: sumGzipSizes(stylesheets),
            eagerImages: sumRawSizes(eagerImages),
        },
        files: {
            javascript: javascript.size,
            stylesheets: stylesheets.size,
            eagerImages: eagerImages.size,
            externalJavascript: entrypoints.externalJavascript.size,
            externalStylesheets: entrypoints.externalStylesheets.size,
        },
    };
}

function measureDirectPathBudget(budget) {
    const htmlPath = budget.htmlPath();
    const dataPath = budget.dataPath();

    if (!existsSync(htmlPath)) {
        throw new Error(`required route output is missing: ${relativeToDist(htmlPath)}`);
    }
    if (!existsSync(dataPath)) {
        throw new Error(`required direct-path data is missing: ${relativeToDist(dataPath)}`);
    }

    const html = readFileSync(htmlPath, 'utf8');
    const initialEntrypoints = extractHtmlEntrypoints(html, htmlPath);
    const activationEntrypoints = extractDeferredIslandEntrypoints(html, htmlPath, budget);
    const activationExternalJavascript = new Set(activationEntrypoints.externalJavascript);
    const activationJavascript = collectJavascriptGraph(
        activationEntrypoints.javascript,
        activationExternalJavascript
    );
    const directEntrypoints = new Set([
        ...initialEntrypoints.javascript,
        ...activationEntrypoints.javascript,
    ]);
    const directExternalJavascript = new Set([
        ...initialEntrypoints.externalJavascript,
        ...activationEntrypoints.externalJavascript,
    ]);
    const javascript = collectJavascriptGraph(directEntrypoints, directExternalJavascript);

    return {
        ...budget,
        htmlPath,
        dataPath,
        sizes: {
            activationJavascript: sumGzipSizes(activationJavascript),
            javascript: sumGzipSizes(javascript),
            data: gzipSize(dataPath),
        },
        files: {
            activationJavascript: activationJavascript.size,
            javascript: javascript.size,
            externalJavascript: directExternalJavascript.size,
        },
    };
}

function printReport(results) {
    process.stdout.write('Performance budget report (gzip)\n');

    for (const result of results) {
        process.stdout.write(`\n${result.label} (${relativeToDist(result.htmlPath)})\n`);
        process.stdout.write(
            `  HTML        ${formatMeasurement(result.sizes.html, result.limits.html)}\n`
        );
        process.stdout.write(
            `  Initial JS  ${formatMeasurement(
                result.sizes.javascript,
                result.limits.javascript,
                result.files.javascript
            )}\n`
        );
        process.stdout.write(
            `  Stylesheets ${formatMeasurement(
                result.sizes.stylesheets,
                result.limits.stylesheets,
                result.files.stylesheets
            )}\n`
        );
        process.stdout.write(
            `  Eager images ${formatMeasurement(
                result.sizes.eagerImages,
                result.limits.eagerImages,
                result.files.eagerImages
            )} raw fixed-src floor\n`
        );
        process.stdout.write(
            `  Static ext. ${result.files.externalJavascript} allowlisted JS, ${result.files.externalStylesheets} allowlisted CSS\n`
        );
        process.stdout.write(
            `  Web font    ${result.hasWebFont ? 'enabled' : 'disabled'} (expected ${result.expectsWebFont ? 'enabled' : 'disabled'})\n`
        );
    }

    process.stdout.write(
        '\nImage boundary: raw eager/default local img[src] files outside picture/srcset; runtime progressive upgrades and viewport-selected candidates require browser measurement.\n'
    );
    process.stdout.write(
        'External boundary: static script/link tags, module imports, and CSS @import are enforced; runtime-created resources require browser measurement.\n'
    );
}

function printDirectPathReport(results) {
    for (const result of results) {
        process.stdout.write(
            `\n${result.label} (${result.route}; data ${relativeToDist(result.dataPath)})\n`
        );
        process.stdout.write(
            `  Activation JS ${formatMeasurement(
                result.sizes.activationJavascript,
                result.limits.activationJavascript,
                result.files.activationJavascript
            )}\n`
        );
        process.stdout.write(
            `  Direct-path JS ${formatMeasurement(
                result.sizes.javascript,
                result.limits.javascript,
                result.files.javascript
            )}\n`
        );
        process.stdout.write(
            `  Data JSON   ${formatMeasurement(result.sizes.data, result.limits.data)}\n`
        );
        process.stdout.write(`  Static ext. ${result.files.externalJavascript} allowlisted JS\n`);
    }
}

function runSelfTests({ report = true } = {}) {
    const syntheticHtmlPath = join(DIST_DIRECTORY, 'synthetic', 'index.html');

    assert.throws(
        () =>
            extractHtmlEntrypoints(
                '<script src="https://cdn.example.com/application.js"></script>',
                syntheticHtmlPath
            ),
        /not allowlisted/
    );
    assert.throws(
        () =>
            extractHtmlEntrypoints(
                '<link rel="stylesheet" href="https://cdn.example.com/application.css">',
                syntheticHtmlPath
            ),
        /not allowlisted/
    );
    assert.doesNotThrow(() =>
        extractHtmlEntrypoints(
            '<link rel="preconnect" href="https://cdn.example.com"><link rel="canonical" href="https://example.com/page">',
            syntheticHtmlPath
        )
    );
    assert.equal(
        assertExternalResourceAllowed(
            'https://www.googletagmanager.com/gtag/js?id=G-TEST',
            'javascript'
        ),
        'https://www.googletagmanager.com/gtag/js?id=G-TEST'
    );
    assert.deepEqual(
        [...extractStylesheetImportSpecifiers('@import url(theme.css); @import "print.css";')],
        ['theme.css', 'print.css']
    );

    if (report) process.stdout.write('Performance budget helper self-tests passed.\n');
}

if (process.argv.includes('--self-test')) {
    try {
        runSelfTests();
    } catch (error) {
        fail(error instanceof Error ? error.message : String(error));
    }
} else if (!existsSync(DIST_DIRECTORY)) {
    fail(`dist directory does not exist at ${DIST_DIRECTORY}; run pnpm build first.`);
} else {
    try {
        runSelfTests({ report: false });
        const results = ROUTE_BUDGETS.map(measureRoute);
        const directPathResults = DIRECT_PATH_BUDGETS.map(measureDirectPathBudget);
        const violations = [];

        printReport(results);
        printDirectPathReport(directPathResults);

        for (const result of results) {
            if (result.hasWebFont !== result.expectsWebFont) {
                violations.push(
                    `${result.label} web font: expected ${result.expectsWebFont ? 'enabled' : 'disabled'}, found ${result.hasWebFont ? 'enabled' : 'disabled'}`
                );
            }

            for (const metric of ['html', 'javascript', 'stylesheets', 'eagerImages']) {
                const actualKib = result.sizes[metric] / KIB;
                const limitKib = result.limits[metric];

                if (actualKib > limitKib) {
                    violations.push(
                        `${result.label} ${metric}: ${actualKib.toFixed(1)} KiB exceeds ${limitKib.toFixed(1)} KiB`
                    );
                }
            }
        }

        for (const result of directPathResults) {
            for (const metric of ['activationJavascript', 'javascript', 'data']) {
                const actualKib = result.sizes[metric] / KIB;
                const limitKib = result.limits[metric];

                if (actualKib > limitKib) {
                    violations.push(
                        `${result.label} ${metric}: ${actualKib.toFixed(1)} KiB exceeds ${limitKib.toFixed(1)} KiB`
                    );
                }
            }
        }

        if (violations.length > 0) {
            process.stderr.write(`\nPerformance budget exceeded:\n- ${violations.join('\n- ')}\n`);
            process.exitCode = 1;
        } else {
            process.stdout.write('\nAll performance budgets passed.\n');
        }
    } catch (error) {
        fail(error instanceof Error ? error.message : String(error));
    }
}
