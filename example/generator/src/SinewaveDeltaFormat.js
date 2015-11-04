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
/*global define,Promise*/

define(
    ['./SinewaveConstants', 'moment'],
    function (SinewaveConstants, moment) {
        "use strict";

        var START_TIME = SinewaveConstants.START_TIME,
            FORMAT_REGEX = /^-?\d+:\d+:\d+$/,
            SECOND = 1000,
            MINUTE = SECOND * 60,
            HOUR = MINUTE * 60;

        function SinewaveDeltaFormat() {
        }

        function twoDigit(v) {
            return v >= 10 ? String(v) : ('0' + v);
        }

        SinewaveDeltaFormat.prototype.format = function (value) {
            var delta = Math.abs(value - START_TIME),
                negative = value < START_TIME,
                seconds = Math.floor(delta / SECOND) % 60,
                minutes = Math.floor(delta / MINUTE) % 60,
                hours = Math.floor(delta / HOUR);
            return (negative ? "-" : "") +
                [ hours, minutes, seconds ].map(twoDigit).join(":");
        };

        SinewaveDeltaFormat.prototype.validate = function (text) {
            return FORMAT_REGEX.test(text);
        };

        SinewaveDeltaFormat.prototype.parse = function (text) {
            var negative = text[0] === "-",
                parts = text.replace("-", "").split(":");
            return [ HOUR, MINUTE, SECOND ].map(function (sz, i) {
                return parseInt(parts[i], 10) * sz;
            }).reduce(function (a, b) {
                return a + b;
            }, 0) * (negative ? -1 : 1) + START_TIME;
        };

        return SinewaveDeltaFormat;
    }
);
