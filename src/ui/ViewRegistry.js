/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
        this._next_id = 0;
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
            return typeof provider.canView(item) !== 'undefined' &&
                provider.canView(item) !== false;
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
        provider._vpid = this._next_id++;
        this.providers.push(provider);
    };

    /**
     * Used internally to support seamless usage of new views with old
     * views.
     * @private
     */
    ViewRegistry.prototype._getByVPID = function (vpid) {
        return this.providers.filter(function (p) {
            return p._vpid === vpid;
        })[0]
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
     * @property {string} name the human-readable name of this view
     * @property {string} [description] a longer-form description (typically
     *           a single sentence or short paragraph) of this kind of view
     * @property {string} [cssClass] the CSS class to apply to labels for this
     *           view (to add icons, for instance)
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
     * @returns {Number|boolean} if this returns `false`, then the view does
     *          not apply to the object.  If it returns true or any number, then
     *          it applies to this object.  If multiple views could apply
     *          to an object, the view that returns the lowest number will be
     *          the default view.
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

    return ViewRegistry;

});
