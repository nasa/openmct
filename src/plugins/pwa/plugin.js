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

import ServiceWorkerManager from './ServiceWorkerManager.js';

/**
 * Makes Open MCT work as a Progressive Web App (PWA): registers the service worker
 * that precaches the Open MCT build for offline use and notifies the user when a new
 * build is available. Pair it with a web app manifest in your `index.html` to make the
 * application installable. See the "Progressive Web App Support" section of API.md.
 *
 * @param {import('./ServiceWorkerManager.js').PWAPluginOptions} [options]
 * @returns {import('../../../openmct.js').OpenMCTPlugin}
 */
export default function PWAPlugin(options = {}) {
  return function install(openmct) {
    const serviceWorkerManager = new ServiceWorkerManager(openmct, options);

    // Register after the application has started so that the registration does not
    // compete with the initial page load.
    openmct.once('start', () => serviceWorkerManager.register());
    openmct.once('destroy', () => serviceWorkerManager.destroy());
  };
}
