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
// it should take care of refular LAD rows
// import it in LADTableRowCollection
// refer to ChannelListTableRow.js
import TelemetryTableRow from '../telemetryTable/TelemetryTableRow.js';
import printj from 'printj';

export default class LADTableRow extends TelemetryTableRow {
    constructor(datum, columns, objectKeyString, limitEvaluator, rowFormatConfiguration) {
        super(datum, columns, objectKeyString, limitEvaluator);
        this.rowFormats = rowFormatConfiguration || {};
    }

    getFormattedValue(key) {
        if (this.rowFormats[key]) {
            return this.getCustomFormattedValue(this.datum[key], this.rowFormats[key]);
        } else {
            let column = this.columns[key];

            return column && column.getFormattedValue(this.datum[key]);
        }
    }

    getCustomFormattedValue(value, format) {
        return printj.sprintf(format, value);
    }

    updateRowConfiguration(rowFormatConfiguration) {
        this.rowFormats = rowFormatConfiguration || {};
    }
}
