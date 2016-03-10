/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
         * Continually refreshes the represented domain object.
         *
         * This is a short-term workaround to assure Timer views stay
         * up-to-date; should be replaced by a global auto-refresh.
         *
         * @constructor
         * @memberof platform/features/clock
         * @param {angular.Scope} $scope the Angular scope
         * @param {platform/features/clock.TickerService} tickerService
         *        a service used to align behavior with clock ticks
         */
        function RefreshingController($scope, tickerService) {
            var unlisten;

            function triggerRefresh() {
                var persistence = $scope.domainObject &&
                    $scope.domainObject.getCapability('persistence');
                return persistence && persistence.refresh();
            }

            unlisten = tickerService.listen(triggerRefresh);
            $scope.$on('$destroy', unlisten);
        }

        return RefreshingController;
    }
);
