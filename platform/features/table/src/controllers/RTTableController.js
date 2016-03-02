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

/**
 * This bundle adds a table view for displaying telemetry data.
 * @namespace platform/features/table
 */
define(
    [
        './TableController',
        '../Table',
        '../NameColumn'
    ],
    function (TableController, Table, NameColumn) {
        "use strict";

        /**
         * The TableController is responsible for getting data onto the page
         * in the table widget. This includes handling composition,
         * configuration, and telemetry subscriptions.
         * @memberof platform/features/table
         * @param $scope
         * @param telemetryHandler
         * @param telemetryFormatter
         * @constructor
         */
        function RTTableController($scope, telemetryHandler, telemetryFormatter) {
            TableController.call(this, $scope, telemetryHandler, telemetryFormatter);
        }

        RTTableController.prototype = Object.create(TableController.prototype);

        /**
         Create a new subscription. This is called when
         */
        RTTableController.prototype.subscribe = function() {
            var self = this;

            if (this.handle) {
                this.handle.unsubscribe();
            }

            function updateData(){
                var datum;
                self.handle.getTelemetryObjects().forEach(function(telemetryObject){
                    datum = self.handle.getDatum(telemetryObject);
                    if (datum) {
                        if (!self.$scope.rows) {
                            self.$scope.rows = [self.table.getRowValues(telemetryObject, datum)];
                        } else {
                            self.updateRows(telemetryObject, datum);
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

        /**
         * Add data to rows
         * @param object The object for which data is available (table may
         * be composed of multiple objects)
         * @param datum The data received from the telemetry source
         */
        RTTableController.prototype.updateRows = function (object, datum) {
            this.$scope.$broadcast('newRow', this.table.getRowValues(object, datum));
        };

        return RTTableController;
    }
);
