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
    [
        './TelemetryTableController'
    ],
    function (TableController) {

        /**
         * Extends TelemetryTableController and adds real-time streaming
         * support.
         * @memberof platform/features/table
         * @param $scope
         * @param telemetryHandler
         * @param telemetryFormatter
         * @constructor
         */
        function HistoricalTableController($scope, telemetryHandler, telemetryFormatter, $timeout, $q) {
            this.$timeout = $timeout;
            this.$q = $q;
            TableController.call(this, $scope, telemetryHandler, telemetryFormatter);
            $scope.loading = true;
        }

        HistoricalTableController.prototype = Object.create(TableController.prototype);

        function fastPromise(value) {
            if (value && value.then) {
                return value;
            } else {
                return {
                    then: function (callback) {
                        return fastPromise(callback(value));
                    }
                };
            }
        }

        /**
         * @private
         */
        HistoricalTableController.prototype.yieldingLoop = function (index, max, forEach, yieldAfter) {
            var self = this;

            if (index < max) {
                forEach(index);
                if (index % yieldAfter === 0) {
                    return this.$timeout(function () {
                        return self.yieldingLoop(++index, max, forEach, yieldAfter);
                    });
                } else {
                    return self.yieldingLoop(++index, max, forEach, yieldAfter);
                }
            } else {
                return this.$q.when(undefined);
            }
        };

        /**
         * Populates historical data on scope when it becomes available from
         * the telemetry API
         */
        HistoricalTableController.prototype.addHistoricalData = function () {
            var rowData = [],
                self = this;

            this.$scope.loading = true;

            function processTelemetryObject(telemetryObject) {
                var series = self.handle.getSeries(telemetryObject) || {},
                    pointCount = series.getPointCount ? series.getPointCount() : 0,
                    i = 0;

                return self.yieldingLoop(i, pointCount, function (index) {
                    rowData.push(self.table.getRowValues(telemetryObject,
                        self.handle.makeDatum(telemetryObject, series, index)));
                }, 1000);
            }

            this.handle.getTelemetryObjects().reduce(function (promise, telemetryObject) {
                return promise.then(function () {
                    return processTelemetryObject(telemetryObject);
                });
            }, self.$q.when(undefined)).then(function () {
                self.$scope.rows = rowData;
                self.$scope.loading = false;
            });
        };

        return HistoricalTableController;
    }
);
