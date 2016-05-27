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
        var BATCH_SIZE = 1000;

        /**
         * Extends TelemetryTableController and adds real-time streaming
         * support.
         * @memberof platform/features/table
         * @param $scope
         * @param telemetryHandler
         * @param telemetryFormatter
         * @constructor
         */
        function HistoricalTableController($scope, telemetryHandler, telemetryFormatter, $timeout) {
            var self = this;

            this.$timeout = $timeout;
            this.timeouts = [];
            this.batchSize = BATCH_SIZE;

            $scope.$on("$destroy", function () {
                self.cancelAllTimeouts();
            });

            TableController.call(this, $scope, telemetryHandler, telemetryFormatter);
        }

        HistoricalTableController.prototype = Object.create(TableController.prototype);

        /**
         * Cancels outstanding processing
         * @private
         */
        HistoricalTableController.prototype.cancelAllTimeouts = function() {
            this.timeouts.forEach(function (timeout) {
              clearTimeout(timeout);
            });
            this.timeouts = [];
        };

        /**
         * Will yield execution of a long running process, allowing
         * execution of UI and other activities
         * @private
         * @param callback the function to execute after yielding
         * @returns {number}
         */
        HistoricalTableController.prototype.yield = function(callback) {
            return setTimeout(callback, 0);
        };

        /**
        * Populates historical data on scope when it becomes available from
        * the telemetry API
        */
        HistoricalTableController.prototype.addHistoricalData = function () {
            var rowData = [],
                self = this,
                telemetryObjects = this.handle.getTelemetryObjects();

            this.cancelAllTimeouts();

            function processTelemetryObject(offset) {
                var telemetryObject = telemetryObjects[offset],
                    series = self.handle.getSeries(telemetryObject) || {},
                    pointCount = series.getPointCount ? series.getPointCount() : 0;

                function processBatch(start, end, done) {
                    var i;

                    if (start < pointCount) {
                        for (i = start; i < end; i++) {
                            rowData.push(self.table.getRowValues(telemetryObject,
                                self.handle.makeDatum(telemetryObject, series, i)));
                        }
                        self.timeouts.push(self.yield(function () {
                            processBatch(end, end + self.batchSize, done);
                        }));
                    } else {
                        offset++;
                        if (offset < telemetryObjects.length) {
                            processTelemetryObject(offset);
                        } else {
                            // Apply digest. Digest may not be necessary here, so
                            // using $timeout instead of $scope.$apply to avoid
                            // in progress error
                            self.$timeout(function () {
                                self.$scope.loading = false;
                                self.$scope.rows = rowData;
                            });
                        }
                    }
                }
                processBatch(0, self.batchSize);
            }

            if (telemetryObjects.length > 0) {
                this.$scope.loading = true;
                processTelemetryObject(0);
            }

        };

        return HistoricalTableController;
    }
);
