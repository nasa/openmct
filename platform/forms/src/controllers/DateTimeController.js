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
/*global define,moment*/

define(
    ["../../lib/moment.min"],
    function () {
        "use strict";

        var DATE_FORMAT = "YYYY-DDD";

        /**
         * Controller for the `datetime` form control.
         * This is a composite control; it includes multiple
         * input fields but outputs a single timestamp (in
         * milliseconds since start of 1970) to the ngModel.
         *
         * @constructor
         */
        function DateTimeController($scope) {

            // Update the
            function update() {
                var date = $scope.datetime.date,
                    hour = $scope.datetime.hour,
                    min = $scope.datetime.min,
                    sec = $scope.datetime.sec,
                    fullDateTime = moment.utc(date, DATE_FORMAT)
                            .hour(hour || 0)
                            .minute(min || 0)
                            .second(sec || 0);

                if (fullDateTime.isValid()) {
                    $scope.ngModel[$scope.field] = fullDateTime.valueOf();
                }
            }

            // Update value whenever any field changes.
            $scope.$watch("datetime.date", update);
            $scope.$watch("datetime.hour", update);
            $scope.$watch("datetime.min", update);
            $scope.$watch("datetime.sec", update);

            $scope.datetime = {};
        }

        return DateTimeController;

    }
);