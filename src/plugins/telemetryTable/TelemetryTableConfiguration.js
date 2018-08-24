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
    './TelemetryTableColumn',
], function (TelemetryTableColumn) {
    const DEFAULT_CONFIGURATION = {
        columns: {}
    };

    class TelemetryTableConfiguration{
        constructor(domainObject, openmct) {
            this.domainObject = domainObject;
            this.openmct = openmct;
            this.columns = {};
            this.configuration = domainObject.configuration || DEFAULT_CONFIGURATION;

            this.addTelemetryObject = this.addTelemetryObject.bind();
            this.removeTelemetryObject = this.removeTelemetryObject.bind();

            this.loadComposition()
                .then(() => this.emit('headers-changed', this.headers()));
        }

        loadConfiguration(composition) {
            composition.forEach(composee => this.addTelemetryObject(composee, false));
        }

        addTelemetryObject(telemetryObject, emitChangeEvent) {
            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();
            let objectKeyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            this.columns[objectKeyString] = [];

            metadataValues.forEach(metadatum => {
                let column = new TelemetryTableColumn(this.openmct, metadatum)
                this.columns[objectKeyString].push(column);
            });

            if (emitChangeEvent) {
                this.emit('headers-changed', this.headers());
            }
        }

        setConfiguration(configuration) {
            this.configuration = configuration;
            this.emit('headers-changed', this.headers());
        }

        removeTelemetryObject(objectIdentifier) {
            let objectKeyString = this.openmct.objects.makeKeyString(objectIdentifier);
            let columnsToRemove = this.columns[objectKeyString];
            let headersChanged = false;

            delete this.columns[objectKeyString];
            columnsToRemove.forEach((column) => {
                if (!this.hasColumnWithKey(column.key)) {
                    delete this.configuration.columns[column.key];
                    headersChanged = true;
                }
            });

            if (headersChanged) {
                this.emit('headers-changed', this.headers());
            }
        }

        hasColumnWithKey(columnKey) {
            return _.flatten(Object.values(this.columns))
                .findIndex(column => column.getKey() === columnKey) !== -1;
        }

        columns() {
            return this.columns;
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

        destroy() {

        }
    }

    return TelemetryTableConfiguration;
});