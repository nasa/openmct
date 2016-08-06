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
], function (
    moment
) {

    var DATE_FORMAT = "HH:mm:ss",
        DATE_FORMATS = [
            DATE_FORMAT
        ];


    /**
     * Formatter for duration. Uses moment to produce a date from a given
     * value, but output is formatted to display only time. Can be used for
     * specifying a time duration. For specifying duration, it's best to
     * specify a date of January 1, 1970, as the ms offset will equal the
     * duration represented by the time.
     *
     * @implements {Format}
     * @constructor
     * @memberof platform/commonUI/formats
     */
    function DurationFormat() {
    }

    DurationFormat.prototype.format = function (value) {
        return moment.utc(value).format(DATE_FORMAT);
    };

    DurationFormat.prototype.parse = function (text) {
        return moment.duration(text).asMilliseconds();
    };

    DurationFormat.prototype.validate = function (text) {
        return moment.utc(text, DATE_FORMATS).isValid();
    };

    return DurationFormat;
});
