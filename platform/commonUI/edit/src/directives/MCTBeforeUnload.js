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
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Defines the `mct-before-unload` directive. The expression bound
         * to this attribute will be evaluated during page navigation events
         * and, if it returns a truthy value, will be used to populate a
         * prompt to the user to confirm this navigation.
         * @memberof platform/commonUI/edit
         * @constructor
         * @param $window the window
         */
        function MCTBeforeUnload($window) {
            var unloads = [],
                oldBeforeUnload = $window.onbeforeunload;

            // Run all unload functions, returning the first returns truthily.
            function checkUnloads() {
                var result;
                unloads.forEach(function (unload) {
                    result = result || unload();
                });
                return result;
            }

            // Link function for an mct-before-unload directive usage
            function link(scope, element, attrs) {
                // Invoke the
                function unload() {
                    return scope.$eval(attrs.mctBeforeUnload);
                }

                // Stop using this unload expression
                function removeUnload() {
                    unloads = unloads.filter(function (callback) {
                        return callback !== unload;
                    });
                    if (unloads.length === 0) {
                        $window.onbeforeunload = oldBeforeUnload;
                    }
                }

                // Show a dialog before allowing a location change
                function checkLocationChange(event) {
                    // Get an unload message (if any)
                    var warning = unload();
                    // Prompt the user if there's an unload message
                    if (warning && !$window.confirm(warning)) {
                        // ...and prevent the route change if it was confirmed
                        event.preventDefault();
                    }
                }

                // If this is the first active instance of this directive,
                // register as the window's beforeunload handler
                if (unloads.length === 0) {
                    $window.onbeforeunload = checkUnloads;
                }

                // Include this instance of the directive's unload function
                unloads.push(unload);

                // Remove it when the scope is destroyed
                scope.$on("$destroy", removeUnload);

                // Also handle route changes
                scope.$on("$locationChangeStart", checkLocationChange);
            }

            return {
                // Applicable as an attribute
                restrict: "A",
                // Link with the provided function
                link: link
            };
        }

        return MCTBeforeUnload;

    }
);
