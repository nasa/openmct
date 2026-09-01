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

/* eslint-env serviceworker */

/**
 * The Open MCT service worker. It is built as its own webpack entry point and
 * emitted as `serviceWorker.js` next to `openmct.js`.
 *
 * The list of assets to precache is generated at build time by
 * `.webpack/ServiceWorkerManifestPlugin.mjs` and emitted as
 * `serviceWorkerManifest.js`. It is loaded with `importScripts` so that the
 * browser includes it when checking whether the service worker has changed:
 * every new build produces a new manifest, which triggers the update flow.
 *
 * Registration and update notifications are handled by the PWA plugin
 * (`plugin.js`).
 */

import { createServiceWorkerHandlers, SKIP_WAITING_MESSAGE_TYPE } from './serviceWorkerHandlers.js';

const MANIFEST_SCRIPT = 'serviceWorkerManifest.js';

importScripts(new URL(MANIFEST_SCRIPT, self.location.href).href);

const handlers = createServiceWorkerHandlers({
  manifest: self.__OPENMCT_PWA_MANIFEST__,
  scriptUrl: self.location.href,
  caches: self.caches,
  fetch: self.fetch.bind(self),
  clients: self.clients
});

self.addEventListener('install', (event) => {
  event.waitUntil(handlers.install());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(handlers.activate());
});

self.addEventListener('fetch', (event) => {
  const responsePromise = handlers.handleFetch(event.request);
  if (responsePromise !== undefined) {
    event.respondWith(responsePromise);
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === SKIP_WAITING_MESSAGE_TYPE) {
    self.skipWaiting();
  }
});
