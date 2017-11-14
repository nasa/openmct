/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

define([], function () {

    function TelemetryAverager(telemetryAPI, domainObject, samples) {
        this.telemetryAPI = telemetryAPI;
        this.keyForDomain = 'utc';
        this.keyForRange = 'value';

        this.domainObject = domainObject;
        this.samples = samples;
        this.averagingWindow = [];
        this.domainFormatter = this.getFormatter(this.keyForDomain);
        this.rangeFormatter = this.getFormatter(this.keyForRange);
    }

    TelemetryAverager.prototype.createAverageDatum = function (telemetryDatum) {
        var timeValue = this.domainFormatter.parse(telemetryDatum);
        var rangeValue = this.rangeFormatter.parse(telemetryDatum);
        
        this.averagingWindow.push(rangeValue);
        if (this.averagingWindow.length > this.samples) {
            this.averagingWindow.shift();
        }

        var averageValue = this.calculateMean();
        var meanDatum = {
            'timestamp': timeValue,
            'value': averageValue
        };

        return meanDatum;
    };

    /**
     * @private
     */
    TelemetryAverager.prototype.calculateMean = function () {
        var sum = 0;
        var i = 0;

        for (; i < this.averagingWindow.length; i++) {
            sum += this.averagingWindow[i];
        }

        return sum / this.averagingWindow.length;
    };

    /**
     * @private
     */
    TelemetryAverager.prototype.getFormatter = function (key) {
        var objectMetadata = this.telemetryAPI.getMetadata(this.domainObject);
        var valueMetadata = objectMetadata.value(key);

        if (valueMetadata === undefined) {
            throw "Unsupported Telemetry object. Telemetry object has no metadata for attribute " + key + ".";
        }

        return this.telemetryAPI.getValueFormatter(valueMetadata);
    }

    TelemetryAverager.prototype.sampleCount = function () {
        return this.averagingWindow.length;
    }

    return TelemetryAverager;
});
