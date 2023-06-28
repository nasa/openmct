/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
 *
 * @interface InspectorViewRegistry
 * @memberof module:openmct
 */
export default class InspectorViewRegistry {
  constructor() {
    this.providers = {};
  }

  /**
   *
   * @param {object} selection the object to be viewed
   * @returns {module:openmct.InspectorViewRegistry[]} any providers
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
   * Registers a new type of view.
   *
   * @param {module:openmct.InspectorViewRegistry} provider the provider for this view
   * @method addProvider
   * @memberof module:openmct.InspectorViewRegistry#
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

  getByProviderKey(key) {
    return this.providers[key];
  }

  #getAllProviders() {
    return Object.values(this.providers);
  }
}

/**
 * A View is used to provide displayable content, and to react to
 * associated life cycle events.
 *
 * @name View
 * @interface
 * @memberof module:openmct
 */

/**
 * Populate the supplied DOM element with the contents of this view.
 *
 * View implementations should use this method to attach any
 * listeners or acquire other resources that are necessary to keep
 * the contents of this view up-to-date.
 *
 * @param {HTMLElement} container the DOM element to populate
 * @method show
 * @memberof module:openmct.View#
 */

/**
 * Release any resources associated with this view.
 *
 * View implementations should use this method to detach any
 * listeners or release other resources that are no longer necessary
 * once a view is no longer used.
 *
 * @method destroy
 * @memberof module:openmct.View#
 */

/**
 * Exposes types of views in inspector.
 *
 * @interface InspectorViewProvider
 * @property {string} key a unique identifier for this view
 * @property {string} name the human-readable name of this view
 * @property {string} [description] a longer-form description (typically
 *           a single sentence or short paragraph) of this kind of view
 * @property {string} [cssClass] the CSS class to apply to labels for this
 *           view (to add icons, for instance)
 * @memberof module:openmct
 */

/**
 * Checks if this provider can supply views for a selection.
 *
 * @method canView
 * @memberof module:openmct.InspectorViewProvider#
 * @param {module:openmct.selection} selection
 * @returns {boolean} 'true' if the view applies to the provided selection,
 *          otherwise 'false'.
 */

/**
 * Provides a view of the selection object in the inspector.
 *
 * @method view
 * @memberof module:openmct.InspectorViewProvider#
 * @param {module:openmct.selection} selection the selection object
 * @returns {module:openmct.View} a view of this selection
 */
