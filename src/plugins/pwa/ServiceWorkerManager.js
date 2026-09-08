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

import { SKIP_WAITING_MESSAGE_TYPE } from './serviceWorkerHandlers.js';

const ONE_HOUR = 60 * 60 * 1000;
export const DEFAULT_SERVICE_WORKER_FILE_NAME = 'serviceWorker.js';
export const DEFAULT_UPDATE_CHECK_INTERVAL = ONE_HOUR;
export const UPDATE_AVAILABLE_MESSAGE = 'A new version of Open MCT is available.';
export const UPDATE_LINK_TEXT = 'Reload to update';

/**
 * @typedef {Object} PWAPluginOptions
 * @property {string} [serviceWorkerUrl] URL of the service worker script. Defaults to
 *   `serviceWorker.js` next to the other Open MCT build assets, i.e.
 *   `openmct.getAssetPath()` followed by the build's root-relative path.
 * @property {string} [scope] Explicit registration scope. Defaults to the directory
 *   containing the service worker script.
 * @property {number} [updateCheckInterval] How often, in milliseconds, to check for a new
 *   build while the application is open. Defaults to one hour. Set to `0` to only check on
 *   page load.
 * @property {boolean} [notifyOnUpdate] Whether to show a notification with a reload link
 *   when a new build has been installed. Defaults to `true`.
 * @property {ServiceWorkerContainer} [serviceWorkerContainer] The `ServiceWorkerContainer`
 *   to register with. Defaults to `navigator.serviceWorker`. Intended for tests.
 */

/**
 * Registers the Open MCT service worker and surfaces application updates to the user.
 *
 * A new build is never activated automatically while the application is in use: doing so
 * could serve assets from two different builds to the same page. Instead a notification
 * offers a "Reload to update" link which asks the waiting service worker to take over and
 * then reloads the page.
 */
export default class ServiceWorkerManager {
  #openmct;
  #options;
  #container;
  #registration;
  #updateNotification;
  #updateCheckTimer;
  #controllerChangeListener;

  /**
   * @param {import('../../../openmct.js').OpenMCT} openmct
   * @param {PWAPluginOptions} [options]
   */
  constructor(openmct, options = {}) {
    this.#openmct = openmct;
    this.#options = options;
    this.#container =
      'serviceWorkerContainer' in options
        ? options.serviceWorkerContainer
        : globalThis.navigator?.serviceWorker;
    this.#controllerChangeListener = () => this.#onControllerChange();
  }

  /**
   * The URL the service worker will be registered from.
   * @returns {string}
   */
  get serviceWorkerUrl() {
    const url =
      this.#options.serviceWorkerUrl ??
      `${this.#openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}${DEFAULT_SERVICE_WORKER_FILE_NAME}`;

    return new URL(url, globalThis.location.href).href;
  }

  /**
   * The scope the service worker will be registered with.
   * @returns {string}
   */
  get scope() {
    const scope = this.#options.scope ?? new URL('./', this.serviceWorkerUrl).href;

    return new URL(scope, globalThis.location.href).href;
  }

  /**
   * Whether the current page falls within the service worker's scope. Registering a
   * service worker that cannot control the current page provides no benefit, so
   * registration is skipped in that case (for example when the Open MCT development
   * server serves `index.html` from `/` while build assets live under `/dist/`).
   * @returns {boolean}
   */
  get isPageInScope() {
    return globalThis.location.href.startsWith(this.scope);
  }

  /**
   * Registers the service worker, if supported and applicable.
   * @returns {Promise<ServiceWorkerRegistration | undefined>}
   */
  async register() {
    if (!this.#container) {
      console.info(
        'Service workers are not supported in this browser; Open MCT will not be available offline.'
      );

      return undefined;
    }

    if (!this.isPageInScope) {
      console.info(
        `Not registering service worker: ${globalThis.location.href} is outside its scope ${this.scope}.`
      );

      return undefined;
    }

    try {
      this.#registration = await this.#container.register(this.serviceWorkerUrl, {
        scope: this.scope,
        updateViaCache: 'none'
      });
    } catch (error) {
      console.warn(`Unable to register service worker at ${this.serviceWorkerUrl}.`, error);

      return undefined;
    }

    this.#watchForUpdates();
    this.#scheduleUpdateChecks();

    return this.#registration;
  }

  /**
   * Asks the waiting service worker to take over and reloads the page once it has.
   */
  applyUpdate() {
    const waitingWorker = this.#registration?.waiting;

    if (!waitingWorker) {
      globalThis.location.reload();

      return;
    }

    this.#container.addEventListener('controllerchange', this.#controllerChangeListener);
    waitingWorker.postMessage({ type: SKIP_WAITING_MESSAGE_TYPE });
  }

  destroy() {
    clearInterval(this.#updateCheckTimer);
    this.#updateCheckTimer = undefined;
    this.#container?.removeEventListener('controllerchange', this.#controllerChangeListener);
    this.#updateNotification?.dismiss();
    this.#updateNotification = undefined;
  }

  #watchForUpdates() {
    const registration = this.#registration;

    // A build that was installed during a previous visit may already be waiting.
    if (registration.waiting && this.#container.controller) {
      this.#notifyUpdateAvailable();
    }

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) {
        return;
      }

      installingWorker.addEventListener('statechange', () => {
        // If there is no controller, this is the very first install rather than an update.
        if (installingWorker.state === 'installed' && this.#container.controller) {
          this.#notifyUpdateAvailable();
        }
      });
    });
  }

  #scheduleUpdateChecks() {
    const interval = this.#options.updateCheckInterval ?? DEFAULT_UPDATE_CHECK_INTERVAL;
    if (!(interval > 0)) {
      return;
    }

    this.#updateCheckTimer = setInterval(() => {
      this.#registration.update().catch((error) => {
        console.warn('Unable to check for Open MCT updates.', error);
      });
    }, interval);
  }

  #notifyUpdateAvailable() {
    if (this.#options.notifyOnUpdate === false || this.#updateNotification) {
      return;
    }

    this.#updateNotification = this.#openmct.notifications.alert(UPDATE_AVAILABLE_MESSAGE, {
      link: {
        text: UPDATE_LINK_TEXT,
        cssClass: 'c-message-banner__link',
        onClick: () => this.applyUpdate()
      }
    });
  }

  #onControllerChange() {
    this.#container.removeEventListener('controllerchange', this.#controllerChangeListener);
    globalThis.location.reload();
  }
}
