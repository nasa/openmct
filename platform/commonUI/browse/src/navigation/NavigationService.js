/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise*/

/**
 * Module defining NavigationService. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The navigation service maintains the application's current
         * navigation state, and allows listening for changes thereto.
         * @memberof platform/commonUI/browse
         * @constructor
         */
        function NavigationService() {
            this.navigated = undefined;
            this.callbacks = [];
        }

        /**
         * Get the current navigation state.
         * @returns {DomainObject} the object that is navigated-to
         */
        NavigationService.prototype.getNavigation = function () {
            return this.navigated;
        };

        /**
         * Set the current navigation state. This will invoke listeners.
         * @param {DomainObject} domainObject the domain object to navigate to
         */
        NavigationService.prototype.setNavigation = function (value) {
            if (this.navigated !== value) {
                this.navigated = value;
                this.callbacks.forEach(function (callback) {
                    callback(value);
                });
            }
            return true;
        };

        /**
         * Listen for changes in navigation. The passed callback will
         * be invoked with the new domain object of navigation when
         * this changes.
         * @param {function} callback the callback to invoke when
         *        navigation state changes
         */
        NavigationService.prototype.addListener = function (callback) {
            this.callbacks.push(callback);
        };

        /**
         * Stop listening for changes in navigation state.
         * @param {function} callback the callback which should
         *        no longer be invoked when navigation state
         *        changes
         */
        NavigationService.prototype.removeListener = function (callback) {
            this.callbacks = this.callbacks.filter(function (cb) {
                return cb !== callback;
            });
        };

        return NavigationService;
    }
);
