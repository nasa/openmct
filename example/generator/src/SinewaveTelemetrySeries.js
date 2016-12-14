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
/*global define,Promise*/

/**
 * Module defining SinewaveTelemetry. Created by vwoeltje on 11/12/14.
 */
define([

], function (

) {
        "use strict";

        function SinewaveTelemetrySeries(data) {
            if (!Array.isArray(data)) {
                data = [data];
            }
            this.data = data;
        }

        SinewaveTelemetrySeries.prototype.getPointCount = function () {
            return this.data.length;
        };


        SinewaveTelemetrySeries.prototype.getDomainValue = function (
            index,
            domain
        ) {
            domain = domain || 'time';

            return this.getDatum(index)[domain];
        };

        SinewaveTelemetrySeries.prototype.getRangeValue = function (
            index,
            range
        ) {
            range = range || 'sin';
            return this.getDatum(index)[range];
        };

        SinewaveTelemetrySeries.prototype.getDatum = function (index) {
            if (index > this.data.length || index < 0) {
                throw new Error('IndexOutOfRange: index not available in series.');
            }
            return this.data[index];
        };

        SinewaveTelemetrySeries.prototype.getData = function () {
            return this.data;
        };

        return SinewaveTelemetrySeries;
});
