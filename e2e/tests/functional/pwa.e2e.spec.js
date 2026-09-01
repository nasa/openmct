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

    // Clean up so the service worker does not outlive this test's browser context.
    await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((item) => item.unregister()));
    });
  });
});
