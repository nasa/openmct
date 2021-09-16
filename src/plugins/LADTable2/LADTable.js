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

import TelemetryTable from '../telemetryTable/TelemetryTable.js';
import EmptyLADTableRow from './EmptyLADTableRow.js';
import LADTableRow from './LADTableRow.js';
import LADTableRowCollection from './LADTableRowCollection.js';

export default class LADTable extends TelemetryTable {
    constructor(domainObject, openmct) {
        super(domainObject, openmct);
        this.domainObject = domainObject;
        this.openmct = openmct;
        this.createTableRowCollections();
    }
    initialize() {
        if (this.domainObject.type === 'new.ladTable' || this.domainObject.type === 'new.LadTableSet') {
            // this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
            // this.filters = this.domainObject.configuration.filters;
            this.loadComposition();
        } else {
            this.addTelemetryObject(this.domainObject);
        }
    }
    addTelemetryObject(telemetryObject) {
        // addTelemetryObject is exactly the same as the parent's
        super.addTelemetryObject(telemetryObject);
        this.addDummyRowForObject(telemetryObject);
    }
    addDummyRowForObject(object) {
        let objectKeyString = this.openmct.objects.makeKeyString(object.identifier);
        let columns = this.getColumnMapForObject(objectKeyString);
        let dummyRow = new EmptyLADTableRow(columns, objectKeyString);
        this.tableRows.addOne(dummyRow);
    }
    
    // processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator) {
    //     let telemetryRows = telemetryData.map(datum => this.createRow(datum, columnMap, keyString, limitEvaluator));
    //     this.boundedRows.add(telemetryRows);
    // }
    // createRow(datum, columnMap, keyString, limitEvaluator) {
    //     let cellFormatConfiguration = this.configuration.getConfiguration().cellFormat || {};
    //     return new LADTableRow(datum, columnMap, keyString, limitEvaluator, cellFormatConfiguration[keyString]);
    // }
    
    getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
        return (telemetry) => {
            //Check that telemetry object has not been removed since telemetry was requested.
            if (!this.telemetryObjects[keyString]) {
                return;
            }

            // only add the latest telemetry
            let latest = telemetry[telemetry.length - 1];
            let telemetryRow = new LADTableRow(latest, columnMap, keyString, limitEvaluator);

            if (this.paused) {
                this.delayedActions.push(this.tableRows.addOne.bind(this, telemetryRow, 'add'));
            } else {
                this.tableRows.addOne(telemetryRow, 'add');
            }
        };
    }
    buildOptionsFromConfiguration(telemetryObject) {
        let LADOptions = {            
            strategy: 'latest',
            size: 1
        }
        let options = Object.assign(super.buildOptionsFromConfiguration(telemetryObject), LADOptions);
        return options;
    }
    createTableRowCollections() {
        // need change: can this part be refactored by using super?
        this.tableRows = new LADTableRowCollection(this.domainObject, this.openmct);

        //Fetch any persisted default sort
        let sortOptions = this.configuration.getConfiguration().sortOptions;

        //If no persisted sort order, default to sorting by time system, ascending.
        sortOptions = sortOptions || {
            key: this.openmct.time.timeSystem().key,
            direction: 'asc'
        };

        this.tableRows.sortBy(sortOptions);
        this.tableRows.on('resetRowsFromAllData', this.resetRowsFromAllData);
    }
}
