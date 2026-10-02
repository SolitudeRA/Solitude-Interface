import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import sharp from 'sharp';

export const FIXTURE_LOCALES = ['zh', 'ja', 'en'];
export const FIXTURE_GROUPS = Array.from({ length: 12 }, (_, index) => `fixture-${index + 1}`);
export const FIXTURE_KEY = 'fixture-content-key';
export const LEGACY_POST_ID = 'fixture-legacy';
const PAGE_SIZE = 12;

const tag = (slug) => ({ id: slug, slug, name: slug });
const titles = {
    zh: '性能笔记：图片、导航与长文阅读',
    ja: 'パフォーマンスノート：画像とナビゲーション',
    en: 'Performance notes: images, navigation, and long-form reading',
};

function articleHtml(locale, index) {
    const sections = index === 0 ? 28 : 3;
    return Array.from({ length: sections }, (_, section) => {
        const sample = (index + 1) * 137 + section * 29;
        return `<h2>${titles[locale]} ${section + 1}</h2>
<p>Fixture ${sample}: ${titles[locale]}. The initial document, progressive images, archive filters,
navigation state and code highlighting share a finite rendering budget. Measure cold navigation,
horizontal scrolling and a return from article detail independently.</p>
<p>Sample ${sample + 17} records ${section + 2} entries with a viewport width of ${320 + section * 24}
pixels. A visible preview should remain available while a sharper resource is decoded. Include
keyboard focus, reduced motion, network failure and translated titles in the acceptance checks.</p>
<pre><code class="language-typescript">export function sample${sample}(width: number) {
    const candidates = [160, 480, ${640 + section * 16}];
    return candidates.filter(candidate =&gt; candidate &lt;= width);
}</code></pre>
<table><thead><tr><th>Stage</th><th>Sample</th></tr></thead><tbody>
<tr><td>Preview</td><td>${sample}</td></tr><tr><td>Decoded</td><td>${sample + 31}</td></tr>
</tbody></table>`;
    }).join('\n');
}

function createPosts(origin) {
    const posts = FIXTURE_GROUPS.flatMap((key, index) =>
        FIXTURE_LOCALES.map((locale) => {
            const category = tag(`category-${index % 2 ? 'life' : 'tech'}`);
            return {
                id: `fixture-${locale}-${index + 1}`,
                slug: `${locale}-${key}`,
                title: `${titles[locale]} ${index + 1}`,
                url: `${origin}/${locale}-${key}/`,
                feature_image: `${origin}/images/card-${index + 1}.png`,
                primary_tag: category,
                tags: [
                    category,
                    tag(`hash-lang-${locale}`),
                    tag(`hash-i18n-${key}`),
                    tag(`type-${['article', 'gallery', 'music', 'video'][index % 4]}`),
                    tag('series-fixture'),
                    tag(`topic-${index % 3}`),
                ],
                published_at: `2026-${String(12 - index).padStart(2, '0')}-15T08:00:00.000Z`,
                comment_id: `fixture-${locale}-${index + 1}`,
                excerpt: `${titles[locale]} — fixture ${index + 1}: progressive images, keyboard navigation, archive filters and reading tools.`,
                html: articleHtml(locale, index),
            };
        })
    );
    posts.push({
        ...posts[0],
        id: LEGACY_POST_ID,
        slug: 'legacy-without-i18n',
        title: 'Legacy article without language or translation-group tags',
        tags: [tag('category-tech'), tag('type-article')],
        published_at: '2025-01-01T08:00:00.000Z',
        html: articleHtml('en', 1),
    });
    return posts;
}

async function createImages() {
    const entries = await Promise.all(
        ['cover', 'logo', ...FIXTURE_GROUPS.map((_, index) => `card-${index + 1}`)].map(
            async (name, index) => {
                const width = name === 'logo' ? 96 : 1600;
                const height = name === 'logo' ? 96 : 1000;
                // Geometry only: no system fonts, remote assets, randomness, or timestamps.
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<defs><linearGradient id="g"><stop stop-color="hsl(${index * 23},60%,35%)"/>
<stop offset="1" stop-color="hsl(${index * 23 + 80},70%,65%)"/></linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>
<circle cx="${width * 0.7}" cy="${height * 0.3}" r="${height * 0.25}" fill="#eef" fill-opacity=".4"/>
<path d="M0 ${height} L${width * 0.4} ${height * 0.3} L${width} ${height}Z" fill="#123" fill-opacity=".6"/>
</svg>`;
                return [`/images/${name}.png`, await sharp(Buffer.from(svg)).png().toBuffer()];
            }
        )
    );
    return new Map(entries);
}

/** A deliberately small, strict subset of the Ghost endpoints used by this build. */
export async function startGhostFixture() {
    const images = await createImages();
    let origin;
    let posts;
    const server = createServer((request, response) => {
        const url = new URL(request.url, origin);
        const send = (status, body) => {
            response.writeHead(status, { 'content-type': 'application/json' });
            response.end(JSON.stringify(body));
        };
        if (!['GET', 'HEAD'].includes(request.method)) return send(405, { error: 'read only' });
        if (images.has(url.pathname)) {
            const image = images.get(url.pathname);
            response.writeHead(200, {
                'content-type': 'image/png',
                'content-length': image.length,
                'cache-control': 'public, max-age=31536000, immutable',
            });
            response.end(request.method === 'HEAD' ? undefined : image);
            return;
        }
        if (url.searchParams.get('key') !== FIXTURE_KEY) return send(401, { error: 'invalid key' });
        if (url.pathname === '/ghost/api/content/settings/') {
            return send(200, {
                settings: {
                    title: 'Solitude CI Fixture',
                    description: 'Deterministic multilingual performance fixture',
                    logo: `${origin}/images/logo.png`,
                    icon: `${origin}/images/logo.png`,
                    cover_image: `${origin}/images/cover.png`,
                    twitter: '',
                    timezone: 'UTC',
                    navigation: [],
                },
            });
        }
        if (url.pathname === '/ghost/api/content/pages/') {
            return send(200, {
                pages: ['type', 'category', 'series', 'topic'].map((kind) => ({
                    slug: `tag-registry-${kind}`,
                    html: `<pre><code>${JSON.stringify({ kind, tags: {} })}</code></pre>`,
                })),
            });
        }
        if (url.pathname === '/ghost/api/content/posts/') {
            const filter = url.searchParams.get('filter');
            if (filter && !/^tag:[\w-]+$/.test(filter)) {
                return send(400, { error: `unsupported fixture filter: ${filter}` });
            }
            const filtered = filter
                ? posts.filter((post) => post.tags.some((entry) => entry.slug === filter.slice(4)))
                : posts;
            // A fixed server-side cap exercises the application's pagination loop on every build.
            const limit = Math.min(
                PAGE_SIZE,
                Math.max(1, Number(url.searchParams.get('limit')) || PAGE_SIZE)
            );
            const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
            const pages = Math.ceil(filtered.length / limit);
            return send(200, {
                posts: filtered.slice((page - 1) * limit, page * limit),
                meta: {
                    pagination: {
                        page,
                        limit,
                        pages,
                        total: filtered.length,
                        next: page < pages ? page + 1 : null,
                        prev: page > 1 ? page - 1 : null,
                    },
                },
            });
        }
        return send(404, { error: `unsupported fixture endpoint: ${url.pathname}` });
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
    posts = createPosts(origin);
    return {
        origin,
        posts,
        close: () =>
            new Promise((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()));
                server.closeIdleConnections();
            }),
    };
}

/** Read the actual HTTP surface, including the final page and an optimized-image source. */
export async function checkGhostFixture(fixture) {
    const allPosts = [];
    let page = 1;
    let pages;
    do {
        const response = await fetch(
            `${fixture.origin}/ghost/api/content/posts/?key=${FIXTURE_KEY}&limit=100&page=${page}`
        );
        assert.equal(response.status, 200);
        const payload = await response.json();
        pages = payload.meta.pagination.pages;
        allPosts.push(...payload.posts);
        page++;
    } while (page <= pages);
    assert.ok(pages > 1, 'fixture must exercise API pagination');
    assert.equal(allPosts.length, FIXTURE_GROUPS.length * FIXTURE_LOCALES.length + 1);
    assert.equal(new Set(allPosts.map((post) => post.id)).size, allPosts.length);
    for (const locale of FIXTURE_LOCALES) {
        assert.equal(
            allPosts.filter((post) => post.slug.startsWith(`${locale}-`)).length,
            FIXTURE_GROUPS.length
        );
    }
    assert.ok(allPosts.some((post) => post.id === LEGACY_POST_ID));
    assert.ok(allPosts[0].html.includes('language-typescript'));
    assert.ok(allPosts[0].html.includes('<table>'));
    const response = await fetch(`${fixture.origin}/images/card-1.png`);
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    assert.equal(metadata.width, 1600);
    assert.equal(metadata.height, 1000);
    process.stdout.write(
        `Ghost fixture smoke check: ${allPosts.length} posts, ${pages} API pages, 3 locales, local PNGs.\n`
    );
}
