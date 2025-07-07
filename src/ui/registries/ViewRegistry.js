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

import { EventEmitter } from 'eventemitter3';

const DEFAULT_VIEW_PRIORITY = 100;

/**
 * A ViewRegistry maintains the definitions for different kinds of views
 * that may occur in different places in the user interface.
 */
export default class ViewRegistry extends EventEmitter {
  constructor() {
    super();
    EventEmitter.apply(this);
    /** @type {Record<string, ViewProvider>} */
    this.providers = {};
  }

  /**
   * for platform-internal use
   * @param {import('openmct').DomainObject} item the object to be viewed
   * @param {import('openmct').ObjectPath} objectPath - The current contextual object path of the view object
   * @returns {ViewProvider[]} a list of providers that can provide views for this object, sorted by
   * descending priority
   */
  get(item, objectPath) {
    if (objectPath === undefined) {
      throw 'objectPath must be provided to get applicable views for an object';
    }

    function byPriority(providerA, providerB) {
      let priorityA = providerA.priority ? providerA.priority(item) : DEFAULT_VIEW_PRIORITY;
      let priorityB = providerB.priority ? providerB.priority(item) : DEFAULT_VIEW_PRIORITY;

      return priorityB - priorityA;
    }

    return this.getAllProviders()
      .filter(function (provider) {
        return provider.canView(item, objectPath);
      })
      .sort(byPriority);
  }

  /**
   * @private
   */
  getAllProviders() {
    return Object.values(this.providers);
  }

  /**
   * Register a new type of view.
   *
   * @param {ViewProvider} provider the provider for this view
   */
  addProvider(provider) {
    const key = provider.key;
    if (key === undefined) {
      throw "View providers must have a unique 'key' property defined";
    }

    if (this.providers[key] !== undefined) {
      console.warn(`Provider already defined for key '${key}'. Provider keys must be unique.`);
    }

    const wrappedView = provider.view.bind(provider);
    provider.view = (domainObject, objectPath) => {
      const viewObject = wrappedView(domainObject, objectPath);
      const wrappedShow = viewObject.show.bind(viewObject);
      viewObject.key = key; // provide access to provider key on view object
      viewObject.show = (element, isEditing, viewOptions) => {
        viewObject.parentElement = element.parentElement;
        wrappedShow(element, isEditing, viewOptions);
      };

      return viewObject;
    };

    this.providers[key] = provider;
  }

  /**
   * Returns the view provider by key
   * @param {string} key
   * @returns {ViewProvider}
   */
  getByProviderKey(key) {
    return this.providers[key];
  }

  /**
   * Used internally to support seamless usage of new views with old
   * views.
   * @private
   */
  getByVPID(vpid) {
    return this.providers.filter(function (p) {
      return p.vpid === vpid;
    })[0];
  }
}

/**
 * @typedef {import('openmct').DomainObject} DomainObject
 * @typedef {import('openmct').ObjectPath} ObjectPath
 */

/**
 * @typedef {Object} ViewOptions
 * @property {() => void} [renderWhenVisible]
 * This function can be used for all rendering logic that would otherwise be executed within a
 * `requestAnimationFrame` call. When called, `renderWhenVisible` will either execute the provided
 * function immediately (via `requestAnimationFrame`) if the view is currently visible, or defer its
 * execution until the view becomes visible.
 *
 * Additionally, `renderWhenVisible` returns a boolean value indicating whether the provided
 * function was executed immediately (`true`) or deferred (`false`).
 * Monitoring of visibility begins after the first call to `renderWhenVisible` is made.
 */

/**
 * @typedef {Object} View
 * A View is used to provide displayable content, and to react to
 * associated life cycle events.
 * @property {(container: HTMLElement, isEditing: boolean | undefined, viewOptions: ViewOptions | undefined) => void} show
 * Populate the supplied DOM element with the contents of this view.
 * View implementations should use this method to attach any
 * listeners or acquire other resources that are necessary to keep
 * the contents of this view up-to-date.
 *
 * - `container`: The DOM element where the view should be rendered.
 * - `isEditing`: Indicates whether the view is in editing mode.
 * - `viewOptions`: An object with configuration options for the view.
 * @property {() => void} destroy - Release any resources associated with this view.
 * View implementations should use this method to detach any listeners or release other resources
 * that are no longer necessary once a view is no longer used.
 * @property {() => { item: DomainObject, isMultiSelectEvent: boolean }} [getSelectionContext]
 * A function that returns the selection context of the view.

 * View implementations may use this method to customize the selection context.
 */

/**
 * Exposes types of views in Open MCT.
 *
 * @typedef {Object} ViewProvider
 * @property {string} key - The unique key that identifies this view
 * @property {string} name - The name of the view
 * @property {string} [cssClass] - The CSS class to apply to labels for this view (to add icons,
 * for instance)
 * @property {(domainObject: DomainObject, objectPath: ObjectPath) => boolean} canView
 * Returns true if this provider is able to supply views for the given {@link DomainObject}.
 *
 * When called by Open MCT, this may include additional arguments
 * which are on the path to the object to be viewed; for instance,
 * when viewing "A Folder" within "My Items", this method will be
 * invoked with "A Folder" (as a {@link DomainObject}) as the first argument.
 * @property {(domainObject: DomainObject, objectPath: ObjectPath) => boolean} [canEdit]
 * An optional function that defines whether or not this view can be used to edit a given object.
 * If not provided, will default to `false` and the view will not support editing.
 * @property {(domainObject: DomainObject, objectPath: ObjectPath) => View} view A function that
 * provides a view for the provided domain object.
 * @property {(domainObject: DomainObject) => number} [priority]
 * A function that returns the priority of the view. The more positive the value, the higher the
 * priority. Similarly, the more negative the value, the lower the priority.
 *
 * If not provided, the default priority of 100 will be used. This value is used to sort the views
 * by descending priority if there are multiple views that can be shown for a given object.
 */
