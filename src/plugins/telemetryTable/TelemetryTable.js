/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

define([
    'EventEmitter',
    'lodash',
    // './collections/BoundedTableRowCollection',
    './collections/SortedTableRowCollection',
    './collections/FilteredTableRowCollection',
    './TelemetryTableNameColumn',
    './TelemetryTableRow',
    './TelemetryTableColumn',
    './TelemetryTableUnitColumn',
    './TelemetryTableConfiguration'
], function (
    EventEmitter,
    _,
    // BoundedTableRowCollection,
    SortedTableRowCollection,
    FilteredTableRowCollection,
    TelemetryTableNameColumn,
    TelemetryTableRow,
    TelemetryTableColumn,
    TelemetryTableUnitColumn,
    TelemetryTableConfiguration
) {
    class TelemetryTable extends EventEmitter {
        constructor(domainObject, openmct) {
            super();

            this.domainObject = domainObject;
            this.openmct = openmct;
            this.rowCount = 100;
            // this.subscriptions = {};
            this.tableComposition = undefined;
            this.telemetryObjects = [];
            this.datumCache = [];
            this.removeDatumCache = [];
            this.outstandingRequests = 0;
            this.configuration = new TelemetryTableConfiguration(domainObject, openmct);
            this.paused = false;
            this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            this.telemetryCollections = {};

            this.addTelemetryObject = this.addTelemetryObject.bind(this);
            this.removeTelemetryObject = this.removeTelemetryObject.bind(this);
            this.isTelemetryObject = this.isTelemetryObject.bind(this);
            this.refreshData = this.refreshData.bind(this);
            // this.requestDataFor = this.requestDataFor.bind(this);
            this.requestTelemetryCollectionFor = this.requestTelemetryCollectionFor.bind(this);
            this.updateFilters = this.updateFilters.bind(this);
            this.buildOptionsFromConfiguration = this.buildOptionsFromConfiguration.bind(this);

            this.filterObserver = undefined;

            this.createTableRowCollections();

            openmct.time.on('bounds', this.refreshData);
            openmct.time.on('timeSystem', this.refreshData);
        }

        /**
         * @private
         */
        addNameColumn(telemetryObject, metadataValues) {
            let metadatum = metadataValues.find(m => m.key === 'name');
            if (!metadatum) {
                metadatum = {
                    format: 'string',
                    key: 'name',
                    name: 'Name'
                };
            }

            const column = new TelemetryTableNameColumn(this.openmct, telemetryObject, metadatum);

            this.configuration.addSingleColumnForObject(telemetryObject, column);
        }

        initialize() {
            if (this.domainObject.type === 'table') {
                this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
                this.loadComposition();
            } else {
                this.addTelemetryObject(this.domainObject);
            }
        }

        createTableRowCollections() {
            this.sortedRows = new SortedTableRowCollection(this.openmct);
            this.filteredRows = new FilteredTableRowCollection(this.sortedRows);

            //Fetch any persisted default sort
            let sortOptions = this.configuration.getConfiguration().sortOptions;

            //If no persisted sort order, default to sorting by time system, ascending.
            sortOptions = sortOptions || {
                key: this.openmct.time.timeSystem().key,
                direction: 'asc'
            };
            this.filteredRows.sortBy(sortOptions);
        }

        async loadComposition() {
            this.tableComposition = this.openmct.composition.get(this.domainObject);

            if (this.tableComposition !== undefined) {
                let composition = await this.tableComposition.load();

                composition = composition.filter(this.isTelemetryObject);
                composition.forEach(this.addTelemetryObject);

                this.tableComposition.on('add', this.addTelemetryObject);
                this.tableComposition.on('remove', this.removeTelemetryObject);
            }
        }

        addTelemetryObject(telemetryObject) {
            this.addColumnsForObject(telemetryObject, true);
            this.requestTelemetryCollectionFor(telemetryObject);
            // this.requestDataFor(telemetryObject);
            // this.subscribeTo(telemetryObject);
            this.telemetryObjects.push(telemetryObject);

            this.emit('object-added', telemetryObject);
        }

        updateFilters() {
            this.filteredRows.clear();
            this.sortedRows.clear();

            this.telemetryObjects.forEach(this.requestTelemetryCollectionFor.bind(this));

            // Object.keys(this.subscriptions).forEach(this.unsubscribe, this);

            // this.telemetryObjects.forEach(this.requestDataFor.bind(this));
            // this.telemetryObjects.forEach(this.subscribeTo.bind(this));
        }

        removeTelemetryObject(objectIdentifier) {
            this.configuration.removeColumnsForObject(objectIdentifier, true);
            let keyString = this.openmct.objects.makeKeyString(objectIdentifier);
            this.sortedRows.removeAllRowsForObject(keyString);
            this.resetTelemetryCollection(keyString);
            // this.unsubscribe(keyString);
            this.telemetryObjects = this.telemetryObjects.filter((object) => !_.eq(objectIdentifier, object.identifier));

            this.emit('object-removed', objectIdentifier);
        }

        requestTelemetryCollectionFor(telemetryObject) {
            this.incrementOutstandingRequests();

            let requestOptions = this.buildOptionsFromConfiguration(telemetryObject);
            const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            const telemetryProcessor = this.getTelemetryProcessor(telemetryObject, keyString);
            const telemetryRemover = this.getTelemetryRemover(keyString);

            this.resetTelemetryCollection(keyString, telemetryProcessor, telemetryRemover);

            this.telemetryCollections[keyString] = this.openmct.telemetry
                .requestTelemetryCollection(telemetryObject, requestOptions);

            this.telemetryCollections[keyString].on('remove', telemetryRemover, this);
            this.telemetryCollections[keyString].on('add', telemetryProcessor, this);
            this.telemetryCollections[keyString].load();

            this.decrementOutstandingRequests();
        }

        resetTelemetryCollection(keyString) {
            if (this.telemetryCollections[keyString]) {
                this.telemetryCollections[keyString].destroy();
                this.telemetryCollections[keyString] = undefined;
                delete this.telemetryCollections[keyString];
            }
        }

        getTelemetryProcessor(telemetryObject, keyString) {
            let columnMap = this.getColumnMapForObject(keyString);
            let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

            return (telemetry) => {
                //Check that telemetry object has not been removed since telemetry was requested.
                if (!this.telemetryObjects.includes(telemetryObject)) {
                    return;
                }

                // only cache realtime
                if (this.paused) {
                    let cacheData = {
                        telemetry,
                        columnMap,
                        keyString,
                        limitEvaluator
                    };

                    this.datumCache.push(cacheData);
                } else {
                    this.processTelemetryData(telemetry, columnMap, keyString, limitEvaluator);
                }
            };
        }

        getTelemetryRemover(keyString) {
            return (telemetry) => {
                // only cache realtime
                if (this.paused) {
                    let cacheData = {
                        telemetry,
                        keyString
                    };

                    this.removeDatumCache.push(cacheData);
                } else {
                    this.sortedRows.removeRowsFor(telemetry, keyString);
                }
            };
        }

        processTelemetryData(telemetryData, columnMap, keyString, limitEvaluator) {
            let timeKey = this.openmct.time.timeSystem().key;
            let telemetryRows = telemetryData.map(datum => new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator, timeKey));
            this.sortedRows.add(telemetryRows);
        }

        processDatumCache() {
            this.datumCache.forEach(cachedDatum => {
                this.processTelemetryData(cachedDatum.telemetry, cachedDatum.columnMap, cachedDatum.keyString, cachedDatum.limitEvaluator);
            });
            this.datumCache = [];

            this.removeDatumCache.forEach(cachedDatum => {
                this.sortedRows.removeRowsFor(cachedDatum.telemetry, cachedDatum.keyString);
            });
            this.removeDatumCache = [];
        }

        /**
         * @private
         */
        incrementOutstandingRequests() {
            if (this.outstandingRequests === 0) {
                this.emit('outstanding-requests', true);
            }

            this.outstandingRequests++;
        }

        /**
         * @private
         */
        decrementOutstandingRequests() {
            this.outstandingRequests--;

            if (this.outstandingRequests === 0) {
                this.emit('outstanding-requests', false);
            }
        }

        refreshData(bounds, isTick) {
            if (!isTick && this.outstandingRequests === 0) {
                this.filteredRows.clear();
                this.sortedRows.clear();
                this.sortedRows.sortByTimeSystem(this.openmct.time.timeSystem());
                this.telemetryObjects.forEach(this.requestTelemetryCollectionFor);
                // this.telemetryObjects.forEach(this.requestDataFor);
            }
        }

        clearData() {
            this.filteredRows.clear();
            this.sortedRows.clear();
            this.emit('refresh');
        }

        getColumnMapForObject(objectKeyString) {
            let columns = this.configuration.getColumns();

            return columns[objectKeyString].reduce((map, column) => {
                map[column.getKey()] = column;

                return map;
            }, {});
        }

        addColumnsForObject(telemetryObject) {
            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();

            this.addNameColumn(telemetryObject, metadataValues);
            metadataValues.forEach(metadatum => {
                if (metadatum.key === 'name') {
                    return;
                }

                let column = this.createColumn(metadatum);
                this.configuration.addSingleColumnForObject(telemetryObject, column);
                // add units column if available
                if (metadatum.unit !== undefined) {
                    let unitColumn = this.createUnitColumn(metadatum);
                    this.configuration.addSingleColumnForObject(telemetryObject, unitColumn);
                }
            });
        }

        createColumn(metadatum) {
            return new TelemetryTableColumn(this.openmct, metadatum);
        }

        createUnitColumn(metadatum) {
            return new TelemetryTableUnitColumn(this.openmct, metadatum);
        }

        // requestDataFor(telemetryObject) {
        //     this.incrementOutstandingRequests();
        //     let requestOptions = this.buildOptionsFromConfiguration(telemetryObject);

        //     return this.openmct.telemetry.request(telemetryObject, requestOptions)
        //         .then(telemetryData => {
        //             //Check that telemetry object has not been removed since telemetry was requested.
        //             if (!this.telemetryObjects.includes(telemetryObject)) {
        //                 return;
        //             }

        //             let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
        //             let columnMap = this.getColumnMapForObject(keyString);
        //             let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
        //             this.processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator);
        //         }).finally(() => {
        //             this.decrementOutstandingRequests();
        //         });
        // }

        // processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator) {
        //     let telemetryRows = telemetryData.map(datum => new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
        //     this.boundedRows.add(telemetryRows);
        // }

        // subscribeTo(telemetryObject) {
        //     let subscribeOptions = this.buildOptionsFromConfiguration(telemetryObject);
        //     let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
        //     let columnMap = this.getColumnMapForObject(keyString);
        //     let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

        //     this.subscriptions[keyString] = this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
        //         //Check that telemetry object has not been removed since telemetry was requested.
        //         if (!this.telemetryObjects.includes(telemetryObject)) {
        //             return;
        //         }

        //         if (this.paused) {
        //             let realtimeDatum = {
        //                 datum,
        //                 columnMap,
        //                 keyString,
        //                 limitEvaluator
        //             };

        //             this.datumCache.push(realtimeDatum);
        //         } else {
        //             this.processRealtimeDatum(datum, columnMap, keyString, limitEvaluator);
        //         }
        //     }, subscribeOptions);
        // }

        // processRealtimeDatum(datum, columnMap, keyString, limitEvaluator) {
        //     this.boundedRows.add(new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
        // }

        isTelemetryObject(domainObject) {
            return Object.prototype.hasOwnProperty.call(domainObject, 'telemetry');
        }

        buildOptionsFromConfiguration(telemetryObject) {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let filters = this.domainObject.configuration
                && this.domainObject.configuration.filters
                && this.domainObject.configuration.filters[keyString];

            return {filters} || {};
        }

        // unsubscribe(keyString) {
        //     this.subscriptions[keyString]();
        //     delete this.subscriptions[keyString];
        // }

        sortBy(sortOptions) {
            this.filteredRows.sortBy(sortOptions);

            if (this.openmct.editor.isEditing()) {
                let configuration = this.configuration.getConfiguration();
                configuration.sortOptions = sortOptions;
                this.configuration.updateConfiguration(configuration);
            }
        }

        pause() {
            this.paused = true;
            // this.boundedRows.unsubscribeFromBounds();
        }

        unpause() {
            this.paused = false;
            this.processDatumCache();
            // this.boundedRows.subscribeToBounds();
        }

        destroy() {
            // this.boundedRows.destroy();
            // Object.keys(this.subscriptions).forEach(this.unsubscribe, this);
            let keystrings = Object.keys(this.telemetryCollections);

            for (let keyString of keystrings) {
                this.telemetryCollections[keyString].destroy();
            }

            this.filteredRows.destroy();
            this.openmct.time.off('bounds', this.refreshData);
            this.openmct.time.off('timeSystem', this.refreshData);

            if (this.filterObserver) {
                this.filterObserver();
            }

            if (this.tableComposition !== undefined) {
                this.tableComposition.off('add', this.addTelemetryObject);
                this.tableComposition.off('remove', this.removeTelemetryObject);
            }
        }
    }

    return TelemetryTable;
});
