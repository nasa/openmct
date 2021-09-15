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

// extend telemetryTableRow
// it should take care of rows with empty values
// import it in LADTableRowCollection
// refer to emptyChannelListRow.js
import TelemetryTableRow from '../telemetryTable/TelemetryTableRow.js';

export default class LADRow extends TelemetryTableRow {
    constructor(columns, objectKeyString) {
        super({}, columns, objectKeyString);
        this.isDummyRow = true;
        this.columns = columns;
        this.objectKeyString = objectKeyString;
        this.datum = Object.keys(columns).reduce((datum, column) => {
            datum[column] = undefined;

            return datum;
        }, {});
    }

    getFormattedDatum(headers) {
        return Object.keys(headers).reduce((formattedDatum, columnKey) => {
            formattedDatum[columnKey] = this.getFormattedValue(columnKey);

            return formattedDatum;
        }, {});
    }

    // populate value if empty
    getFormattedValue(key) {
        if (key === 'vista-lad-name') {
            let column = this.columns[key];

            return column && column.getFormattedValue();
        } else if (this.columns[key] === undefined) {
            return '';
        } else {
            return this.datum[key] || '--';
        }
    }

    getRowClass() {
    }

    getCellLimitClasses() {
        return {};
    }

}
