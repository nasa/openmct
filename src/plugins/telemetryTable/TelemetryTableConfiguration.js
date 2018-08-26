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
    './TelemetryTableColumn',
], function (EventEmitter, TelemetryTableColumn) {

    class TelemetryTableConfiguration extends EventEmitter{
        constructor(domainObject, openmct) {
            super();

            this.domainObject = domainObject;
            this.openmct = openmct;
            this.columns = {};

            this.addColumnsForObject = this.addColumnsForObject.bind(this);
            this.removeColumnsForObject = this.removeColumnsForObject.bind(this);
        }

        addColumnsForAllObjects(objects) {
            objects.forEach(composee => this.addColumnsForObject(composee, false));
            this.emit('headers-changed', this.getHeaders());
        }

        addColumnsForObject(telemetryObject, emitChangeEvent) {
            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();
            let objectKeyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            this.columns[objectKeyString] = [];

            metadataValues.forEach(metadatum => {
                let column = new TelemetryTableColumn(this.openmct, metadatum);
                this.columns[objectKeyString].push(column);
            });

            if (emitChangeEvent) {
                this.emit('headers-changed', this.getHeaders());
            }
        }

        removeColumnsForObject(objectIdentifier) {
            let objectKeyString = this.openmct.objects.makeKeyString(objectIdentifier);
            let columnsToRemove = this.columns[objectKeyString];
            let headersChanged = false;

            delete this.columns[objectKeyString];
            columnsToRemove.forEach((column) => {
                //There may be more than one column with the same key (eg. time system columns)
                if (!this.hasColumnWithKey(column.key)) {
                    // If there are no more columns with this key, delete any configuration, and trigger
                    // a column refresh.
                    delete this.domainObject.configuration.table.columns[column.getKey()];
                    headersChanged = true;
                }
            });

            if (headersChanged) {
                this.emit('headers-changed', this.getHeaders());
            }
        }

        hasColumnWithKey(columnKey) {
            return _.flatten(Object.values(this.columns))
                .findIndex(column => column.getKey() === columnKey) !== -1;
        }

        getColumns() {
            return this.columns;
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
    }

    return TelemetryTableConfiguration;
});