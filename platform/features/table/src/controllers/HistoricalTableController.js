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
            this.timeoutHandle = undefined;
            this.batchSize = BATCH_SIZE;

            $scope.$on("$destroy", function () {
                clearTimeout(self.timeoutHandle);
            });

            TableController.call(this, $scope, telemetryHandler, telemetryFormatter);
        }

        HistoricalTableController.prototype = Object.create(TableController.prototype);

        /**
        * Populates historical data on scope when it becomes available from
        * the telemetry API
        */
        HistoricalTableController.prototype.addHistoricalData = function () {
            var rowData = [],
                self = this,
                telemetryObjects = this.handle.getTelemetryObjects();

            function processTelemetryObject(offset) {
                var telemetryObject = telemetryObjects[offset],
                    series = self.handle.getSeries(telemetryObject) || {},
                    pointCount = series.getPointCount ? series.getPointCount() : 0;

                function processBatch(start, end) {
                    var i;
                    end = Math.min(pointCount, end);

                    clearTimeout(self.timeoutHandle);
                    delete self.timeoutHandle;

                    //The row offset (ie. batch start point) does not exceed the rows available
                    for (i = start; i < end; i++) {
                        rowData.push(self.table.getRowValues(telemetryObject,
                            self.handle.makeDatum(telemetryObject, series, i)));
                    }
                    if (end < pointCount) {
                        //Yield if necessary
                        self.timeoutHandle = setTimeout(function () {
                            processBatch(end, end + self.batchSize);
                        }, 0);
                    } else {
                        //All rows for this object have been processed, so check if there are more objects to process
                        offset++;
                        if (offset < telemetryObjects.length) {
                            //More telemetry object to process
                            processTelemetryObject(offset);
                        } else {
                            // No more objects to process. Apply rows to scope
                            // Apply digest. Digest may be in progress (if batch small
                            // enough to not require yield), so using $timeout instead
                            // of $scope.$apply to avoid in progress error
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
