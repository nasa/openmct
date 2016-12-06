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

/**
 * This bundle adds a table view for displaying telemetry data.
 * @namespace platform/features/table
 */
define(
    [
        '../TableConfiguration',
        '../../../../../src/api/objects/object-utils'

    ],
    function (TableConfiguration, objectUtils) {

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
            telemetryFormatter,
            openmct
        ) {
            var self = this;

            this.$scope = $scope;
            this.columns = {}; //Range and Domain columns
            this.handle = undefined;
            this.telemetryHandler = telemetryHandler;
            this.table = new TableConfiguration($scope.domainObject,
                telemetryFormatter);
            this.changeListeners = [];
            this.conductor = openmct.conductor;
            this.openmct = openmct;
            this.newObject = objectUtils.toNewFormat($scope.domainObject.getModel(), $scope.domainObject.getId());

            $scope.rows = [];

            // Subscribe to telemetry when a domain object becomes available
            this.$scope.$watch('domainObject', function () {
                self.subscribe();
                self.registerChangeListeners();
            });

            this.destroy = this.destroy.bind(this);

            // Unsubscribe when the plot is destroyed
            this.$scope.$on("$destroy", this.destroy);
            this.timeColumns = [];


            this.sortByTimeSystem = this.sortByTimeSystem.bind(this);
            this.conductor.on('timeSystem', this.sortByTimeSystem);
            this.conductor.off('timeSystem', this.sortByTimeSystem);
        }

        /**
         * Based on the selected time system, find a matching domain column
         * to sort by. By default will just match on key.
         * @param timeSystem
         */
        TelemetryTableController.prototype.sortByTimeSystem = function (timeSystem) {
            var scope = this.$scope;
            scope.defaultSort = undefined;
            if (timeSystem) {
                this.table.columns.forEach(function (column) {
                    if (column.domainMetadata && column.domainMetadata.key === timeSystem.metadata.key) {
                        scope.defaultSort = column.getTitle();
                    }
                });
            }
        };

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
            var self = this;
            this.unregisterChangeListeners();

            // When composition changes, re-subscribe to the various
            // telemetry subscriptions
            this.changeListeners.push(this.$scope.$watchCollection(
                'domainObject.getModel().composition',
                function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        self.subscribe();
                    }
                })
            );
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
            var telemetryApi = this.openmct.telemetry;

            if (this.handle) {
                this.handle.unsubscribe();
            }
            this.$scope.loading = true;

            function map(func){
                return function (objects) {
                    return Promise.all(objects.map(func));
                }
            }

            function add(object){
                return function (objects) {
                    objects.unshift(object);
                    return objects;
                }
            }

            function subscribeTo(object) {
                return telemetryApi.request(object, {});
            }

            function error() {
                console.log("Unable to subscribe");
            }

            this.openmct.composition.get(this.newObject)
                .load()
                .then(add(this.newObject))
                .then(map(subscribeTo))
                .then(function (telemetry) {
                    console.log(telemetry.length);
                }).catch(error);

            this.handle = this.$scope.domainObject && this.telemetryHandler.handle(
                this.$scope.domainObject,
                this.addRealtimeData.bind(this),
                true // Lossless
            );

            this.handle.request({}).then(this.addHistoricalData.bind(this));

            this.setup();
        };

        TelemetryTableController.prototype.populateColumns = function (telemetryMetadata) {
            this.table.populateColumns(telemetryMetadata);

            //Identify time columns
            telemetryMetadata.forEach(function (metadatum) {
                //Push domains first
                (metadatum.domains || []).forEach(function (domainMetadata) {
                    this.timeColumns.push(domainMetadata.name);
                }.bind(this));
            }.bind(this));

            var timeSystem = this.conductor.timeSystem();
            if (timeSystem) {
                this.sortByTimeSystem(timeSystem);
            }
        };

        /**
         * Setup table columns based on domain object metadata
         */
        TelemetryTableController.prototype.setup = function () {
            var handle = this.handle,
                self = this;

            if (handle) {
                this.timeColumns = [];
                handle.promiseTelemetryObjects().then(function () {
                    self.$scope.headers = [];
                    self.$scope.rows = [];

                    self.populateColumns(handle.getMetadata());
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
