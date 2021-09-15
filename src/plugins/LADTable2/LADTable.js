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
// import TelemetryTableRow from '../telemetryTable/TelemetryTableRow.js';
import LADRow from './LADRow.js';
import LADTableRowCollection from './LADTableRowCollection.js';

export default class LADTable extends TelemetryTable {
    constructor(domainObject, openmct) {
        super(domainObject, openmct);
        this.domainObject = domainObject;
        this.openmct = openmct;
        // need change: replace LADTableRowCollection
        this.tableRows = new LADTableRowCollection();
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
        // this.addaddDummyRowForObject(telemetryObject);
    }
    addDummyRowForObject(object) {
        let objectKeyString = this.openmct.objects.makeKeyString(object.identifier);
        let columns = this.getColumnMapForObject(objectKeyString);
        // need change: create dummy row with a new LADRow. this will take care of empty values
        // let dummyRow = new EmptyChannelListRow(columns, objectKeyString);
        // this.tableRows.add(dummyRow);
    }

    getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
        // this is where only latest telemetry is retrived
        // need change: replace TelemetryTableRow with LADRow
        return (telemetry) => {
            //Check that telemetry object has not been removed since telemetry was requested.
            if (!this.telemetryObjects[keyString]) {
                return;
            }

            // only add the latest telemetry
            let latest = telemetry[telemetry.length - 1];
            let telemetryRow = [new TelemetryTableRow(latest, columnMap, keyString, limitEvaluator)];
            if (this.paused) {
                this.delayedActions.push(this.tableRows.addRows.bind(this, telemetryRow, 'add'));
            } else {
                this.tableRows.addRows(telemetryRow, 'add');
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
        this.tableRows = new LADTableRowCollection();

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
