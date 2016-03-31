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
/*global define*/

define(
    [
        './TelemetryTableController'
    ],
    function (TableController) {
        "use strict";

        /**
         * Extends TelemetryTableController and adds real-time streaming
         * support.
         * @memberof platform/features/table
         * @param $scope
         * @param telemetryHandler
         * @param telemetryFormatter
         * @constructor
         */
        function RTTelemetryTableController($scope, telemetryHandler, telemetryFormatter) {
            TableController.call(this, $scope, telemetryHandler, telemetryFormatter);

            $scope.autoScroll = false;
            this.maxRows = 100000;

            /*
             * Determine if auto-scroll should be enabled. Is enabled
             * automatically when telemetry type is string
             */
            function hasStringTelemetry(domainObject) {
                var telemetry = domainObject &&
                        domainObject.getCapability('telemetry'),
                    metadata = telemetry ? telemetry.getMetadata() : {},
                    ranges = metadata.ranges || [];

                return ranges.some(function (range) {
                    return range.format === 'string';
                });
            }
            $scope.$watch('domainObject', function (domainObject) {
                //When a domain object becomes available, check whether the
                // view should auto-scroll to the bottom.
                if (domainObject && hasStringTelemetry(domainObject)){
                    $scope.autoScroll = true;
                }
            });
        }

        RTTelemetryTableController.prototype = Object.create(TableController.prototype);

        /**
         Override the subscribe function defined on the parent controller in
         order to handle realtime telemetry instead of historical.
         */
        RTTelemetryTableController.prototype.subscribe = function () {
            var self = this;
            self.$scope.rows = undefined;
            (this.subscriptions || []).forEach(function (unsubscribe){
                unsubscribe();
            });

            if (this.handle) {
                this.handle.unsubscribe();
            }

            function updateData(){
                var datum,
                    row;
                self.handle.getTelemetryObjects().forEach(function (telemetryObject){
                    datum = self.handle.getDatum(telemetryObject);
                    if (datum) {
                        row = self.table.getRowValues(telemetryObject, datum);
                        if (!self.$scope.rows){
                            self.$scope.rows = [row];
                            self.$scope.$digest();
                        } else {
                            self.$scope.rows.push(row);

                            if (self.$scope.rows.length > self.maxRows) {
                                self.$scope.$broadcast('remove:row', 0);
                                self.$scope.rows.shift();
                            }

                            self.$scope.$broadcast('add:row',
                                self.$scope.rows.length - 1);
                        }
                    }
                });

            }

            this.handle = this.$scope.domainObject && this.telemetryHandler.handle(
                    this.$scope.domainObject,
                    updateData,
                    true // Lossless
                );

            this.setup();
        };

        return RTTelemetryTableController;
    }
);
