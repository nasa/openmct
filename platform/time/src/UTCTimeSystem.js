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
/*global define*/

define([
    'moment'
], function (
    moment
) {
    "use strict";

    var DATE_FORMAT = "YYYY-MM-DD HH:mm:ss",
        DATE_FORMATS = [
            DATE_FORMAT,
            "YYYY-MM-DD HH:mm:ss",
            "YYYY-MM-DD HH:mm",
            "YYYY-MM-DD"
        ],
        SECOND = 1000,
        MINUTE = 60 * SECOND,
        HOUR = 60 * MINUTE,
        DAY = 24 * HOUR,
        WEEK = 7 * DAY,
        MONTH_APPROX = 30 * DAY,
        YEAR = 365 * DAY,
        INCREMENTS = [
            SECOND,
            MINUTE,
            HOUR,
            DAY,
            WEEK,
            MONTH_APPROX,
            YEAR
        ],
        DEFAULT_INCREMENT = 3;


    function UTCTimeSystem(now) {
        this.nowFn = now;
    }

    UTCTimeSystem.prototype.format = function (value) {
        return moment.utc(value).format(DATE_FORMAT);
    };

    UTCTimeSystem.prototype.parse = function (text) {
        return moment.utc(text, DATE_FORMATS).valueOf();
    };

    UTCTimeSystem.prototype.validate = function (text) {
        return moment.utc(text, DATE_FORMATS).isValid();
    };

    UTCTimeSystem.prototype.now = function () {
        return this.nowFn();
    };

    UTCTimeSystem.prototype.increment = function (scale) {
        var index = (scale || 0) + DEFAULT_INCREMENT;
        index = Math.max(index, 0);
        index = Math.min(index, INCREMENTS.length - 1);
        return INCREMENTS[index];
    };

    return UTCTimeSystem;
});
