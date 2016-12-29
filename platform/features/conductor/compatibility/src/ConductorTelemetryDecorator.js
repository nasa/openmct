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

define( () => {

        /**
         * Decorates the `telemetryService` such that requests are
         * mediated by the time conductor. This is a modified version of the
         * decorator used in the old TimeConductor that integrates with the
         * new TimeConductor API.
         *
         * @constructor
         * @memberof platform/features/conductor
         * @implements {TelemetryService}
         * @param {platform/features/conductor.TimeConductor} conductor
         *        the service which exposes the global time conductor
         * @param {TelemetryService} telemetryService the decorated service
         */
         const amendRequest = (request, bounds, timeSystem) => {
             request = request || {};
             request.start = bounds.start;
             request.end = bounds.end;
             request.domain = timeSystem.metadata.key;

             return request;
         }
         
        class ConductorTelemetryDecorator {
          constructor(openmct, telemetryService) {
            this.conductor = openmct.conductor;
            this.telemetryService = telemetryService;

            this.amendRequests = ConductorTelemetryDecorator.prototype.amendRequests.bind(this);
        }

        amendRequests(requests) {
            let bounds = this.conductor.bounds(),
                timeSystem = this.conductor.timeSystem();

            return (requests || []).map( (request) => {
                return amendRequest(request, bounds, timeSystem);
            });
        };

        requestTelemetry(requests) {
            return this.telemetryService
                .requestTelemetry(this.amendRequests(requests));
        };

        subscribe(callback, requests) {
            let unsubscribeFunc = this.telemetryService.subscribe(callback, this.amendRequests(requests)),
                conductor = this.conductor

            const amendRequests = () => {
                return this.amendRequests(requests);
            }

            conductor.on('bounds', amendRequests);
            return () => {
                unsubscribeFunc();
                conductor.off('bounds', amendRequests);
            };
        };
      }
        return ConductorTelemetryDecorator;
    }
);
