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
/*global define,moment*/

define(
    [],
    function () {
        "use strict";

        /**
         * Controller for the `datetime` form control.
         * This is a composite control; it includes multiple
         * input fields but outputs a single timestamp (in
         * milliseconds since start of 1970) to the ngModel.
         *
         * @constructor
         */
        function DateTimeController($scope) {

            // Update the data model
            function updateModel(datetime) {
                var days = parseInt(datetime.days, 10) || 0,
                    hour = parseInt(datetime.hours, 10) || 0,
                    min = parseInt(datetime.minutes, 10) || 0,
                    sec = parseInt(datetime.seconds, 10) || 0,
                    epoch = "SET", // Only permit SET, for now
                    timestamp;

                // Build up timestamp
                timestamp = days * 24;
                timestamp = (hour + timestamp) * 60;
                timestamp = (min + timestamp) * 60;
                timestamp = (sec + timestamp) * 1000;

                // Set in the model
                $scope.ngModel[$scope.field] = {
                    timestamp: timestamp,
                    epoch: epoch
                };
            }

            // Update the displayed state
            function updateForm(modelState) {
                var timestamp = (modelState || {}).timestamp || 0,
                    datetime = $scope.datetime;

                timestamp = Math.floor(timestamp / 1000);
                datetime.seconds = timestamp % 60;
                timestamp = Math.floor(timestamp / 60);
                datetime.minutes = timestamp % 60;
                timestamp = Math.floor(timestamp / 60);
                datetime.hours = timestamp % 24;
                timestamp = Math.floor(timestamp / 24);
                datetime.days = timestamp;
            }

            // Retrieve state from field, for watch
            function getModelState() {
                return $scope.ngModel[$scope.field];
            }

            // Update value whenever any field changes.
            $scope.$watchCollection("datetime", updateModel);
            $scope.$watchCollection(getModelState, updateForm);

            // Initialize the scope
            $scope.datetime = {};
            updateForm(getModelState());
        }

        return DateTimeController;

    }
);