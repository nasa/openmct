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
         * @constructor
         */
        function TelemetryTableController(
            $scope,
            openmct
        ) {
            var self = this;

            this.$scope = $scope;
            this.columns = {}; //Range and Domain columns
            this.handle = undefined;
            this.table = new TableConfiguration($scope.domainObject,
                openmct);
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
            this.mutationListener = openmct.objects.observe(this.newObject, "*", function (domainObject){
                self.newObject = domainObject;
            });

            this.destroy = this.destroy.bind(this);

            // Unsubscribe when the plot is destroyed
            this.$scope.$on("$destroy", this.destroy);
            this.timeColumns = [];


            this.sortByTimeSystem = this.sortByTimeSystem.bind(this);
            this.conductor.on('timeSystem', this.sortByTimeSystem);
            this.conductor.off('timeSystem', this.sortByTimeSystem);

            this.subscriptions = [];
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
            this.subscriptions.forEach(function (subscription) {
                subscription()
            });
            this.mutationListener();
        };


        /**
         Create a new subscription. This can be overridden by children to
         change default behaviour (which is to retrieve historical telemetry
         only).
         */
        TelemetryTableController.prototype.subscribe = function () {
            var self = this;
            var telemetryApi = this.openmct.telemetry;
            var compositionApi = this.openmct.composition;
            var subscriptions = this.subscriptions;
            var tableConfiguration = this.table;
            var scope = this.$scope;
            var maxRows = 100000;
            var conductor = this.conductor;
            var newObject = this.newObject;

            this.$scope.loading = true;

            function makeTableRows(object, historicalData){
                var limitEvaluator = telemetryApi.limitEvaluator(object);
                return historicalData.map(tableConfiguration.getRowValues.bind(tableConfiguration, limitEvaluator));
            }

            function requestData(objects) {
                var bounds = conductor.bounds();

                return Promise.all(
                    objects.map(function (object) {
                        return telemetryApi.request(object, {
                            start: bounds.start,
                            end: bounds.end
                        }).then(
                            makeTableRows.bind(this, object)
                        );
                    })
                );
            }

            function addHistoricalData(historicalData){
                scope.rows = Array.prototype.concat.apply([], historicalData);
                scope.loading = false;
            }

            function newData(domainObject, datum) {
                scope.rows.push(tableConfiguration.getRowValues(datum, telemetryApi.limitEvaluator(domainObject)));

                //Inform table that a new row has been added
                if (scope.rows.length > maxRows) {
                    scope.$broadcast('remove:row', 0);
                    scope.rows.shift();
                }

                scope.$broadcast('add:row',
                    scope.rows.length - 1);

            }

            function subscribe(objects) {
                objects.forEach(function (object){
                    subscriptions.push(telemetryApi.subscribe(object, newData.bind(this, object), {}));
                });
                return objects;
            }

            function error(e) {
                throw e;
            }

            function loadColumns(objects) {
                var metadatas = objects.map(telemetryApi.getMetadata.bind(telemetryApi));
                var allColumns = telemetryApi.commonValuesForHints(metadatas, []);

                tableConfiguration.populateColumns(allColumns);

                this.timeColumns = telemetryApi.commonValuesForHints(metadatas, ['x']).map(function (metadatum){
                    return metadatum.name;
                });

                self.filterColumns();

                return Promise.resolve(objects);
            }

            function filterForTelemetry(objects){
                return objects.filter(telemetryApi.canProvideTelemetry.bind(telemetryApi));
            }

            function getDomainObjects() {
                return new Promise(function (resolve, reject){
                    var objects = [newObject];
                    var composition = compositionApi.get(newObject);

                    if (composition) {
                        composition
                            .load()
                            .then(function (children) {
                                return objects.concat(children);
                            })
                            .then(resolve)
                            .catch(reject);
                    } else {
                        return resolve(objects);
                    }
                });
            }

            scope.headers = [];
            scope.rows = [];

            getDomainObjects()
                .then(filterForTelemetry)
                .catch(error)
                .then(function (objects){
                    if (objects.length > 0){
                        return loadColumns(objects)
                            .then(subscribe)
                            .then(requestData)
                            .then(addHistoricalData)
                            .catch(error);
                    } else {
                        scope.loading = false;
                    }
                })
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
