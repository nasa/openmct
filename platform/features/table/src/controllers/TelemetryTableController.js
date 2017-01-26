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
            this.lastBounds = this.openmct.conductor.bounds();
            this.lastRequestTime = 0;
            this.telemetry = new TelemetryCollection();

            /*
             * Create a new format object from legacy object, and replace it
             * when it changes
             */
            this.newObject = objectUtils.toNewFormat($scope.domainObject.getModel(),
                $scope.domainObject.getId());

            _.bindAll(this, [
                'destroy',
                'sortByTimeSystem',
                'loadColumns',
                'getHistoricalData',
                'subscribeToNewData',
                'changeBounds',
                'setScroll',
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

            this.setScroll(this.openmct.conductor.follow());

            this.$scope.$on("$destroy", this.destroy);
        }

        /**
         * @private
         * @param {boolean} scroll
         */
        TelemetryTableController.prototype.setScroll = function (scroll) {
            this.$scope.autoScroll = scroll;
        };

        /**
         * Based on the selected time system, find a matching domain column
         * to sort by. By default will just match on key.
         *
         * @private
         * @param {TimeSystem} timeSystem
         */
        TelemetryTableController.prototype.sortByTimeSystem = function (timeSystem) {
            var scope = this.$scope;
            var sortColumn;
            scope.defaultSort = undefined;

            if (timeSystem) {
                this.table.columns.forEach(function (column) {
                    if (column.getKey() === timeSystem.metadata.key) {
                        sortColumn = column;
                    }
                });
                if (sortColumn) {
                    scope.defaultSort = sortColumn.getTitle();
                    this.telemetry.sort(sortColumn.getTitle() + '.value');
                }
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

            this.unobserveObject = this.openmct.objects.observe(this.newObject, "*",
                    function (domainObject) {
                        this.newObject = domainObject;
                        this.getData();
                    }.bind(this)
                );

            this.openmct.conductor.on('timeSystem', this.sortByTimeSystem);
            this.openmct.conductor.on('bounds', this.changeBounds);
            this.openmct.conductor.on('follow', this.setScroll);

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
        TelemetryTableController.prototype.changeBounds = function (bounds) {
            var follow = this.openmct.conductor.follow();
            var isTick = follow &&
                bounds.start !== this.lastBounds.start &&
                bounds.end !== this.lastBounds.end;

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

            this.openmct.conductor.off('timeSystem', this.sortByTimeSystem);
            this.openmct.conductor.off('bounds', this.changeBounds);
            this.openmct.conductor.off('follow', this.setScroll);

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

            // In case controller instance lingers around (currently there is a
            // temporary memory leak with PlotController), clean up scope as it
            // can be extremely large.
            this.$scope = null;
            this.table = null;
        };

        /**
         * For given objects, populate column metadata and table headers.
         * @private
         * @param {module:openmct.DomainObject[]} objects the domain objects for
         * which columns should be populated
         */
        TelemetryTableController.prototype.loadColumns = function (objects) {
            var telemetryApi = this.openmct.telemetry;

            if (objects.length > 0) {
                var metadatas = objects.map(telemetryApi.getMetadata.bind(telemetryApi));
                var allColumns = telemetryApi.commonValuesForHints(metadatas, []);

                this.table.populateColumns(allColumns);

                var domainColumns = telemetryApi.commonValuesForHints(metadatas, ['x']);
                this.timeColumns = domainColumns.map(function (metadatum) {
                    return metadatum.name;
                });

                this.filterColumns();

                // Default to no sort on underlying telemetry collection. Sorting
                // is necessary to do bounds filtering, but this is only possible
                // if data matches selected time system
                this.telemetry.sort(undefined);

                var timeSystem = this.openmct.conductor.timeSystem();
                if (timeSystem) {
                    this.sortByTimeSystem(timeSystem);
                }

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
            var bounds = openmct.conductor.bounds();
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
                    scope.loading = false;

                    resolve(scope.rows);
                }

                /*
                 * Process a batch of historical data
                 */
                function processData(historicalData, index, limitEvaluator) {
                    if (index >= historicalData.length) {
                        processedObjects++;

                        if (processedObjects === objects.length) {
                            finishProcessing();
                        }
                    } else {
                        rowData = rowData.concat(historicalData.slice(index, index + self.batchSize)
                            .map(self.table.getRowValues.bind(self.table, limitEvaluator)));

                        /*
                         Use timeout to yield process to other UI activities. On
                         return, process next batch
                         */
                        self.timeoutHandle = self.$timeout(function () {
                            processData(historicalData, index + self.batchSize, limitEvaluator);
                        });
                    }
                }

                function makeTableRows(object, historicalData) {
                    // Only process the most recent request
                    if (requestTime === self.lastRequestTime) {
                        var limitEvaluator = openmct.telemetry.limitEvaluator(object);
                        processData(historicalData, 0, limitEvaluator);
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
                    scope.loading = false;
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
            //var maxRows = 100000;
            var maxRows = Number.MAX_VALUE;
            var limitEvaluator;
            var added = false;
            var scope = this.$scope;
            var table = this.table;

            this.subscriptions.forEach(function (subscription) {
                subscription();
            });
            this.subscriptions = [];

            function newData(domainObject, datum) {
                limitEvaluator = telemetryApi.limitEvaluator(domainObject);
                added = telemetryCollection.add([table.getRowValues(limitEvaluator, datum)]);

                //Inform table that a new row has been added
                if (scope.rows.length > maxRows) {
                    scope.$broadcast('remove:rows', scope.rows[0]);
                    scope.rows.shift();
                }
                if (!scope.loading && added) {
                    scope.$broadcast('add:row',
                        scope.rows.length - 1);
                }
            }

            objects.forEach(function (object) {
                this.subscriptions.push(
                    telemetryApi.subscribe(object, newData.bind(this, object), {}));
            }.bind(this));

            return objects;
        };

        /**
         * Request historical data, and subscribe to for real-time data.
         * @private
         * @returns {Promise} A promise that is resolved once subscription is
         * established, and historical telemetry is received and processed.
         */
        TelemetryTableController.prototype.getData = function () {
            var telemetryApi = this.openmct.telemetry;
            var compositionApi = this.openmct.composition;
            var scope = this.$scope;
            var newObject = this.newObject;

            this.telemetry.clear();
            this.telemetry.bounds(this.openmct.conductor.bounds());

            this.$scope.loading = true;

            function error(e) {
                scope.loading = false;
                console.error(e.stack);
            }

            function filterForTelemetry(objects) {
                return objects.filter(telemetryApi.canProvideTelemetry.bind(telemetryApi));
            }

            function getDomainObjects() {
                var objects = [newObject];
                var composition = compositionApi.get(newObject);

                if (composition) {
                    return composition
                        .load()
                        .then(function (children) {
                            return objects.concat(children);
                        });
                } else {
                    return Promise.resolve(objects);
                }
            }

            scope.headers = [];
            scope.rows = [];

            return getDomainObjects()
                .then(filterForTelemetry)
                .then(this.loadColumns)
                .then(this.subscribeToNewData)
                .then(this.getHistoricalData)
                .catch(error);
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
