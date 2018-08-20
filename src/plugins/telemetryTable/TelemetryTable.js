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
    './TelemetryTableColumn',
    './collections/BoundedTableRowCollection',
    './collections/FilteredTableRowCollection',
    './TelemetryTableRow'
], function (
    EventEmitter,
    _,
    TelemetryTableColumn,
    BoundedTableRowCollection,
    FilteredTableRowCollection,
    TelemetryTableRow
) {
    class TelemetryTable extends EventEmitter {
        constructor(domainObject, rowCount, openmct) {
            super();

            this.domainObject = domainObject;
            this.openmct = openmct;
            this.columns = {};
            this.rowCount = rowCount;
            this.subscriptions = {};

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
            let composition = this.openmct.composition.get(this.domainObject);
            composition.load().then((composition) => {
                composition.forEach(this.addTelemetryObject, this);
            });
            composition.on('add', this.addTelemetryObject);
            composition.on('remove', this.removeTelemetryObject);
        }
        
        addTelemetryObject(telemetryObject) {
            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();
            let objectKeyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            this.columns[objectKeyString] = [];

            metadataValues.forEach(metadatum => {
                this.columns[objectKeyString].push(new TelemetryTableColumn(this.openmct, telemetryObject, metadatum));
            });
            this.emit('object-added');
            
            this.requestDataFor(telemetryObject);
            //this.subscribeTo(telemetryObject);
        }

        requestDataFor(telemetryObject) {
            this.emit('loading-historical-data', true);
            this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                    let columnMap = this.getColumnMapForObject(keyString);

                    let telemetryRows = telemetryData.map(datum => new TelemetryTableRow(datum, columnMap, keyString));
                    this.boundedRows.add(telemetryRows);
                    console.log('loaded ' + telemetryRows.length + ' rows');
                    this.emit('loading-historical-data', false);
                });
        }

        getColumnMapForObject(objectKeyString) {
            return this.columns[objectKeyString].reduce((map, column) => {
                map[column.getKey()] = column;
                return map;
            }, {});
        }

        subscribeTo(telemetryObject) {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let columnMap = this.getColumnMapForObject(keyString);

            this.subscriptions[keyString] = this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                this.boundedRows.add(new TelemetryTableRow(datum, columnMap, keyString));
            });
        }

        removeTelemetryObject(objectIdentifier) {
            let keyString = this.openmct.objects.makeKeyString(objectIdentifier);
            delete this.columns[keyString];
            this.boundedRows.removeAllRowsForObject(keyString);
            this.unsubscribe(keyString);
            this.emit('object-removed');
        }

        unsubscribe(keyString) {
            this.subscriptions[keyString]();
            delete this.subscriptions[keyString];
        }

        headers() {
            let flattenedColumns = _.flatten(Object.values(this.columns));
            let headers = _.uniq(flattenedColumns, false, column => column.getKey())
                .reduce(fromColumnsToHeadersMap, {});

            function fromColumnsToHeadersMap(headersMap, column){
                headersMap[column.getKey()] = column.getTitle();
                return headersMap;
            }

            return headers;
        }
        
        buildColumns() {
            let allMetadata = this.composition.map(object => telemetryApi.getMetadata());
            let allValueMetadata = _.flatten(allMetadata.map(
                function getMetadataValues(metadata) {
                    return metadata.values();
                }
            ));
            let headers = allValueMetadata.map(metadatum => {
                return {
                    key: metadatum.key,
                    title: metadatum.name
                };
            });
            this.emit('updateHeaders', headers);
        }

        destroy() {
            this.boundedRows.destroy();
            this.filteredRows.destroy();
            Object.keys(this.subscriptions).forEach(this.unsubscribe, this);
        }
    }

    return TelemetryTable;
});