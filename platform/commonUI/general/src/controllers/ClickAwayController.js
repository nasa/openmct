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

define(
    [],
    function () {
        "use strict";

        /**
         * A ClickAwayController is used to toggle things (such as context
         * menus) where clicking elsewhere in the document while the toggle
         * is in an active state is intended to dismiss the toggle.
         *
         * @memberof platform/commonUI/general
         * @constructor
         * @param $scope the scope in which this controller is active
         * @param $document the document element, injected by Angular
         */
        function ClickAwayController($scope, $document) {
            var self = this;

            this.state = false;
            this.$scope = $scope;
            this.$document = $document;

            // Callback used by the document listener. Deactivates;
            // note also $scope.$apply is invoked to indicate that
            // the state of this controller has changed.
            this.clickaway = function () {
                self.deactivate();
                $scope.$apply();
                return false;
            };
        }

        // Track state, but also attach and detach a listener for
        // mouseup events on the document.
        ClickAwayController.prototype.deactivate = function () {
            this.state = false;
            this.$document.off("mouseup", this.clickaway);
        };
        ClickAwayController.prototype.activate = function () {
            this.state = true;
            this.$document.on("mouseup", this.clickaway);
        };

        /**
         * Get the current state of the toggle.
         * @return {boolean} true if active
         */
        ClickAwayController.prototype.isActive =function () {
            return this.state;
        };

        /**
         * Set a new state for the toggle.
         * @return {boolean} true to activate
         */
        ClickAwayController.prototype.setState = function (newState) {
            if (this.state !== newState) {
                this.toggle();
            }
        };

        /**
         * Toggle the current state; activate if it is inactive,
         * deactivate if it is active.
         */
        ClickAwayController.prototype.toggle = function () {
            if (this.state) {
                this.deactivate();
            } else {
                this.activate();
            }
        };

        return ClickAwayController;
    }
);
