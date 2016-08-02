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


define(
    ["./PaneController"],
    function (PaneController) {

        /**
         * Pane controller that reveals inspector, if hidden, when object
         * switches to edit mode.
         *
         * @param $scope
         * @param agentService
         * @param $window
         * @param navigationService
         * @constructor
         */
        function InspectorPaneController($scope, agentService, $window, navigationService) {
            PaneController.call(this, $scope, agentService, $window);

            var statusListener,
                self = this;

            function showInspector(statuses) {
                if (statuses.indexOf('editing') !== -1 && !self.visible()) {
                    self.toggle();
                }
            }

            function attachStatusListener(domainObject) {
                // Remove existing status listener if existing
                if (statusListener) {
                    statusListener();
                }

                if (domainObject.hasCapability("status")) {
                    statusListener = domainObject.getCapability("status").listen(showInspector);
                }
                return statusListener;
            }

            var domainObject = navigationService.getNavigation();
            if (domainObject) {
                attachStatusListener(domainObject);
            }

            var navigationListener = navigationService.addListener(attachStatusListener);

            $scope.$on("$destroy", function () {
                statusListener();
                navigationListener();
            });
        }

        InspectorPaneController.prototype = Object.create(PaneController.prototype);

        return InspectorPaneController;
    }
);
