/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([], function () {
    /**
     * A ViewRegistry maintains the definitions for different kinds of views
     * that may occur in different places in the user interface.
     * @interface ViewRegistry
     * @memberof module:openmct
     */
    function ViewRegistry() {
        this.providers = [];
    }


    /**
     * @private for platform-internal use
     * @param {*} item the object to be viewed
     * @returns {module:openmct.ViewProvider[]} any providers
     *          which can provide views of this object
     */
    ViewRegistry.prototype.get = function (item) {
        return this.providers.filter(function (provider) {
            return provider.canView(item);
        });
    };

    /**
     * Register a new type of view.
     *
     * @param {module:openmct.ViewProvider} provider the provider for this view
     * @method addProvider
     * @memberof module:openmct.ViewRegistry#
     */
    ViewRegistry.prototype.addProvider = function (provider) {
        this.providers.push(provider);
    };

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
     * Exposes types of views in Open MCT.
     *
     * @interface ViewProvider
     * @memberof module:openmct
     */

    /**
     * Check if this provider can supply views for a domain object.
     *
     * When called by Open MCT, this may include additional arguments
     * which are on the path to the object to be viewed; for instance,
     * when viewing "A Folder" within "My Items", this method will be
     * invoked with "A Folder" (as a domain object) as the first argument,
     * and "My Items" as the second argument.
     *
     * @method canView
     * @memberof module:openmct.ViewProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        to be viewed
     * @returns {boolean} true if this domain object can be viewed using
     *          this provider
     */

    /**
     * Provide a view of this object.
     *
     * When called by Open MCT, this may include additional arguments
     * which are on the path to the object to be viewed; for instance,
     * when viewing "A Folder" within "My Items", this method will be
     * invoked with "A Folder" (as a domain object) as the first argument,
     * and "My Items" as the second argument.
     *
     * @method view
     * @memberof module:openmct.ViewProvider#
     * @param {*} object the object to be viewed
     * @returns {module:openmct.View} a view of this domain object
     */

    /**
     * Get metadata associated with this view provider. This may be used
     * to populate the user interface with options associated with this
     * view provider.
     *
     * @method metadata
     * @memberof module:openmct.ViewProvider#
     * @returns {module:openmct.ViewProvider~ViewMetadata} view metadata
     */

    /**
     * @typedef ViewMetadata
     * @memberof module:openmct.ViewProvider~
     * @property {string} name the human-readable name of this view
     * @property {string} key a machine-readable name for this view
     * @property {string} [description] a longer-form description (typically
     *           a single sentence or short paragraph) of this kind of view
     * @property {string} cssClass the CSS class to apply to labels for this
     *           view (to add icons, for instance)
     */

    return ViewRegistry;

});
