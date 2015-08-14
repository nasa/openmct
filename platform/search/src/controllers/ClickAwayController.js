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

/*
 * Copied from the ClickAwayController in platform/commonUI/general
 */

define(
    [],
    function () {
        "use strict";

        /**
         * A ClickAwayController is used to toggle things (such as context
         * menus) where clicking elsewhere in the document while the toggle
         * is in an active state is intended to dismiss the toggle.
         *
         * @constructor
         * @param $scope the scope in which this controller is active
         * @param $document the document element, injected by Angular
         */
        function ClickAwayController($scope, $document) {
            var state = false,
                clickaway;

            // Track state, but also attach and detach a listener for
            // mouseup events on the document.
            function deactivate() {
                state = false;
                $document.off("mouseup", clickaway);
            }

            function activate() {
                state = true;
                $document.on("mouseup", clickaway);
            }

            function changeState() {
                if (state) {
                    deactivate();
                } else {
                    activate();
                }
            }

            // Callback used by the document listener. Deactivates;
            // note also $scope.$apply is invoked to indicate that
            // the state of this controller has changed.
            clickaway = function () {
                deactivate();
                $scope.$apply();
                return false;
            };

            return {
                /**
                 * Get the current state of the toggle.
                 * @return {boolean} true if active
                 */
                isActive: function () {
                    return state;
                },
                /**
                 * Set a new state for the toggle.
                 * @return {boolean} true to activate
                 */
                setState: function (newState) {
                    if (state !== newState) {
                        changeState();
                    }
                },
                /**
                 * Toggle the current state; activate if it is inactive,
                 * deactivate if it is active.
                 */
                toggle: function () {
                    changeState();
                }
            };

        }

        return ClickAwayController;
    }
);