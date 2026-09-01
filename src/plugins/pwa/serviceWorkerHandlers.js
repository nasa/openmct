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

/**
 * Pure request-handling logic for the Open MCT service worker.
 *
 * This module has no dependency on the service worker global scope so that it
 * can be unit tested in a normal browser window. `serviceWorker.js` wires the
 * handlers returned by {@link createServiceWorkerHandlers} to the real
 * `install`, `activate` and `fetch` events.
 *
 * Caching strategy:
 * - Every build asset listed in the precache manifest is fetched and stored in
 *   a cache named after the build version during `install`. Requests for those
 *   assets are then served cache-first, so the application loads offline.
 * - Navigation requests (page loads) are served network-first. Successful
 *   responses are cached so the page can be reopened offline; if the network is
 *   unavailable and no copy of the requested page exists, the precached
 *   `index.html` is used as a fallback.
 * - Every other request (cross-origin requests, non-GET requests, telemetry
 *   and persistence API calls, etc.) is passed straight to the network and is
 *   never cached.
 * - Caches created by previous builds are deleted during `activate`.
 */

export const CACHE_NAME_PREFIX = 'openmct-pwa-';
export const NAVIGATION_FALLBACK_ASSET = 'index.html';
export const SKIP_WAITING_MESSAGE_TYPE = 'SKIP_WAITING';

/**
 * @typedef {Object} PrecacheManifest
 * @property {string} version A string that uniquely identifies the build.
 * @property {string[]} assets Asset paths, relative to the service worker script.
 */

/**
 * @typedef {Object} ServiceWorkerHandlers
 * @property {() => Promise<void>} install Precaches every asset in the manifest.
 * @property {() => Promise<void>} activate Deletes caches from previous builds and claims clients.
 * @property {(request: Request) => Promise<Response> | undefined} handleFetch
 *   Returns a promise for a response when the service worker should handle the
 *   request, or `undefined` to let the browser handle it as usual.
 * @property {string} cacheName The name of the cache used by this build.
 */

/**
 * @param {Object} dependencies
 * @param {PrecacheManifest} dependencies.manifest The precache manifest for this build.
 * @param {string} dependencies.scriptUrl Absolute URL of the service worker script.
 *   Asset paths in the manifest are resolved relative to this URL.
 * @param {CacheStorage} dependencies.caches The `CacheStorage` to use.
 * @param {typeof fetch} dependencies.fetch The `fetch` function to use.
 * @param {Clients} [dependencies.clients] The service worker `Clients` interface, if available.
 * @returns {ServiceWorkerHandlers}
 */
export function createServiceWorkerHandlers({ manifest, scriptUrl, caches, fetch, clients }) {
  const cacheName = `${CACHE_NAME_PREFIX}${manifest.version}`;
  const origin = new URL(scriptUrl).origin;
  const precacheUrls = manifest.assets.map((asset) => new URL(asset, scriptUrl).href);
  const precacheUrlSet = new Set(precacheUrls);
  const navigationFallbackUrl = new URL(NAVIGATION_FALLBACK_ASSET, scriptUrl).href;

  async function install() {
    const cache = await caches.open(cacheName);

    await Promise.all(
      precacheUrls.map(async (url) => {
        // Bypass the HTTP cache so that a new build never precaches stale copies
        // of assets whose file names did not change.
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (!response.ok) {
          throw new Error(`Failed to precache ${url}: ${response.status} ${response.statusText}`);
        }

        await cache.put(url, response);
      })
    );
  }

  async function activate() {
    const cacheNames = await caches.keys();
    const staleCacheNames = cacheNames.filter(
      (name) => name.startsWith(CACHE_NAME_PREFIX) && name !== cacheName
    );

    await Promise.all(staleCacheNames.map((name) => caches.delete(name)));

    if (clients?.claim) {
      await clients.claim();
    }
  }

  /**
   * @param {Request} request
   * @returns {Promise<Response> | undefined}
   */
  function handleFetch(request) {
    if (request.method !== 'GET') {
      return undefined;
    }

    const url = new URL(request.url);
    if (url.origin !== origin) {
      return undefined;
    }

    const cacheKey = getCacheKey(url);

    if (request.mode === 'navigate') {
      return handleNavigation(request, cacheKey);
    }

    if (precacheUrlSet.has(cacheKey)) {
      return cacheFirst(request, cacheKey);
    }

    return undefined;
  }

  async function handleNavigation(request, cacheKey) {
    const cache = await caches.open(cacheName);

    try {
      const response = await fetch(request);
      if (response.ok && !response.redirected) {
        await cache.put(cacheKey, response.clone());
      }

      return response;
    } catch (error) {
      const cachedResponse =
        (await cache.match(cacheKey)) ?? (await cache.match(navigationFallbackUrl));
      if (cachedResponse) {
        return cachedResponse;
      }

      throw error;
    }
  }

  async function cacheFirst(request, cacheKey) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await fetch(request);
    if (response.ok) {
      await cache.put(cacheKey, response.clone());
    }

    return response;
  }

  return {
    install,
    activate,
    handleFetch,
    cacheName
  };
}

/**
 * Cache entries are keyed by origin and path only, so that a request for
 * `openmct.js?v=2` is served by the precached `openmct.js`.
 * @param {URL} url
 * @returns {string}
 */
function getCacheKey(url) {
  return `${url.origin}${url.pathname}`;
}
