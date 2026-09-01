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
  version: 'test-build',
  assets: ['openmct.js', 'index.html', 'favicons/icon.png']
};

describe('The PWA service worker handlers', () => {
  let handlers;
  let fetchSpy;
  let clients;
  let responses;

  function okResponse(body) {
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  // Pages cannot construct a Request whose mode is 'navigate', so navigations are
  // represented by a plain object exposing the properties the handlers read.
  function navigationRequest(url) {
    return { method: 'GET', url, mode: 'navigate' };
  }

  function getRequestUrls() {
    return fetchSpy.calls.all().map((call) => call.args[0].url);
  }

  async function deleteTestCaches() {
    const names = await caches.keys();
    await Promise.all(
      names.filter((name) => name.startsWith(CACHE_NAME_PREFIX)).map((name) => caches.delete(name))
    );
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
  });

  afterEach(async () => {
    await deleteTestCaches();
  });

  describe('install', () => {
    it('precaches every asset in the manifest, bypassing the HTTP cache', async () => {
      responses['/app/openmct.js'] = () => okResponse('openmct');
      responses['/app/index.html'] = () => okResponse('index');
      responses['/app/favicons/icon.png'] = () => okResponse('icon');

      await handlers.install();

      expect(getRequestUrls().sort()).toEqual([
        `${window.location.origin}/app/favicons/icon.png`,
        `${window.location.origin}/app/index.html`,
        `${window.location.origin}/app/openmct.js`
      ]);
      fetchSpy.calls.all().forEach((call) => expect(call.args[0].cache).toBe('reload'));

      const cache = await caches.open(handlers.cacheName);
      const cached = await cache.match(`${window.location.origin}/app/openmct.js`);
      expect(await cached.text()).toBe('openmct');
      expect((await cache.keys()).length).toBe(3);
    });

    it('rejects, naming the asset, when any asset cannot be fetched', async () => {
      responses['/app/openmct.js'] = () => okResponse('openmct');
      responses['/app/index.html'] = () => okResponse('index');
      responses['/app/favicons/icon.png'] = () => new Response('nope', { status: 404 });

      await expectAsync(handlers.install()).toBeRejectedWithError(/favicons\/icon\.png.*404/);
    });
  });

  describe('activate', () => {
    it('deletes caches from previous builds, leaves other caches alone and claims clients', async () => {
      await caches.open(`${CACHE_NAME_PREFIX}old-build`);
      await caches.open(handlers.cacheName);
      await caches.open('some-other-application-cache');

      await handlers.activate();

      const names = await caches.keys();
      expect(names).not.toContain(`${CACHE_NAME_PREFIX}old-build`);
      expect(names).toContain(handlers.cacheName);
      expect(names).toContain('some-other-application-cache');
      expect(clients.claim).toHaveBeenCalled();

      await caches.delete('some-other-application-cache');
    });
  });

  describe('handleFetch', () => {
    beforeEach(async () => {
      responses['/app/openmct.js'] = () => okResponse('openmct');
      responses['/app/index.html'] = () => okResponse('index');
      responses['/app/favicons/icon.png'] = () => okResponse('icon');
      await handlers.install();
      fetchSpy.calls.reset();
    });

    it('lets the browser handle non-GET, cross-origin and unknown same-origin requests', () => {
      expect(
        handlers.handleFetch(
          new Request(`${window.location.origin}/app/openmct.js`, { method: 'POST' })
        )
      ).toBeUndefined();
      expect(
        handlers.handleFetch(new Request('https://example.com/app/openmct.js'))
      ).toBeUndefined();
      expect(
        handlers.handleFetch(new Request(`${window.location.origin}/couchdb/openmct/_all_docs`))
      ).toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('serves precached assets from the cache, ignoring query strings', async () => {
      const response = await handlers.handleFetch(
        new Request(`${window.location.origin}/app/openmct.js?v=2`)
      );

      expect(await response.text()).toBe('openmct');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('falls back to the network for a precached asset that is missing from the cache', async () => {
      const cache = await caches.open(handlers.cacheName);
      await cache.delete(`${window.location.origin}/app/favicons/icon.png`);
      responses['/app/favicons/icon.png'] = () => okResponse('fresh icon');

      const response = await handlers.handleFetch(
        new Request(`${window.location.origin}/app/favicons/icon.png`)
      );

      expect(await response.text()).toBe('fresh icon');
      const cached = await cache.match(`${window.location.origin}/app/favicons/icon.png`);
      expect(await cached.text()).toBe('fresh icon');
    });

    it('serves navigations network-first and caches the page for offline use', async () => {
      responses['/app/'] = () => okResponse('live page');
      const request = navigationRequest(`${window.location.origin}/app/`);

      const online = await handlers.handleFetch(request);
      expect(await online.text()).toBe('live page');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      delete responses['/app/'];
      const offline = await handlers.handleFetch(request);
      expect(await offline.text()).toBe('live page');
    });

    it('falls back to the precached index.html for an offline navigation to a page never seen online', async () => {
      const response = await handlers.handleFetch(
        navigationRequest(`${window.location.origin}/app/other.html`)
      );

      expect(await response.text()).toBe('index');
    });

    it('propagates the network error when nothing suitable is cached', async () => {
      const cache = await caches.open(handlers.cacheName);
      await cache.delete(`${window.location.origin}/app/index.html`);

      await expectAsync(
        handlers.handleFetch(navigationRequest(`${window.location.origin}/app/other.html`))
      ).toBeRejectedWithError(TypeError);
    });
  });
});
