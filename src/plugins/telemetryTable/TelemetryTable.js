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
    './TableColumn',
    './collections/BoundedTelemetryCollection',
    './collections/FilteredTelemetryCollection'
], function (
    EventEmitter,
    _,
    TableColumn,
    BoundedTelemetryCollection,
    FilteredTelemetryCollection
) {
    class TelemetryTable extends EventEmitter {
        constructor(domainObject, rowCount, openmct) {
            super();

            this.domainObject = domainObject;
            this.openmct = openmct;
            this.columns = {};
            this.rowCount = rowCount;

            this.createTelemetryCollections();
            this.loadComposition();
        }

        createTelemetryCollections() {
            this.boundedTelemetry = new BoundedTelemetryCollection(this.openmct);

            //By default, sort by current time system, ascending.
            this.filteredTelemetry = new FilteredTelemetryCollection();
            this.filteredTelemetry.sortBy({
                key: this.openmct.time.timeSystem().key,
                direction: 'asc'
            });

            this.boundedTelemetry.on('added', this.filteredTelemetry.add, this.filteredTelemetry);
            this.boundedTelemetry.on('removed', this.filteredTelemetry.remove, this.filteredTelemetry);
        }

        loadComposition() {
            let composition = this.openmct.composition.get(this.domainObject);
            composition.load().then((composition) => {
                composition.forEach(this.addTelemetryObject, this);
            });
            composition.on('add', this.addTelemetryObject, this);
            composition.on('remove', this.removeTelemetryObject, this);
        }
        
        addTelemetryObject(telemetryObject) {
            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();
            metadataValues.forEach(metadatum => {
                let objectKeyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                this.columns[objectKeyString] = this.columns[objectKeyString] || [];
                this.columns[objectKeyString].push(new TableColumn(this.openmct, telemetryObject, metadatum));
            });
            this.emit('updateHeaders', Object.assign({}, this.getHeaders()));
            
            this.requestDataFor(telemetryObject);
            this.subscribeTo(telemetryObject);
        }

        requestDataFor(telemetryObject) {
            this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    console.log('Processing ' + telemetryData.length + ' values');
                    console.time('processing');
                    let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                    let columns = this.columns[keyString];
                    let normalizedTelemetryData = telemetryData.map(telemetryDatum => this.sourcesToKeys(telemetryDatum, columns));
                    this.boundedTelemetry.add(normalizedTelemetryData);
                    //this.boundedTelemetry.add(telemetryData);
                    console.timeEnd('processing');
                });
        }

        /**
         * Normalize the structure of datums to assist sorting and merging of columns.
         * @param {*} telemetryDatum 
         * @param {*} metadataValues 
         */
        sourcesToKeys(telemetryDatum, columns) {
            return columns.reduce((normalizedDatum, column) => {
                normalizedDatum[column.getKey()] = column.getRawValue(telemetryDatum);
                return normalizedDatum;
            }, {});
        }

        subscribeTo(telemetryObject) {
        }

        calculateVisibleRows() {
            this.emit('updateVisibleRows');
        }

        removeTelemetryObject(objectIdentifier) {
            this.columns = this.columns.filter(column => column.isForObject(objectIdentifier));
            this.emit('updateHeaders', Object.assign({}, this.getHeaders()));
        }

        getHeaders() {
            let flattenedColumns = _.flatten(Object.values(this.columns));
            let headers = _.uniq(flattenedColumns, false, column => column.getKey())
                .reduce(fromColumnsToHeadersMap, {});

            function fromColumnsToHeadersMap(headersMap, column){
                headersMap[column.getKey()] = column.getTitle();
                return headersMap;
            }

            return headers;
        }

        sortByColumnKey(columnKey) {
            let sortOptions = this.filteredTelemetry.sortBy();
            let sortDirection = sortOptions.direction;

            // If sorting by the same colum, flip the sort direction.
            if (sortOptions.key === columnKey) {
                if (sortDirection === 'asc') {
                    sortDirection = 'desc';
                } else {
                    sortDirection = 'asc';
                }
            }

            this.filteredTelemetry.sortBy({
                key: columnKey,
                direction: sortDirection
            });

            this.calculateVisibleRows();
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

        subscribe() {}

        destroy() {
            this.boundedTelemetry.destroy();
        }
    }

    return TelemetryTable;
});