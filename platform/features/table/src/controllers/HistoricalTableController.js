/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
    [
        './TelemetryTableController'
    ],
    (TableController) => {
        let BATCH_SIZE = 1000;

        /**
         * Extends TelemetryTableController and adds real-time streaming
         * support.
         * @memberof platform/features/table
         * @param $scope
         * @param telemetryHandler
         * @param telemetryFormatter
         * @constructor
         */
        class HistoricalTableController extends TableController {
          constructor($scope, telemetryHandler, telemetryFormatter, $timeout, openmct) {
            super();
            this.$timeout = $timeout;
            this.timeoutHandle = undefined;
            this.batchSize = BATCH_SIZE;

            $scope.$on("$destroy", () => {
                if (this.timeoutHandle) {
                    this.$timeout.cancel(this.timeoutHandle);
                }
            });

            TableController.call(this, $scope, telemetryHandler, telemetryFormatter, openmct);
        }

        /**
         * Set provided row data on scope, and cancel loading spinner
         * @private
         */
        doneProcessing(rowData) {
            this.$scope.rows = rowData;
            this.$scope.loading = false;
        };

        /**
         * @private
         */
        registerChangeListeners() {
            TableController.registerChangeListeners.call(this);
            //Change of bounds in time conductor
            this.changeListeners.push(this.$scope.$on('telemetry:display:bounds',
                    this.boundsChange.bind(this))
            );
        };

        /**
         * @private
         */
        boundsChange(event, bounds, follow) {
            // If in follow mode, don't bother re-subscribing, data will be
            // received from existing subscription.
            if (follow !== true) {
                this.subscribe();
            }
        };

        /**
         * Processes an array of objects, formatting the telemetry available
         * for them and setting it on scope when done
         * @private
         */
        processTelemetryObjects(objects, offset, start, rowData) {
            let telemetryObject = objects[offset],
                series,
                i = start,
                pointCount,
                end;

            //No more objects to process
            if (!telemetryObject) {
                return this.doneProcessing(rowData);
            }

            series = this.handle.getSeries(telemetryObject);

            pointCount = series.getPointCount();
            end = Math.min(start + this.batchSize, pointCount);

            //Process rows in a batch with size not exceeding a maximum length
            for (; i < end; i++) {
                rowData.push(this.table.getRowValues(telemetryObject,
                    this.handle.makeDatum(telemetryObject, series, i)));
            }

            //Done processing all rows for this object.
            if (end >= pointCount) {
                offset++;
                end = 0;
            }

            // Done processing either a batch or an object, yield process
            // before continuing processing
            this.timeoutHandle = this.$timeout(this.processTelemetryObjects.bind(this, objects, offset, end, rowData));
        };

        /**
        * Populates historical data on scope when it becomes available from
        * the telemetry API
        */
        addHistoricalData() {
            if (this.timeoutHandle) {
                this.$timeout.cancel(this.timeoutHandle);
            }

            this.timeoutHandle = this.$timeout(this.processTelemetryObjects.bind(this, this.handle.getTelemetryObjects(), 0, 0, []));
        };
      }
        return HistoricalTableController;
    }
);
