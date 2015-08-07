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
            var navigated,
                callbacks = [];

            // Getter for current navigation
            function getNavigation() {
                return navigated;
            }

            // Setter for navigation; invokes callbacks
            function setNavigation(value) {
                if (navigated !== value) {
                    navigated = value;
                    callbacks.forEach(function (callback) {
                        callback(value);
                    });
                }
            }

            // Adds a callback
            function addListener(callback) {
                callbacks.push(callback);
            }

            // Filters out a callback
            function removeListener(callback) {
                callbacks = callbacks.filter(function (cb) {
                    return cb !== callback;
                });
            }

            return {
                /**
                 * Get the current navigation state.
                 * @memberof platform/commonUI/browse.NavigationService#
                 */
                getNavigation: getNavigation,
                /**
                 * Set the current navigation state. Thiswill invoke listeners.
                 * @param {DomainObject} value the domain object to navigate
                 *        to
                 * @memberof platform/commonUI/browse.NavigationService#
                 */
                setNavigation: setNavigation,
                /**
                 * Listen for changes in navigation. The passed callback will
                 * be invoked with the new domain object of navigation when
                 * this changes.
                 * @param {function} callback the callback to invoke when
                 *        navigation state changes
                 * @memberof platform/commonUI/browse.NavigationService#
                 */
                addListener: addListener,
                /**
                 * Stop listening for changes in navigation state.
                 * @param {function} callback the callback which should
                 *        no longer be invoked when navigation state
                 *        changes
                 * @memberof platform/commonUI/browse.NavigationService#
                 */
                removeListener: removeListener
            };
        }

        return NavigationService;
    }
);
