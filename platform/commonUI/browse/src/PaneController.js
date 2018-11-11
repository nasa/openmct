/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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


define(
    [],
    function () {
        var navigationListenerAdded = false;
        /**
         * Controller to provide the ability to show/hide the tree in
         * Browse mode.
         * @constructor
         * @memberof platform/commonUI/browse
         */
        function PaneController($scope, agentService, $window, $location, $attrs, navigationService) {
            var self = this;
            this.agentService = agentService;
            var hideParameterPresent = $location.search().hasOwnProperty($attrs.hideParameter);

            if ($attrs.hideParameter && hideParameterPresent) {
                this.state = false;
                $location.search($attrs.hideParameter, undefined);
            } else {
                this.state = true;
            }

            /**
             * Callback to invoke when any selection occurs in the tree.
             * This controller can be passed in as the `parameters` object
             * to the tree representation.
             *
             * @property {Function} callback
             * @memberof platform/commonUI/browse.PaneController#
             */
            this.callback = function () {
                // Note that, since this is a callback to pass, this is not
                // declared as a method but as a property which happens to
                // be a function.
                if (agentService.isPhone() && agentService.isPortrait()) {
                    // On phones, trees should collapse in portrait mode
                    // when something is navigated-to.
                    self.state = false;
                }
            };

            if (navigationService && navigationService.addListener && !navigationListenerAdded) {
                navigationService.addListener(this.callback);
                navigationListenerAdded = true;
            }
        }

        /**
         * Toggle the visibility of the pane.
         */
        PaneController.prototype.toggle = function () {
            this.state = !this.state;
        };

        /**
         * Get the desired visibility state of the pane.
         * @returns {boolean} true when visible
         */
        PaneController.prototype.visible = function () {
            return !!this.state;
        };

        return PaneController;
    }
);
