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
    'lodash',
    'EventEmitter',
    './TelemetryTableColumn',
], function (_, EventEmitter, TelemetryTableColumn) {

    class TelemetryTableConfiguration extends EventEmitter{
        constructor(domainObject, openmct) {
            super();

            this.domainObject = domainObject;
            this.openmct = openmct;
            this.columns = {};

            this.addColumnsForObject = this.addColumnsForObject.bind(this);
            this.removeColumnsForObject = this.removeColumnsForObject.bind(this);
            this.objectMutated = this.objectMutated.bind(this);

            this.unlistenFromMutation = openmct.objects.observe(domainObject, '*', this.objectMutated);
        }

        getConfiguration() {
            let configuration = this.domainObject.configuration || {};
            configuration.hiddenColumns = configuration.hiddenColumns || {};
            return configuration;
        }

        updateConfiguration(configuration) {
            this.openmct.objects.mutate(this.domainObject, 'configuration', configuration);
        }

        /**
         * @private
         * @param {*} object 
         */
        objectMutated(object) {
            let oldConfiguration = this.domainObject.configuration;

            //Synchronize domain object reference. Duplicate object otherwise change detection becomes impossible.
            this.domainObject = JSON.parse(JSON.stringify(object));
            if (!_.eq(object.configuration, oldConfiguration)){
                this.emit('change', object.configuration);
            }
        }

        addColumnsForAllObjects(objects) {
            objects.forEach(object => this.addColumnsForObject(object, false));
        }

        addColumnsForObject(telemetryObject) {
            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();
            let objectKeyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            this.columns[objectKeyString] = [];

            metadataValues.forEach(metadatum => {
                let column = new TelemetryTableColumn(this.openmct, metadatum);
                this.columns[objectKeyString].push(column);
            });
        }

        removeColumnsForObject(objectIdentifier) {
            let objectKeyString = this.openmct.objects.makeKeyString(objectIdentifier);
            let columnsToRemove = this.columns[objectKeyString];

            delete this.columns[objectKeyString];
            columnsToRemove.forEach((column) => {
                //There may be more than one column with the same key (eg. time system columns)
                if (!this.hasColumnWithKey(column.getKey())) {
                    let configuration = this.domainObject.configuration;
                    delete configuration.hiddenColumns[column.getKey()];
                    // If there are no more columns with this key, delete any configuration, and trigger
                    // a column refresh.
                    this.openmct.objects.mutate(this.domainObject, 'configuration', configuration);
                }
            });
        }

        hasColumnWithKey(columnKey) {
            return _.flatten(Object.values(this.columns))
                .findIndex(column => column.getKey() === columnKey) !== -1;
        }

        getColumns() {
            return this.columns;
        }

        getAllHeaders() {
            let flattenedColumns = _.flatten(Object.values(this.columns));
            let headers = _.uniq(flattenedColumns, false, column => column.getKey())
                .reduce(fromColumnsToHeadersMap, {});

            function fromColumnsToHeadersMap(headersMap, column){
                headersMap[column.getKey()] = column.getTitle();
                return headersMap;
            }

            return headers;
        }

        getVisibleHeaders() {
            let headers = this.getAllHeaders();
            let configuration = this.getConfiguration();

            Object.keys(headers).forEach((headerKey) => {
                if (configuration.hiddenColumns[headerKey] === true) {
                    delete headers[headerKey];
                }
            });

            return headers;
        }

        destroy() {
            this.unlistenFromMutation();
        }
    }

    return TelemetryTableConfiguration;
});