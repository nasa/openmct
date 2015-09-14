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
         * Decorates the `telemetryService` such that requests are
         * mediated by the time conductor.
         *
         * @constructor
         * @memberof platform/features/conductor
         * @implements {TelemetryService}
         * @param {platform/features/conductor.ConductorService} conductorServe
         *        the service which exposes the global time conductor
         * @param {TelemetryService} telemetryService the decorated service
         */
        function ConductorTelemetryDecorator(conductorService, telemetryService) {
            this.conductorService = conductorService;
            this.telemetryService = telemetryService;
        }

        // Strip out any realtime data series that is outside of the conductor's
        // bounds.
        ConductorTelemetryDecorator.prototype.stripRealtime = function (packaged) {
            var conductor = this.conductorService.getConductor(),
                start = conductor.displayStart(),
                end = conductor.displayEnd(),
                repackaged = {};

            function filterSource(packagedBySource) {
                var repackagedBySource = {};

                Object.keys(packagedBySource).filter(function (k) {
                    return packagedBySource[k].getPointCount() > 0 &&
                        packagedBySource[k].getDomainValue(0) <= end;
                }).forEach(function (k) {
                    repackagedBySource[k] = packagedBySource[k];
                });

                return repackagedBySource;
            }

            Object.keys(packaged).forEach(function (source) {
                repackaged[source] = filterSource(packaged[source]);
            });

            return repackaged;
        };

        ConductorTelemetryDecorator.prototype.amendRequests = function (requests) {
            var conductor = this.conductorService.getConductor(),
                start = conductor.displayStart(),
                end = conductor.displayEnd();

            function amendRequest(request) {
                request = request || {};
                request.start = start;
                request.end = end;
                return request;
            }

            return (requests || []).map(amendRequest);
        };

        ConductorTelemetryDecorator.prototype.requestTelemetry = function (requests) {
            return this.telemetryService
                .requestTelemetry(this.amendRequests(requests));
        };

        ConductorTelemetryDecorator.prototype.subscribe = function (callback, requests) {
            var self = this;

            function internalCallback(packagedSeries) {
                return callback(self.stripRealtime(packagedSeries));
            }

            return this.telemetryService
                .subscribe(internalCallback, this.amendRequests(requests));
        };

        return ConductorTelemetryDecorator;
    }
);
