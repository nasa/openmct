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

    function InspectorViewRegistry() {
        this.providers = {};
    }

    InspectorViewRegistry.prototype.get = function (selection) {
        var providers = this.getAllProviders().filter(function (provider) {            
            return provider.canView(selection);
        });
    
        if (providers && providers.length > 0) {
            return providers[0].view(selection);
        }
    };

    InspectorViewRegistry.prototype.addProvider = function (provider) {
        var key = provider.key;
        
        if (key === undefined) {
            throw "View providers must have a unique 'key' property defined";
        }

        if (this.providers[key] !== undefined) {
            console.warn("Provider already defined for key '%s'. Provider keys must be unique.", key);
        }

        this.providers[key] = provider;
    };

    /**
     * @private
     */
    InspectorViewRegistry.prototype.getProviderByKey = function (key) {
        return this.providers[key];
    };

    /**
     * @private
     */
    InspectorViewRegistry.prototype.getAllProviders = function () {
        return Object.values(this.providers);
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
     * @returns {boolean} true if the selected item can be viewed using
     *          this provider
     */

    /**
     * Provide an inspector view of this selection object.
     *
     * @method view
     * @memberof module:openmct.InspectorViewProvider#
     * @param {module:openmct.selection} selection the selection object
     * @returns {module:openmct.View} a view for this selection 
     */

    return InspectorViewRegistry;
 });