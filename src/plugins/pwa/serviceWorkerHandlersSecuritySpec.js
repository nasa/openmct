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

import { CACHE_NAME_PREFIX, createServiceWorkerHandlers } from './serviceWorkerHandlers.js';

const SCRIPT_URL = `${window.location.origin}/app/serviceWorker.js`;
const MANIFEST = {
  version: 'test-build-security',
  assets: ['index.html']
};

// A hardened navigation cache must never persist a response whose
// `Cache-Control` header forbids storage, but must keep caching ordinary
// public pages so that the offline experience is not silently lost.
describe('The PWA service worker navigation cache security', () => {
  let handlers;
  let fetchSpy;
  let clients;
  let responses;

  function navigationResponse(body, cacheControl) {
    const headers = { 'Content-Type': 'text/html' };
    if (cacheControl !== undefined) {
      headers['Cache-Control'] = cacheControl;
    }

    return new Response(body, { status: 200, headers });
  }

  // Pages cannot construct a Request whose mode is 'navigate', so navigations are
  // represented by a plain object exposing the properties the handlers read.
  function navigationRequest(url) {
    return { method: 'GET', url, mode: 'navigate' };
  }

  async function deleteTestCaches() {
    const names = await caches.keys();
    await Promise.all(
      names.filter((name) => name.startsWith(CACHE_NAME_PREFIX)).map((name) => caches.delete(name))
    );
  }

  async function cachedResponseFor(url) {
    const cache = await caches.open(handlers.cacheName);

    return cache.match(url);
  }

  beforeEach(async () => {
    await deleteTestCaches();
    responses = {};
    fetchSpy = jasmine.createSpy('fetch').and.callFake((request) => {
      const key = new URL(request.url).pathname;
      const factory = responses[key];
      if (!factory) {
        return Promise.reject(new TypeError(`Failed to fetch ${request.url}`));
      }

      return Promise.resolve(factory());
    });
    clients = jasmine.createSpyObj('clients', { claim: Promise.resolve() });
    handlers = createServiceWorkerHandlers({
      manifest: MANIFEST,
      scriptUrl: SCRIPT_URL,
      caches,
      fetch: fetchSpy,
      clients
    });

    // Precache the app shell so that the offline fallback is available.
    responses['/app/index.html'] = () => navigationResponse('app shell');
    await handlers.install();
    fetchSpy.calls.reset();
  });

  afterEach(async () => {
    await deleteTestCaches();
  });

  describe('cacheable navigation responses', () => {
    it('caches a 200 response that has no Cache-Control header', async () => {
      responses['/app/'] = () => navigationResponse('plain page');

      await handlers.handleFetch(navigationRequest(`${window.location.origin}/app/`));

      const cached = await cachedResponseFor(`${window.location.origin}/app/`);
      expect(cached).toBeDefined();
      expect(await cached.text()).toBe('plain page');
    });

    it('caches a 200 response that is explicitly marked public', async () => {
      responses['/app/'] = () => navigationResponse('public page', 'public, max-age=3600');

      await handlers.handleFetch(navigationRequest(`${window.location.origin}/app/`));

      const cached = await cachedResponseFor(`${window.location.origin}/app/`);
      expect(await cached.text()).toBe('public page');
    });

    it('caches a response with max-age=0, which asks for revalidation but does not forbid storage', async () => {
      responses['/app/'] = () => navigationResponse('revalidating page', 'max-age=0');

      await handlers.handleFetch(navigationRequest(`${window.location.origin}/app/`));

      expect(await cachedResponseFor(`${window.location.origin}/app/`)).toBeDefined();
    });
  });

  describe('responses that must never be cached', () => {
    // Deployments that serve authenticated or personalized pages typically
    // guard them with one of these header shapes.
    const guardedHeaderShapes = [
      ['no-store', 'no-store'],
      ['private', 'private'],
      ['no-cache', 'no-cache'],
      ['combined directives', 'private, no-cache, max-age=0'],
      ['mixed case and inner whitespace', '  Private ,  NO-STORE '],
      ['a directive with a field argument', 'no-cache="Set-Cookie"']
    ];

    guardedHeaderShapes.forEach(([description, cacheControl]) => {
      it(`does not cache a 200 response guarded by Cache-Control: ${description}`, async () => {
        responses['/app/'] = () => navigationResponse('authenticated page', cacheControl);

        await handlers.handleFetch(navigationRequest(`${window.location.origin}/app/`));

        expect(await cachedResponseFor(`${window.location.origin}/app/`)).toBeUndefined();
      });
    });

    it('does not cache non-200 responses', async () => {
      responses['/app/'] = () => new Response('Internal Server Error', { status: 500 });

      await handlers.handleFetch(navigationRequest(`${window.location.origin}/app/`));

      expect(await cachedResponseFor(`${window.location.origin}/app/`)).toBeUndefined();
    });

    it('still returns the guarded response to the browser; only storage is skipped', async () => {
      responses['/app/'] = () => navigationResponse('authenticated page', 'no-store');

      const response = await handlers.handleFetch(
        navigationRequest(`${window.location.origin}/app/`)
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('authenticated page');
      expect(await cachedResponseFor(`${window.location.origin}/app/`)).toBeUndefined();
    });

    it('does not overwrite an already cached public page with a later guarded response', async () => {
      responses['/app/'] = () => navigationResponse('public page', 'public');
      const request = navigationRequest(`${window.location.origin}/app/`);
      await handlers.handleFetch(request);

      // The same URL starts serving authenticated content.
      responses['/app/'] = () => navigationResponse('authenticated page', 'no-store');
      await handlers.handleFetch(request);

      const cached = await cachedResponseFor(`${window.location.origin}/app/`);
      expect(await cached.text()).toBe('public page');
    });
  });

  describe('offline fallback behavior', () => {
    it('serves a previously cached public page when the network is unavailable', async () => {
      responses['/app/'] = () => navigationResponse('public page', 'public');
      const request = navigationRequest(`${window.location.origin}/app/`);

      await handlers.handleFetch(request);

      delete responses['/app/'];
      const offline = await handlers.handleFetch(request);
      expect(await offline.text()).toBe('public page');
    });

    it('falls back to the precached index.html offline instead of leaking a guarded page', async () => {
      responses['/app/'] = () => navigationResponse('authenticated page', 'no-store');
      const request = navigationRequest(`${window.location.origin}/app/`);

      // Online: the guarded page is served live, but never stored.
      const online = await handlers.handleFetch(request);
      expect(await online.text()).toBe('authenticated page');

      // Offline: the same navigation must fall back to the app shell,
      // never to the guarded response.
      delete responses['/app/'];
      const offline = await handlers.handleFetch(request);
      expect(await offline.text()).toBe('app shell');
    });

    it('propagates the network error when no cacheable page and no fallback are available', async () => {
      const cache = await caches.open(handlers.cacheName);
      await cache.delete(`${window.location.origin}/app/index.html`);

      await expectAsync(
        handlers.handleFetch(navigationRequest(`${window.location.origin}/app/`))
      ).toBeRejectedWithError(TypeError);
    });
  });
});
