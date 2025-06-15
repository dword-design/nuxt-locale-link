import { expect, test } from '@playwright/test';
import packageName from 'depcheck-package-name';
import endent from 'endent';
import { execaCommand } from 'execa';
import getPort from 'get-port';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import kill from 'tree-kill-promise';

test('locale link', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
    'i18n/locales': { 'en.json': JSON.stringify({ foo: 'bar' }) },
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: ['${packageName`@nuxtjs/i18n`}', '../../src'],
        i18n: {
          strategy: 'prefix',
          defaultLocale: 'en',
          locales: [
            { code: 'en', file: 'en.json' },
          ],
        },
      });
    `,
    pages: {
      'foo.vue': endent`
        <template>
          <div />
        </template>
      `,
      'index.vue': endent`
        <template>
          <nuxt-locale-link :to="{ name: 'foo' }">
            foo
          </nuxt-locale-link>
        </template>
      `,
    },
  });

  const port = await getPort();
  const nuxt = execaCommand('nuxt dev', { cwd, env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('a')).toHaveAttribute('href', '/en/foo');
  } finally {
    await kill(nuxt.pid);
  }
});
