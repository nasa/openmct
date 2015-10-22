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

/**
 * Module defining TelemetryCapability. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        var ZERO = function () { return 0; },
            EMPTY_SERIES = {
                getPointCount: ZERO,
                getDomainValue: ZERO,
                getRangeValue: ZERO
            };

        /**
         * Provides metadata about telemetry associated with a
         * given domain object.
         *
         * @typedef TelemetryMetadata
         * @property {string} source the machine-readable identifier for
         *           the source of telemetry data for this object; used by
         *           {@link TelemetryService} implementations to determine
         *           whether or not they provide data for this object.
         * @property {string} key the machine-readable identifier for
         *           telemetry data associated with this specific object,
         *           within that `source`.
         * @property {TelemetryDomainMetadata[]} domains supported domain
         *           options for telemetry data associated with this object,
         *           to use in interpreting a {@link TelemetrySeries}
         * @property {TelemetryRangeMetadata[]} ranges supported range
         *           options for telemetry data associated with this object,
         *           to use in interpreting a {@link TelemetrySeries}
         */

        /**
         * Provides metadata about range options within a telemetry series.
         * Range options describe distinct properties within any given datum
         * of a telemetry series; for instance, a telemetry series containing
         * both raw and uncalibrated values may provide separate ranges for
         * each.
         *
         * @typedef TelemetryRangeMetadata
         * @property {string} key machine-readable identifier for this range
         * @property {string} name human-readable name for this range
         * @property {string} [units] human-readable units for this range
         * @property {string} [format] data format for this range; usually,
         *                    one of `number`, or `string`. If `undefined`,
         *                    should presume to be a `number`. Custom formats
         *                    may be indicated here.
         */

        /**
         * Provides metadata about domain options within a telemetry series.
         * Domain options describe distinct properties within any given datum
         * of a telemtry series; for instance, a telemetry series containing
         * both spacecraft event time and earth received times may provide
         * separate domains for each.
         *
         * Domains are typically used to represent timestamps in a telemetry
         * series, but more generally may express any property which will
         * have unique values for each datum in a series. It is this property
         * which makes domains distinct from ranges, as it makes these values
         * appropriate and meaningful for use to sort and bound a series.
         *
         * @typedef TelemetryDomainMetadata
         * @property {string} key machine-readable identifier for this range
         * @property {string} name human-readable name for this range
         * @property {string} [system] machine-readable identifier for the
         *                    time/date system associated with this domain;
         *                    used by {@link DateService}
         */

        /**
         * A telemetry capability provides a means of requesting telemetry
         * for a specific object, and for unwrapping the response (to get
         * at the specific data which is appropriate to the domain object.)
         *
         * @memberof platform/telemetry
         * @implements {Capability}
         * @constructor
         */
        function TelemetryCapability($injector, $q, $log, domainObject) {
            // We could depend on telemetryService directly, but
            // there isn't a platform implementation of this.
            this.initializeTelemetryService = function () {
                try {
                    return (this.telemetryService =
                        $injector.get("telemetryService"));
                } catch (e) {
                    // $injector should throw if telemetryService
                    // is unavailable or unsatisfiable.
                    $log.warn("Telemetry service unavailable");
                    return (this.telemetryService = null);
                }
            };


            this.$q = $q;
            this.$log = $log;
            this.domainObject = domainObject;
        }

        // Build a request object. This takes the request that was
        // passed to the capability, and adds source, id, and key
        // fields associated with the object (from its type definition
        // and/or its model)
        TelemetryCapability.prototype.buildRequest = function (request) {
            // Start with any "telemetry" field in type; use that as a
            // basis for the request.
            var domainObject = this.domainObject,
                type = domainObject.getCapability("type"),
                typeRequest = (type && type.getDefinition().telemetry) || {},
                modelTelemetry = domainObject.getModel().telemetry,
                fullRequest = Object.create(typeRequest);

            // Add properties from the telemetry field of this
            // specific domain object.
            Object.keys(modelTelemetry).forEach(function (k) {
                fullRequest[k] = modelTelemetry[k];
            });

            // Add properties from this specific requestData call.
            Object.keys(request).forEach(function (k) {
                fullRequest[k] = request[k];
            });

            // Ensure an ID and key are present
            if (!fullRequest.id) {
                fullRequest.id = domainObject.getId();
            }
            if (!fullRequest.key) {
                fullRequest.key = domainObject.getId();
            }

            return fullRequest;
        };


        /**
         * Request telemetry data for this specific domain object.
         * @param {TelemetryRequest} [request] parameters for this
         *        specific request
         * @returns {Promise} a promise for the resulting telemetry
         *          object
         */
        TelemetryCapability.prototype.requestData = function requestTelemetry(request) {
            // Bring in any defaults from the object model
            var fullRequest = this.buildRequest(request || {}),
                source = fullRequest.source,
                key = fullRequest.key,
                telemetryService = this.telemetryService ||
                    this.initializeTelemetryService(); // Lazy initialization

            // Pull out the relevant field from the larger,
            // structured response.
            function getRelevantResponse(response) {
                return ((response || {})[source] || {})[key] ||
                    EMPTY_SERIES;
            }

            // Issue a request to the service
            function requestTelemetryFromService() {
                return telemetryService.requestTelemetry([fullRequest]);
            }

            // If a telemetryService is not available,
            // getTelemetryService() should reject, and this should
            // bubble through subsequent then calls.
            return telemetryService &&
                requestTelemetryFromService().then(getRelevantResponse);
        };

        /**
         * Get metadata about this domain object's associated
         * telemetry.
         * @returns {TelemetryMetadata} metadata about this object's telemetry
         */
        TelemetryCapability.prototype.getMetadata = function () {
            // metadata just looks like a request,
            // so use buildRequest to bring in both
            // type-level and object-level telemetry
            // properties
            return (this.metadata = this.metadata || this.buildRequest({}));
        };

        /**
         * Subscribe to updates to telemetry data for this domain
         * object.
         * @param {Function} callback a function to call when new
         *        data becomes available; the telemetry series
         *        containing the data will be given as an argument.
         * @param {TelemetryRequest} [request] parameters for the
         *        subscription request
         */
        TelemetryCapability.prototype.subscribe = function subscribe(callback, request) {
            var fullRequest = this.buildRequest(request || {}),
                telemetryService = this.telemetryService ||
                    this.initializeTelemetryService(); // Lazy initialization

            // Unpack the relevant telemetry series
            function update(telemetries) {
                var source = fullRequest.source,
                    key = fullRequest.key,
                    result = ((telemetries || {})[source] || {})[key];
                if (result) {
                    callback(result);
                }
            }

            return telemetryService &&
                telemetryService.subscribe(update, [fullRequest]);
        };

        /**
         * The telemetry capability is applicable when a
         * domain object model has a "telemetry" field.
         */
        TelemetryCapability.appliesTo = function (model) {
            return (model && model.telemetry) ? true : false;
        };

        return TelemetryCapability;
    }
);

