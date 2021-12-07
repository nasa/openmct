/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

import moment from 'moment';

/**
 * Formatter for UTC timestamps. Interprets numeric values as
 * milliseconds since the start of 1970.
 *
 * @implements {Format}
 * @constructor
 * @memberof platform/commonUI/formats
 */
export default class UTCTimeFormat {
    constructor() {
        this.key = 'utc';
        this.DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
        this.DATE_FORMATS = [
            this.DATE_FORMAT,
            this.DATE_FORMAT + 'Z',
            'YYYY-MM-DD HH:mm:ss',
            'YYYY-MM-DD HH:mm',
            'YYYY-MM-DD'
        ];
    }

    /**
     * @param {string} formatString
     * @returns the value of formatString if the value is a string type and exists in the DATE_FORMATS array; otherwise the DATE_FORMAT value.
     */
    validateFormatString(formatString) {
        return typeof formatString === 'string'
        && this.DATE_FORMATS.includes(formatString)
            ? formatString
            : this.DATE_FORMAT;
    }

    /**
     * @param {number} value The value to format.
     * @param {string} formatString The string format to format. Default "YYYY-MM-DD HH:mm:ss.SSS" + "Z"
     * @returns {string} the formatted date(s) according to the proper parameter of formatString or the default value of "YYYY-MM-DD HH:mm:ss.SSS" + "Z".
     * If multiple values were requested, then an array of
     * formatted values will be returned. Where a value could not be formatted, `undefined` will be returned at its position
     * in the array.
     */
    format(value, formatString) {
        if (value !== undefined) {
            const format = this.validateFormatString(formatString);
            const utc = moment.utc(value);

            return utc.format(format) + (formatString ? '' : 'Z');
        } else {
            return value;
        }
    }

    parse(text) {
        if (typeof text === 'number') {
            return text;
        }

        return moment.utc(text, this.DATE_FORMATS).valueOf();
    }

    validate(text) {
        return moment.utc(text, this.DATE_FORMATS, true).isValid();
    }
}
