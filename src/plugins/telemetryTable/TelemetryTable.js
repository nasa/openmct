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

define([
    'EventEmitter',
    'lodash',
    './collections/BoundedTableRowCollection',
    './collections/FilteredTableRowCollection',
    './TelemetryTableRow',
    './TelemetryTableConfiguration'
], function (
    EventEmitter,
    _,
    BoundedTableRowCollection,
    FilteredTableRowCollection,
    TelemetryTableRow,
    TelemetryTableConfiguration
) {
    class TelemetryTable extends EventEmitter {
        constructor(domainObject, rowCount, openmct) {
            super();

            this.domainObject = domainObject;
            this.openmct = openmct;
            this.columns = {};
            this.rowCount = rowCount;
            this.subscriptions = {};
            this.tableComposition = undefined;
            this.tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);

            this.addTelemetryObject = this.addTelemetryObject.bind(this);
            this.removeTelemetryObject = this.removeTelemetryObject.bind(this);

            this.createTableRowCollections();
            this.loadComposition();
        }

        createTableRowCollections() {
            this.boundedRows = new BoundedTableRowCollection(this.openmct);

            //By default, sort by current time system, ascending.
            this.filteredRows = new FilteredTableRowCollection(this.boundedRows);
            this.filteredRows.sortBy({
                key: this.openmct.time.timeSystem().key,
                direction: 'asc'
            });
        }

        loadComposition() {
            this.tableComposition = this.openmct.composition.get(this.domainObject);
            this.tableComposition.on('add', this.addTelemetryObject);
            this.tableComposition.on('remove', this.removeTelemetryObject);
            this.tableComposition.load();
        }

        addTelemetryObject(telemetryObject) {
            this.requestDataFor(telemetryObject);
            this.subscribeTo(telemetryObject);
            
            //TODO: Reconsider this event. It should probably be triggered by configuration object now.
            this.emit('object-added');
        }

        removeTelemetryObject(objectIdentifier) {
            let keyString = this.openmct.objects.makeKeyString(objectIdentifier);
            this.boundedRows.removeAllRowsForObject(keyString);
            this.unsubscribe(keyString);

            //TODO: Reconsider this event. It should probably be triggered by configuration object now.
            this.emit('object-removed');
        }

        requestDataFor(telemetryObject) {
            this.emit('loading-historical-data', true);
            this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                    let columnMap = this.getColumnMapForObject(keyString);
                    let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

                    let telemetryRows = telemetryData.map(datum => new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
                    this.boundedRows.add(telemetryRows);
                    console.log('loaded ' + telemetryRows.length + ' rows');
                    this.emit('loading-historical-data', false);
                });
        }

        getColumnMapForObject(objectKeyString) {
            let columns = this.tableConfiguration.columns();
            
            return columns[objectKeyString].reduce((map, column) => {
                map[column.getKey()] = column;
                return map;
            }, {});
        }

        subscribeTo(telemetryObject) {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let columnMap = this.getColumnMapForObject(keyString);
            let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

            this.subscriptions[keyString] = this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                this.boundedRows.add(new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
            });
        }

        unsubscribe(keyString) {
            this.subscriptions[keyString]();
            delete this.subscriptions[keyString];
        }

        destroy() {
            this.boundedRows.destroy();
            this.filteredRows.destroy();
            Object.keys(this.subscriptions).forEach(this.unsubscribe, this);
            
            this.tableComposition.off('add', this.addTelemetryObject);
            this.tableComposition.off('remove', this.removeTelemetryObject);
        }
    }

    return TelemetryTable;
});