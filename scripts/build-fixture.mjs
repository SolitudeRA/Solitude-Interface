import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    checkGhostFixture,
    FIXTURE_GROUPS,
    FIXTURE_KEY,
    FIXTURE_LOCALES,
    LEGACY_POST_ID,
    startGhostFixture,
} from './fixtures/ghost.mjs';

const fixture = await startGhostFixture();
let child;
let interrupted = false;
const stop = () => {
    interrupted = true;
    child?.kill('SIGTERM');
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

try {
    await checkGhostFixture(fixture);
    if (interrupted) throw new Error('Fixture build interrupted');
    if (!process.argv.includes('--check')) {
        const exitCode = await new Promise((accept, reject) => {
            child = spawn(process.execPath, [resolve('node_modules/astro/astro.js'), 'build'], {
                stdio: 'inherit',
                env: {
                    ...process.env,
                    GHOST_URL: fixture.origin,
                    GHOST_CONTENT_KEY: FIXTURE_KEY,
                    GHOST_VERSION: 'v5.0',
                    GHOST_TIMEOUT: '5000',
                    SITE_URL: 'https://example.com',
                    IMAGE_HOST_URL: '',
                    SOLITUDE_FIXTURE_IMAGE_URL: `${fixture.origin}/images/card-1.png`,
                    GOOGLE_ANALYTICS_TAG_ID: '',
                    CF_ACCESS_CLIENT_ID: '',
                    CF_ACCESS_CLIENT_SECRET: '',
                    NO_PROXY: '127.0.0.1,localhost',
                    no_proxy: '127.0.0.1,localhost',
                },
            });
            child.once('error', reject);
            child.once('exit', (code) => accept(code ?? 1));
        });
        if (interrupted || exitCode !== 0) {
            throw new Error(
                `Fixture build exited with status ${exitCode}${interrupted ? ' (interrupted)' : ''}`
            );
        }
        for (const locale of FIXTURE_LOCALES) {
            const directory = resolve('dist', locale, 'p');
            assert.equal(
                readdirSync(directory, { withFileTypes: true }).filter((entry) =>
                    entry.isDirectory()
                ).length,
                FIXTURE_GROUPS.length
            );
            for (const key of FIXTURE_GROUPS)
                assert.ok(existsSync(resolve(directory, key, 'index.html')));
        }
        assert.ok(existsSync(resolve('dist/posts', LEGACY_POST_ID, 'index.html')));
        process.stdout.write(
            `Fixture route check: ${FIXTURE_GROUPS.length} articles per locale plus legacy route.\n`
        );
    }
} catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
} finally {
    await fixture.close();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
}
