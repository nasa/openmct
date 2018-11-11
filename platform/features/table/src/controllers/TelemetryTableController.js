/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
/* global console*/

/**
 * This bundle adds a table view for displaying telemetry data.
 * @namespace platform/features/table
 */
define(
    [
        '../TableConfiguration',
        '../../../../../src/api/objects/object-utils',
        '../TelemetryCollection',
        'lodash'

    ],
    function (TableConfiguration, objectUtils, TelemetryCollection, _) {

        /**
         * The TableController is responsible for getting data onto the page
         * in the table widget. This includes handling composition,
         * configuration, and telemetry subscriptions.
         * @memberof platform/features/table
         * @param $scope
         * @constructor
         */
        function TelemetryTableController(
            $scope,
            $timeout,
            openmct
        ) {

            this.$scope = $scope;
            this.$timeout = $timeout;
            this.openmct = openmct;
            this.batchSize = 1000;

            /*
             * Initialization block
             */
            this.columns = {}; //Range and Domain columns
            this.unobserveObject = undefined;
            this.subscriptions = [];
            this.timeColumns = [];
            $scope.rows = [];
            this.table = new TableConfiguration($scope.domainObject,
                openmct);
            this.lastBounds = this.openmct.time.bounds();
            this.lastRequestTime = 0;
            this.telemetry = new TelemetryCollection();
            if (this.lastBounds) {
                this.telemetry.bounds(this.lastBounds);
            }

            /*
             * Create a new format object from legacy object, and replace it
             * when it changes
             */
            this.domainObject = objectUtils.toNewFormat($scope.domainObject.getModel(),
                $scope.domainObject.getId());

            this.$scope.exportAs = this.$scope.domainObject.getModel().name;

            _.bindAll(this, [
                'destroy',
                'sortByTimeSystem',
                'loadColumns',
                'getHistoricalData',
                'subscribeToNewData',
                'changeBounds',
                'setClock',
                'addRowsToTable',
                'removeRowsFromTable'
            ]);

            // Retrieve data when domain object is available.
            // Also deferring telemetry request makes testing easier as controller
            // construction has no unintended consequences.
            $scope.$watch("domainObject", function () {
                this.getData();
                this.registerChangeListeners();
            }.bind(this));

            this.setClock(this.openmct.time.clock());

            this.$scope.$on("$destroy", this.destroy);
        }

        /**
         * @private
         * @param {boolean} scroll
         */
        TelemetryTableController.prototype.setClock = function (clock) {
            this.$scope.autoScroll = clock !== undefined;
        };

        /**
         * Based on the selected time system, find a matching domain column
         * to sort by. By default will just match on key.
         *
         * @private
         */
        TelemetryTableController.prototype.sortByTimeSystem = function () {
            var scope = this.$scope;
            var sortColumn;
            scope.defaultSort = undefined;

            sortColumn = this.table.columns.filter(function (column) {
                return column.isCurrentTimeSystem();
            })[0];
            if (sortColumn) {
                scope.defaultSort = sortColumn.title();
                this.telemetry.sort(sortColumn.title() + '.value');
            }
        };

        /**
         * Attaches listeners that respond to state change in domain object,
         * conductor, and receipt of telemetry
         *
         * @private
         */
        TelemetryTableController.prototype.registerChangeListeners = function () {
            if (this.unobserveObject) {
                this.unobserveObject();
            }

            this.unobserveObject = this.openmct.objects.observe(this.domainObject, "*",
                    function (domainObject) {
                        this.domainObject = domainObject;
                        this.getData();
                    }.bind(this)
                );

            this.openmct.time.on('timeSystem', this.sortByTimeSystem);
            this.openmct.time.on('bounds', this.changeBounds);
            this.openmct.time.on('clock', this.setClock);

            this.telemetry.on('added', this.addRowsToTable);
            this.telemetry.on('discarded', this.removeRowsFromTable);
        };

        /**
         * On receipt of new telemetry, informs mct-table directive that new rows
         * are available and passes populated rows to it
         *
         * @private
         * @param rows
         */
        TelemetryTableController.prototype.addRowsToTable = function (rows) {
            this.$scope.$broadcast('add:rows', rows);
        };

        /**
         * When rows are to be removed, informs mct-table directive. Row removal
         * happens when rows call outside the bounds of the time conductor
         *
         * @private
         * @param rows
         */
        TelemetryTableController.prototype.removeRowsFromTable = function (rows) {
            this.$scope.$broadcast('remove:rows', rows);
        };

        /**
         * On Time Conductor bounds change, update displayed telemetry. In the
         * case of a tick, previously visible telemetry that is now out of band
         * will be removed from the table.
         * @param {openmct.TimeConductorBounds~TimeConductorBounds} bounds
         */
        TelemetryTableController.prototype.changeBounds = function (bounds, isTick) {
            if (isTick) {
                this.telemetry.bounds(bounds);
            } else {
                // Is fixed bounds change
                this.getData();
            }
            this.lastBounds = bounds;
        };

        /**
         * Clean controller, deregistering listeners etc.
         */
        TelemetryTableController.prototype.destroy = function () {

            this.openmct.time.off('timeSystem', this.sortByTimeSystem);
            this.openmct.time.off('bounds', this.changeBounds);
            this.openmct.time.off('clock', this.setClock);

            this.subscriptions.forEach(function (subscription) {
                subscription();
            });

            if (this.unobserveObject) {
                this.unobserveObject();
            }
            this.subscriptions = [];

            if (this.timeoutHandle) {
                this.$timeout.cancel(this.timeoutHandle);
            }
        };

        /**
         * For given objects, populate column metadata and table headers.
         * @private
         * @param {module:openmct.DomainObject[]} objects the domain objects for
         * which columns should be populated
         */
        TelemetryTableController.prototype.loadColumns = function (objects) {
            var telemetryApi = this.openmct.telemetry;

            this.table = new TableConfiguration(this.$scope.domainObject,
                this.openmct);

            this.$scope.headers = [];

            if (objects.length > 0) {
                objects.forEach(function (object) {
                    var metadataValues = telemetryApi.getMetadata(object).values();
                    metadataValues.forEach(function (metadatum) {
                        this.table.addColumn(object, metadatum);
                    }.bind(this));
                }.bind(this));

                this.filterColumns();
                this.sortByTimeSystem();
            }

            return objects;
        };

        /**
         * Request telemetry data from an historical store for given objects.
         * @private
         * @param {object[]} The domain objects to request telemetry for
         * @returns {Promise} resolved when historical data is available
         */
        TelemetryTableController.prototype.getHistoricalData = function (objects) {
            var self = this;
            var openmct = this.openmct;
            var bounds = openmct.time.bounds();
            var scope = this.$scope;
            var rowData = [];
            var processedObjects = 0;
            var requestTime = this.lastRequestTime = Date.now();
            var telemetryCollection = this.telemetry;

            var promise = new Promise(function (resolve, reject) {
                /*
                 * On completion of batched processing, set the rows on scope
                 */
                function finishProcessing() {
                    telemetryCollection.add(rowData);
                    scope.rows = telemetryCollection.telemetry;
                    self.loading(false);

                    resolve(scope.rows);
                }

                /*
                 * Process a batch of historical data
                 */
                function processData(object, historicalData, index, limitEvaluator) {
                    if (index >= historicalData.length) {
                        processedObjects++;

                        if (processedObjects === objects.length) {
                            finishProcessing();
                        }
                    } else {
                        rowData = rowData.concat(historicalData.slice(index, index + self.batchSize)
                            .map(self.table.getRowValues.bind(self.table, object, limitEvaluator)));
                        /*
                         Use timeout to yield process to other UI activities. On
                         return, process next batch
                         */
                        self.timeoutHandle = self.$timeout(function () {
                            processData(object, historicalData, index + self.batchSize, limitEvaluator);
                        });
                    }
                }

                function makeTableRows(object, historicalData) {
                    // Only process the most recent request
                    if (requestTime === self.lastRequestTime) {
                        var limitEvaluator = openmct.telemetry.limitEvaluator(object);
                        processData(object, historicalData, 0, limitEvaluator);
                    } else {
                        resolve(rowData);
                    }
                }

                /*
                Use the telemetry API to request telemetry for a given object
                 */
                function requestData(object) {
                    return openmct.telemetry.request(object, {
                        start: bounds.start,
                        end: bounds.end
                    }).then(makeTableRows.bind(undefined, object))
                        .catch(reject);
                }
                this.$timeout.cancel(this.timeoutHandle);

                if (objects.length > 0) {
                    objects.forEach(requestData);
                } else {
                    self.loading(false);
                    resolve([]);
                }
            }.bind(this));

            return promise;
        };


        /**
         * Subscribe to real-time data for the given objects.
         * @private
         * @param {object[]} objects The objects to subscribe to.
         */
        TelemetryTableController.prototype.subscribeToNewData = function (objects) {
            var telemetryApi = this.openmct.telemetry;
            var telemetryCollection = this.telemetry;
            //Set table max length to avoid unbounded growth.
            var limitEvaluator;
            var table = this.table;

            this.subscriptions.forEach(function (subscription) {
                subscription();
            });
            this.subscriptions = [];

            function newData(domainObject, datum) {
                limitEvaluator = telemetryApi.limitEvaluator(domainObject);
                telemetryCollection.add([table.getRowValues(domainObject, limitEvaluator, datum)]);
            }

            objects.forEach(function (object) {
                this.subscriptions.push(
                    telemetryApi.subscribe(object, newData.bind(this, object), {}));
            }.bind(this));

            return objects;
        };

        /**
         * Return an array of telemetry objects in this view that should be
         * subscribed to.
         * @private
         * @returns {Promise<Array>} a promise that resolves with an array of
         * telemetry objects in this view.
         */
        TelemetryTableController.prototype.getTelemetryObjects = function () {
            var telemetryApi = this.openmct.telemetry;
            var compositionApi = this.openmct.composition;

            function filterForTelemetry(objects) {
                return objects.filter(telemetryApi.isTelemetryObject.bind(telemetryApi));
            }

            /*
             * If parent object is a telemetry object, subscribe to it. Do not
             * test composees.
             */
            if (telemetryApi.isTelemetryObject(this.domainObject)) {
                return Promise.resolve([this.domainObject]);
            } else {
                /*
                 * If parent object is not a telemetry object, subscribe to all
                 * composees that are telemetry producing objects.
                 */
                var composition = compositionApi.get(this.domainObject);

                if (composition) {
                    return composition
                        .load()
                        .then(filterForTelemetry);
                }
            }
        };

        /**
         * Request historical data, and subscribe to for real-time data.
         * @private
         * @returns {Promise} A promise that is resolved once subscription is
         * established, and historical telemetry is received and processed.
         */
        TelemetryTableController.prototype.getData = function () {
            var scope = this.$scope;

            this.telemetry.clear();
            this.telemetry.bounds(this.openmct.time.bounds());

            this.loading(true);
            scope.rows = [];

            return this.getTelemetryObjects()
                .then(this.loadColumns)
                .then(this.subscribeToNewData)
                .then(this.getHistoricalData)
                .catch(function error(e) {
                    this.loading(false);
                    console.error(e.stack || e);
                }.bind(this));
        };

        TelemetryTableController.prototype.loading = function (loading) {
            this.$timeout(function () {
                this.$scope.loading = loading;
            }.bind(this));
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
