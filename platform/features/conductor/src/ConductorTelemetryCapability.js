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

define(
    [],
    function () {
        'use strict';

        /**
         * Wrapper for the `telemetry` capability which adds start/end
         * times to all requests based on the current state of a time
         * conductor.
         *
         * @constructor
         * @memberof platform/features/conductor
         * @augments {platform/telemetry.TelemetryCapability}
         * @param {platform/features/conductor.TimeConductor} timeConductor
         *        the time conductor which controls these queries
         * @param {platform/telemetry.TelemetryCapability} telemetryCapability
         *        the wrapped capability
         */
        function ConductorTelemetryCapability(timeConductor, telemetryCapability) {
            this.timeConductor = timeConductor;
            this.wrappedCapability = telemetryCapability;
        }

        ConductorTelemetryCapability.prototype.amendRequest = function (request) {
            request = request || {};

            // This isn't really the right check, but it happens to distinguish
            // plots (which want to query for the full set of data for easy
            // panning) from views like fixed position, which only want the
            // single latest data point.
            if (request.size !== undefined) {
                request.start = this.timeConductor.displayStart();
                request.end = this.timeConductor.displayEnd();
            } else {
                request.start = this.timeConductor.queryStart();
                request.end = this.timeConductor.queryEnd();
            }

            return request;
        };

        ConductorTelemetryCapability.prototype.getMetadata = function () {
            return this.wrappedCapability.getMetadata();
        };

        ConductorTelemetryCapability.prototype.requestData = function (request) {
            request = this.amendRequest(request);
            return this.wrappedCapability.requestData(request);
        };

        ConductorTelemetryCapability.prototype.subscribe = function (callback, request) {
            request = this.amendRequest(request);
            return this.wrappedCapability.subscribe(callback, request);
        };

        return ConductorTelemetryCapability;
    }
);
