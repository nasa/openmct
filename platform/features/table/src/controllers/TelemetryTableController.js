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
            this.telemetryHandler = telemetryHandler;
            this.table = new TableConfiguration($scope.domainObject,
                telemetryFormatter);
            this.changeListeners = [];

            $scope.rows = [];

            // Subscribe to telemetry when a domain object becomes available
            this.$scope.$watch('domainObject', function(){
                self.subscribe();
                self.registerChangeListeners();
            });

            // Unsubscribe when the plot is destroyed
            this.$scope.$on("$destroy", this.destroy.bind(this));
        }

        /**
         * @private
         */
        TelemetryTableController.prototype.unregisterChangeListeners = function () {
            this.changeListeners.forEach(function (listener) {
                return listener && listener();
            });
            this.changeListeners = [];
        };

        /**
         * Defer registration of change listeners until domain object is
         * available in order to avoid race conditions
         * @private
         */
        TelemetryTableController.prototype.registerChangeListeners = function () {
            this.unregisterChangeListeners();

            // When composition changes, re-subscribe to the various
            // telemetry subscriptions
            this.changeListeners.push(this.$scope.$watchCollection(
                'domainObject.getModel().composition', this.subscribe.bind(this)));

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
         * Function for handling realtime data when it is available. This
         * will be called by the telemetry framework when new data is
         * available.
         *
         * Method should be overridden by specializing class.
         */
        TelemetryTableController.prototype.addRealtimeData = function () {
        };

        /**
         * Function for handling historical data. Will be called by
         * telemetry framework when requested historical data is available.
         * Should be overridden by specializing class.
         */
        TelemetryTableController.prototype.addHistoricalData = function () {
        };

        /**
         Create a new subscription. This can be overridden by children to
         change default behaviour (which is to retrieve historical telemetry
         only).
         */
        TelemetryTableController.prototype.subscribe = function () {
            if (this.handle) {
                this.handle.unsubscribe();
            }

            this.handle = this.$scope.domainObject && this.telemetryHandler.handle(
                    this.$scope.domainObject,
                    this.addRealtimeData.bind(this),
                    true // Lossless
                );

            this.handle.request({}).then(this.addHistoricalData.bind(this));

            this.setup();
        };

        /**
         * Setup table columns based on domain object metadata
         */
        TelemetryTableController.prototype.setup = function () {
            var handle = this.handle,
                table = this.table,
                self = this;

            if (handle) {
                handle.promiseTelemetryObjects().then(function () {
                    self.$scope.headers = [];
                    self.$scope.rows = [];
                    table.populateColumns(handle.getMetadata());

                    self.filterColumns();

                    // When table column configuration changes, (due to being
                    // selected or deselected), filter columns appropriately.
                    self.changeListeners.push(self.$scope.$watchCollection(
                        'domainObject.getModel().configuration.table.columns',
                        self.filterColumns.bind(self)
                    ));
                });
            }
        };

        /**
         * When column configuration changes, update the visible headers
         * accordingly.
         * @private
         */
        TelemetryTableController.prototype.filterColumns = function () {
            var columnConfig = this.table.buildColumnConfiguration();

            //Populate headers with visible columns (determined by configuration)
            this.$scope.headers = Object.keys(columnConfig).filter(function (column) {
                return columnConfig[column];
            });
        };

        return TelemetryTableController;
    }
);
