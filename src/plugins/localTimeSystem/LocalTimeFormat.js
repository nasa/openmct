/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    'moment'
], moment => {
    const DATE_FORMAT = "YYYY-MM-DD h:mm:ss.SSS a";

    const DATE_FORMATS = [
        DATE_FORMAT,
        "YYYY-MM-DD h:mm:ss a",
        "YYYY-MM-DD h:mm a",
        "YYYY-MM-DD"
    ];

    /**
     * @typedef Scale
     * @property {number} min the minimum scale value, in ms
     * @property {number} max the maximum scale value, in ms
     */

    /**
     * Formatter for UTC timestamps. Interprets numeric values as
     * milliseconds since the start of 1970.
     *
     * @implements {Format}
     * @constructor
     * @memberof platform/commonUI/formats
     */
    class LocalTimeFormat {
        /**
         *
         * @param value
         * @param {Scale} [scale] Optionally provides context to the
         * format request, allowing for scale-appropriate formatting.
         * @returns {string} the formatted date
         */
        format(value, scale) {
            if (scale !== undefined) {
                const scaledFormat = getScaledFormat(value, scale);
                if (scaledFormat) {
                    return moment.utc(value).format(scaledFormat);
                }
            }
            return moment(value).format(DATE_FORMAT);
        }

        parse(text) {
            return moment(text, DATE_FORMATS).valueOf();
        }

        validate(text) {
            return moment(text, DATE_FORMATS).isValid();
        }
    }

    /**
     * Returns an appropriate time format based on the provided value and
     * the threshold required.
     * @private
     */
    function getScaledFormat(d) {
        const momentified = moment.utc(d);
        /**
         * Uses logic from d3 Time-Scales, v3 of the API. See
         * https://github.com/d3/d3-3.x-api-reference/blob/master/Time-Scales.md
         *
         * Licensed
         */
        return [
            [".SSS", m => m.milliseconds()],
            [":ss", m => m.seconds()],
            ["hh:mma", m => m.minutes()],
            ["hha", m => m.hours()],
            ["ddd DD", m => m.days() &&
                m.date() !== 1],
            ["MMM DD", m => m.date() !== 1],
            ["MMMM", m => m.month()],
            ["YYYY", () => true]
        ].filter(row => row[1](momentified))[0][0];
    }

    return LocalTimeFormat;
});
