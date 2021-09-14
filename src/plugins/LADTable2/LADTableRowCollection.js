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

import TableRowCollection from '../telemetryTable/collections/TableRowCollection.js';

export default class LADTableRowCollection extends TableRowCollection {
    // constructor() {
    //     super();
    //     // this.addRows = this.addRows.bind(this);
    // }
    addRows(rows, type = 'add') {
        if (this.sortOptions === undefined) {
            throw 'Please specify sort options';
        }

        let isFilterTriggeredReset = type === 'filter';
        let anyActiveFilters = Object.keys(this.columnFilters).length > 0;
        let rowsToAdd = !anyActiveFilters ? rows : rows.filter(this.matchesFilters, this);

        // if type is filter, then it's a reset of all rows,
        // need to wipe current rows
        if (isFilterTriggeredReset) {
            this.rows = [];
        }

        // remove old rows of the object before adding
        // there's only 1 row so keystring will be the same
        const keyString = rows[0].objectKeyString;
        this.removeRowsByObject(keyString);

        for (let row of rowsToAdd) {
            let index = this.sortedIndex(this.rows, row);
            this.rows.splice(index, 0, row);
        }

        // we emit filter no matter what to trigger
        // an update of visible rows
        if (rowsToAdd.length > 0 || isFilterTriggeredReset) {
            this.emit(type, rowsToAdd);
        }
    }
}
