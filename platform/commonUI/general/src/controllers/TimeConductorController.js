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
    ['moment'],
    function (moment) {
        "use strict";

        var DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

        /**
         * @memberof platform/commonUI/general
         * @constructor
         */
        function TimeConductorController($scope, now) {
            var tickCount = 2;

            $scope.state = false;
            $scope.ticks = [];

            function formatTimestamp(ts) {
                return moment.utc(ts).format(DATE_FORMAT);
            }

            // From 0.0-1.0 to "0%"-"1%"
            function toPercent(p) {
                return (100 * p) + "%";
            }

            function updateTicks() {
                var i, p, ts, start, end, span;
                end = $scope.ngModel.outer[1];
                start = $scope.ngModel.outer[0];
                span = end - start;
                $scope.ticks = [];
                for (i = 0; i < tickCount; i += 1) {
                    p = i / (tickCount - 1);
                    ts = p * span + start;
                    $scope.ticks.push(formatTimestamp(ts));
                }
            }

            function updateSpanWidth(w) {
                // Space about 100px apart
                tickCount = Math.max(Math.floor(w / 100), 2);
                updateTicks();
            }

            function updateFromParameters(ngModel) {
                var t = now(), span;

                ngModel = ngModel || {
                    outer: [ t - 24 * 3600 * 1000, t ],
                    inner: [ t - 24 * 3600 * 1000, t ]
                };

                // First, dates for the date pickers for outer bounds
                $scope.startOuterDate = new Date(ngModel.outer[0]);
                $scope.endOuterDate = new Date(ngModel.outer[1]);

                // Then readable dates for the knobs
                $scope.startInnerText = formatTimestamp(ngModel.inner[0]);
                $scope.endInnerText = formatTimestamp(ngModel.inner[1]);

                // And positions for the knobs
                span = ngModel.outer[1] - ngModel.outer[0];
                $scope.startInnerPct =
                    toPercent((ngModel.inner[0] - ngModel.outer[0]) / span);
                $scope.endInnerPct =
                    toPercent((ngModel.outer[1] - ngModel.inner[1]) / span);

                // Stick it back is scope (in case we just set defaults)
                $scope.ngModel = ngModel;

                updateTicks();
            }

            // Initialize scope to defaults
            updateFromParameters();

            $scope.$watchCollection("ngModel", updateFromParameters);
            $scope.$watch("spanWidth", updateSpanWidth);

        }

        return TimeConductorController;
    }
);
