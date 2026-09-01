/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/*
Verifies the Progressive Web App (PWA) integration of the bundled index.html: the
web app manifest that makes Open MCT installable, and the service worker that
the PWA plugin registers to make the build available offline.
*/

import { expect, test } from '../../pluginFixtures.js';

const CACHE_NAME_PREFIX = 'openmct-pwa-';

test.describe('Progressive Web App', () => {
  test('The page declares a valid web app manifest with installable icons', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /manifest\.json$/);
    const manifestHref = await manifestLink.getAttribute('href');

    const manifest = await page.evaluate(async (href) => {
      const response = await fetch(href);

      return response.ok ? response.json() : null;
    }, manifestHref);

    expect(manifest.name).toBe('Open MCT');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBeTruthy();

    const sizes = manifest.icons.map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);

    const iconStatuses = await page.evaluate(
      ({ href, icons }) => {
        const manifestUrl = new URL(href, window.location.href);

        return Promise.all(
          icons.map(async (icon) => {
            const response = await fetch(new URL(icon.src, manifestUrl));

            return { src: icon.src, ok: response.ok, type: response.headers.get('content-type') };
          })
        );
      },
      { href: manifestHref, icons: manifest.icons }
    );
    for (const icon of iconStatuses) {
      expect(icon.ok, `${icon.src} should be served`).toBe(true);
      expect(icon.type, `${icon.src} should be an image`).toMatch(/^image\//);
    }
  });

  test('The service worker is not registered for a page outside its scope', async ({ page }) => {
    // The development server serves index.html from "/" and the build from "/dist/",
    // so the service worker cannot control this page and must not be registered.
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // The plugin registers (or declines to) once the application has started.
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();

    const registrationCount = await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();

      return registrations.length;
    });
    expect(registrationCount).toBe(0);
  });

  test('The service worker is registered and precaches the build for a page within its scope', async ({
    page
  }) => {
    await page.goto('./dist/', { waitUntil: 'domcontentloaded' });

    const registration = await page.evaluate(async () => {
      const readyRegistration = await navigator.serviceWorker.ready;

      return {
        scope: readyRegistration.scope,
        scriptURL: readyRegistration.active.scriptURL
      };
    });
    const expectedScope = new URL('./', page.url()).href;
    expect(registration.scope).toBe(expectedScope);
    expect(registration.scriptURL).toBe(`${expectedScope}serviceWorker.js`);

    const cachedUrls = await page.evaluate(async (prefix) => {
      const cacheNames = await caches.keys();
      const cacheName = cacheNames.find((name) => name.startsWith(prefix));
      if (!cacheName) {
        return [];
      }

      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      return requests.map((request) => request.url);
    }, CACHE_NAME_PREFIX);
    expect(cachedUrls).toContain(`${expectedScope}openmct.js`);
    expect(cachedUrls).toContain(`${expectedScope}index.html`);
    expect(cachedUrls).toContain(`${expectedScope}manifest.json`);
  });

  test.describe('while offline', () => {
    // Going offline makes the development server's live-reload client log
    // connection errors that have nothing to do with Open MCT, so the fixture's
    // blanket console check is replaced with one that ignores them.
    test.use({ failOnConsoleError: false });

    test('The application loads and works once the build has been cached', async ({
      page,
      context
    }) => {
      const applicationErrors = [];
      page.on('console', (message) => {
        const isDevServerNoise =
          message.text().includes('webpack-dev-server') ||
          /WebSocket connection to '.*\/ws' failed/.test(message.text());
        if (message.type() === 'error' && !isDevServerNoise) {
          applicationErrors.push(message.text());
        }
      });

      await page.goto('./dist/', { waitUntil: 'domcontentloaded' });
      await waitForPrecache(page);

      await context.setOffline(true);

      // Reloading the controlled page must be served entirely from the cache.
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByRole('menuitem', { name: /Folder/ })).toBeVisible();
      await page.keyboard.press('Escape');

      // A fresh navigation to a route (not a reload) must work offline too.
      await page.goto('./dist/index.html#/browse/mine', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
      await expect(page.getByRole('main')).toContainText('My Items');

      await context.setOffline(false);
      expect(applicationErrors).toEqual([]);
    });
  });

  test('A new build is announced with a reload link and activated only after reloading', async ({
    page
  }) => {
    await page.goto('./dist/', { waitUntil: 'domcontentloaded' });
    await waitForPrecache(page);
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();

    // Registering a different script URL for the same scope is how the browser
    // sees a changed service worker: the plugin's registration gains an
    // installing worker, which must end up waiting rather than taking over.
    await page.evaluate(() => navigator.serviceWorker.register('serviceWorker.js?build=2'));

    const banner = page.getByText('A new version of Open MCT is available.');
    await expect(banner).toBeVisible();
    const workerStateBeforeReload = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;

      return {
        waitingScript: registration.waiting?.scriptURL ?? null,
        activeScript: registration.active?.scriptURL ?? null,
        controllerScript: navigator.serviceWorker.controller?.scriptURL ?? null
      };
    });
    expect(workerStateBeforeReload.waitingScript).toContain('serviceWorker.js?build=2');
    expect(workerStateBeforeReload.activeScript).not.toContain('build=2');
    expect(workerStateBeforeReload.controllerScript).not.toContain('build=2');

    await page.getByText('Reload to update').click();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();

    const workerStateAfterReload = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;

      return {
        waiting: registration.waiting !== null,
        controllerScript: navigator.serviceWorker.controller?.scriptURL ?? null
      };
    });
    expect(workerStateAfterReload.waiting).toBe(false);
    expect(workerStateAfterReload.controllerScript).toContain('serviceWorker.js?build=2');
    await expect(page.getByText('A new version of Open MCT is available.')).toBeHidden();
  });
});

/**
 * Waits until the service worker has activated and taken control of the page, at
 * which point every asset of the build has been precached.
 * @param {import('@playwright/test').Page} page
 */
async function waitForPrecache(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) {
      return;
    }

    await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
    });
  });
}
