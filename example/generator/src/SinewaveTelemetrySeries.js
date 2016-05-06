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

/**
 * Module defining SinewaveTelemetry. Created by vwoeltje on 11/12/14.
 */
define(
    ['./SinewaveConstants'],
    function (SinewaveConstants) {
        "use strict";

        var ONE_DAY = 60 * 60 * 24,
            firstObservedTime = Math.floor(SinewaveConstants.START_TIME / 1000);

        function SinewaveTelemetrySeries(data) {
            if (!Array.isArray(data)) {
                data = [data];
            }
            this.data = data;
        }

        SinewaveTelemetrySeries.prototype.getPointCount = function () {
            return this.data.length;
        };

        SinewaveTelemetrySeries.prototype.getDomainValue = function (i, domain) {
            return this.getDatum(i)[domain];
        };

        SinewaveTelemetrySeries.prototype.getRangeValue = function (i, range) {
            return this.getDatum(i)[range];
        };

        SinewaveTelemetrySeries.prototype.getDatum = function (i) {
            if (i >= this.data.length || i < 0) {
                throw new Error('IndexOutOfRange: index not available in series.');
            }
            return this.data[i];
        };

        SinewaveTelemetrySeries.prototype.getData = function () {
            return this.data;
        };

        return SinewaveTelemetrySeries;

    }
);
