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

const DEFAULT_VIEW_PRIORITY = 0;

/**
 * A InspectorViewRegistry maintains the definitions for views
 * that may occur in the inspector.
 */
export default class InspectorViewRegistry {
  constructor() {
    /** @type {Record<string, ViewProvider>} */
    this.providers = {};
  }

  /**
   *
   * @param {DomainObject} selection the object to be viewed
   * @returns {ViewProvider[]} any providers
   *          which can provide views of this object
   * @private for platform-internal use
   */
  get(selection) {
    function byPriority(providerA, providerB) {
      const priorityA = providerA.priority?.() ?? DEFAULT_VIEW_PRIORITY;
      const priorityB = providerB.priority?.() ?? DEFAULT_VIEW_PRIORITY;

      return priorityB - priorityA;
    }

    return this.#getAllProviders()
      .filter((provider) => provider.canView(selection))
      .map((provider) => {
        const view = provider.view(selection);
        view.key = provider.key;
        view.name = provider.name;
        view.glyph = provider.glyph;

        return view;
      })
      .sort(byPriority);
  }

  /**
   * Registers a new inspector view provider.
   *
   * @param {ViewProvider} provider the provider for this view
   */
  addProvider(provider) {
    const key = provider.key;
    const name = provider.name;

    if (key === undefined) {
      throw "View providers must have a unique 'key' property defined";
    }

    if (name === undefined) {
      throw "View providers must have a 'name' property defined";
    }

    if (this.providers[key] !== undefined) {
      console.warn(`Provider already defined for key '${key}'. Provider keys must be unique.`);
    }

    this.providers[key] = provider;
  }

  /**
   * Retrieves a view provider by its key.
   * @param {string} key the key of the view provider
   * @returns {ViewProvider} the view provider
   */
  getByProviderKey(key) {
    return this.providers[key];
  }

  /**
   * @returns {ViewProvider[]} all providers
   */
  #getAllProviders() {
    return Object.values(this.providers);
  }
}

/**
 * @typedef {import("openmct").View} View
 * @typedef {import("openmct").ViewProvider} ViewProvider
 * @typedef {import("openmct").DomainObject} DomainObject
 */
