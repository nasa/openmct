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
        '../Table',
        '../NameColumn'
    ],
    function (Table, NameColumn) {
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
        function TableController(
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
            this.table = new Table($scope.domainObject, telemetryFormatter);
            this.changeListeners = [];

            $scope.rows = [];

            // Subscribe to telemetry when a domain object becomes available
            this.$scope.$watch('domainObject', function(domainObject){
                if (!domainObject)
                    return;

                self.subscribe();
                self.registerChangeListeners();
            });

            // Unsubscribe when the plot is destroyed
            this.$scope.$on("$destroy", this.destroy.bind(this));
        }

        TableController.prototype.registerChangeListeners = function() {
            //Defer registration of change listeners until domain object is
            // available in order to avoid race conditions

            this.changeListeners.forEach(function (listener) {
                return listener && listener();
            });
            this.changeListeners = [];
            // When composition changes, re-subscribe to the various
            // telemetry subscriptions
            this.changeListeners.push(this.$scope.$watchCollection('domainObject.getModel().composition', this.subscribe.bind(this)));

            //Change of bounds in time conductor
            this.changeListeners.push(this.$scope.$on('telemetry:display:bounds', this.subscribe.bind(this)));

        };

        /**
         * Release the current subscription (called when scope is destroyed)
         */
        TableController.prototype.destroy = function () {
            if (this.handle) {
                this.handle.unsubscribe();
                this.handle = undefined;
            }
        };

        /**
         Create a new subscription. This is called when
         */
        TableController.prototype.subscribe = function() {
            var self = this;

            /*if (this.pending){
                return;
            }*/
            //this.pending = true;

            if (this.handle) {
                this.handle.unsubscribe();
            }

            this.$scope.rows = [];

            //Noop because not supporting realtime data right now
            function noop(){
                //self.pending = false;
            }

            this.handle = this.$scope.domainObject && this.telemetryHandler.handle(
                    this.$scope.domainObject,
                    noop,
                    true // Lossless
                );

            this.handle.request({}, this.addHistoricalData.bind(this));

            this.setup();
        };

        /**
         * Add any historical data available
         */
        TableController.prototype.addHistoricalData = function(domainObject, series) {
            var i;
            //this.pending = false;
            for (i=0; i < series.getPointCount(); i++) {
                this.updateRows(domainObject, this.handle.makeDatum(domainObject, series, i));
            }
        };

        /**
         * Set the established configuration on the domain object
         * @private
         */
        TableController.prototype.writeConfigToModel = function (configuration) {
            this.$scope.domainObject.useCapability('mutation', function (model) {
                model.configuration = model.configuration || {};
                model.configuration.table = model.configuration.table || {};
                model.configuration.table.columns = configuration;
            });
        };

        /**
         * Setup table columns based on domain object metadata
         */
        TableController.prototype.setup = function() {
            var handle = this.handle,
                table = this.table,
                self = this,
                configuration;

            if (handle) {
                handle.promiseTelemetryObjects().then(function (objects) {
                    table.buildColumns(handle.getMetadata());

                    if (objects && objects.length > 1){
                        table.addColumn(new NameColumn(), 0);
                    }

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
         * Add data to rows
         * @param object The object for which data is available (table may
         * be composed of multiple objects)
         * @param datum The data received from the telemetry source
         */
        TableController.prototype.updateRows = function (object, datum) {
            this.$scope.rows.push(this.table.getRowValues(object, datum));
        };

        /**
         * When column configuration changes, update the visible headers
         * accordingly.
         */
        TableController.prototype.filterColumns = function () {
            var config = this.table.getColumnConfiguration();

            this.writeConfigToModel(config);
            //Populate headers with visible columns (determined by configuration)
            this.$scope.headers = Object.keys(config).filter(function(column) {
                return config[column];
            });
        };

        return TableController;
    }
);
