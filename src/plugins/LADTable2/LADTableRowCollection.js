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
import EmptyLADTableRow from './EmptyLADTableRow.js';

export default class LADTableRowCollection extends TableRowCollection {
    constructor(openmct) {
        super(openmct);

        this.ladMap = new Map();
        this.timeColumn = openmct.time.timeSystem().key;
    }
    addOne(item) {
        if (item.isDummyRow) {
            this.ladMap.set(item.objectKeyString, this.rows.length);
            this.rows.push(item);
            this.emit('add', item);

            return true;
        }

        if (this.isNewerThanLAD(item)) {
            let rowIndex = this.ladMap.get(item.objectKeyString);
            let itemToReplace = this.rows[rowIndex];
            this.rows[rowIndex] = item;
            this.emit('remove', [itemToReplace]);
            this.emit('add', [item]);

            return true;
        }

        return false;
    }

    isNewerThanLAD(item) {
        let rowIndex = this.ladMap.get(item.objectKeyString);
        let latestRow = this.rows[rowIndex];
        let newerThanLatest = latestRow === undefined
        || item.datum[this.timeColumn] > latestRow.datum[this.timeColumn]
        || latestRow.isDummyRow;

        return !this.ladMap.has(item.objectKeyString) || newerThanLatest;
    }
    clear() {
        this.rows = this.rows.map(
            row => new EmptyLADTableRow(row.columns, row.objectKeyString)
        );
        this.rebuildLadMap();
    }

    rebuildLadMap() {
        this.ladMap.clear();
        this.rows.forEach((row, index) => {
            this.ladMap.set(row.objectKeyString, index);
        });
    }
}
