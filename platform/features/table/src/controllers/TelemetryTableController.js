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
        '../TableConfiguration'
    ],
    function (TableConfiguration) {
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
        function TelemetryTableController(
            $scope,
            telemetryHandler,
            telemetryFormatter
        ) {
            var self = this;

            this.$scope = $scope;
            this.columns = {}; //Range and Domain columns
            this.handle = undefined;
            //this.pending = false;
            this.telemetryHandler = telemetryHandler;
            this.table = new TableConfiguration($scope.domainObject,
                telemetryFormatter);
            this.changeListeners = [];

            $scope.rows = [];

            // Subscribe to telemetry when a domain object becomes available
            this.$scope.$watch('domainObject', function(domainObject){
                if (!domainObject)
                    return;

                self.subscribe(domainObject);
                self.registerChangeListeners();
            });

            // Unsubscribe when the plot is destroyed
            this.$scope.$on("$destroy", this.destroy.bind(this));
        }

        /**
         * Defer registration of change listeners until domain object is
         * available in order to avoid race conditions
         * @private
         */
        TelemetryTableController.prototype.registerChangeListeners = function () {
            var self = this;

            this.changeListeners.forEach(function (listener) {
                return listener && listener();
            });
            this.changeListeners = [];

            /**
             * Listen to all children for model mutation events that might
             * indicate that metadata is available, or that composition has
             * changed.
             */
            if (this.$scope.domainObject.hasCapability('composition')) {
                this.$scope.domainObject.useCapability('composition').then(function (composees) {
                    composees.forEach(function (composee) {
                        self.changeListeners.push(composee.getCapability('mutation').listen(self.setup.bind(self)));
                    });
                });
            }

            //Register mutation listener for the parent itself
            self.changeListeners.push(self.$scope.domainObject.getCapability('mutation').listen(this.setup.bind(this)));

            //Change of bounds in time conductor
            this.changeListeners.push(this.$scope.$on('telemetry:display:bounds',
                this.subscribe.bind(this)));
        };

        /**
         * Release the current subscription (called when scope is destroyed)
         */
        TelemetryTableController.prototype.destroy = function () {
            if (this.handle) {
                this.handle.unsubscribe();
                this.handle = undefined;
            }
        };

        /**
         Create a new subscription. This can be overridden by children to
         change default behaviour (which is to retrieve historical telemetry
         only).
         */
        TelemetryTableController.prototype.subscribe = function () {
            var self = this;
            this.$scope.rows = [];

            if (this.handle) {
                this.handle.unsubscribe();
            }

            //Noop because not supporting realtime data right now
            function update(){
                //Is there anything to show?
                if (self.table.columns.length > 0){
                    self.updateRealtime();
                }
            }

            this.handle = this.$scope.domainObject && this.telemetryHandler.handle(
                    self.$scope.domainObject,
                    update,
                    true // Lossless
                );
            this.handle.request({}).then(this.addHistoricalData.bind(this));

            //Call setup at least once
            this.setup();
        };

        /**
         * Override this method to define handling for realtime data.
         */
        TelemetryTableController.prototype.updateRealtime = function () {
            //Noop in an historical table
        };

        /**
         * Populates historical data on scope when it becomes available
         * @private
         */
        TelemetryTableController.prototype.addHistoricalData = function () {
            var rowData = [],
                self = this;

            this.handle.getTelemetryObjects().forEach(function (telemetryObject){
                var series = self.handle.getSeries(telemetryObject) || {},
                    pointCount = series.getPointCount ? series.getPointCount() : 0,
                    i = 0;

                for (; i < pointCount; i++) {
                    rowData.push(self.table.getRowValues(telemetryObject,
                        self.handle.makeDatum(telemetryObject, series, i)));
                }
            });

            this.$scope.rows = rowData;
        };

        /**
         * Setup table columns based on domain object metadata
         */
        TelemetryTableController.prototype.setup = function () {
            var handle = this.handle,
                domainObject = this.$scope.domainObject,
                table = this.table,
                self = this,
                metadatas = [];

            function addMetadata(object) {
                if (object.hasCapability('telemetry') &&
                    object.getCapability('telemetry').getMetadata()){
                    metadatas.push(object.getCapability('telemetry').getMetadata());
                }
            }

            function buildAndFilterColumns(){
                if (metadatas && metadatas.length > 0){
                    self.$scope.rows = [];
                    table.buildColumns(metadatas);
                    self.filterColumns();
                }
            }

            //if (handle) {
                //Add telemetry metadata (if any) for parent object
                addMetadata(domainObject);

                //If object is composed of multiple objects, also add
                // telemetry metadata from children
                if (domainObject.hasCapability('composition')) {
                    domainObject.useCapability('composition').then(function (composition) {
                        composition.forEach(addMetadata);
                    }).then(function () {
                        //Build columns based on available metadata
                        buildAndFilterColumns();
                    });
                } else {
                    //Build columns based on collected metadata
                    buildAndFilterColumns();
                }
           // }
        };

        /**
         * When column configuration changes, update the visible headers
         * accordingly.
         * @private
         */
        TelemetryTableController.prototype.filterColumns = function (columnConfig) {
            if (!columnConfig){
                columnConfig = this.table.getColumnConfiguration();
                this.table.saveColumnConfiguration(columnConfig);
            }
            //Populate headers with visible columns (determined by configuration)
            this.$scope.headers = Object.keys(columnConfig).filter(function (column) {
                return columnConfig[column];
            });
        };

        return TelemetryTableController;
    }
);
