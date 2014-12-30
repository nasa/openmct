/*global define*/

/**
 * Module defining TelemetryCapability. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A telemetry capability provides a means of requesting telemetry
         * for a specific object, and for unwrapping the response (to get
         * at the specific data which is appropriate to the domain object.)
         *
         * @constructor
         */
        function TelemetryCapability($injector, $q, $log, domainObject) {
            var telemetryService,
                subscriptions = [],
                unsubscribeFunction;

            // We could depend on telemetryService directly, but
            // there isn't a platform implementation of this;
            function getTelemetryService() {
                if (telemetryService === undefined) {
                    try {
                        telemetryService =
                            $injector.get("telemetryService");
                    } catch (e) {
                        // $injector should throw if telemetryService
                        // is unavailable or unsatisfiable.
                        $log.warn("Telemetry service unavailable");
                        telemetryService = null;
                    }
                }
                return telemetryService;
            }

            // Build a request object. This takes the request that was
            // passed to the capability, and adds source, id, and key
            // fields associated with the object (from its type definition
            // and/or its model)
            function buildRequest(request) {
                // Start with any "telemetry" field in type; use that as a
                // basis for the request.
                var type = domainObject.getCapability("type"),
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
            }

            // Issue a request for telemetry data
            function requestTelemetry(request) {
                // Bring in any defaults from the object model
                var fullRequest = buildRequest(request || {}),
                    source = fullRequest.source,
                    key = fullRequest.key;

                // Pull out the relevant field from the larger,
                // structured response.
                function getRelevantResponse(response) {
                    return ((response || {})[source] || {})[key] || {};
                }

                // Issue a request to the service
                function requestTelemetryFromService() {
                    return telemetryService.requestTelemetry([fullRequest]);
                }

                // If a telemetryService is not available,
                // getTelemetryService() should reject, and this should
                // bubble through subsequent then calls.
                return getTelemetryService() &&
                        requestTelemetryFromService()
                            .then(getRelevantResponse);
            }

            // Listen for real-time and/or streaming updates
            function subscribe(callback, request) {
                var fullRequest = buildRequest(request || {});

                // Unpack the relevant telemetry series
                function update(telemetries) {
                    var source = fullRequest.source,
                        key = fullRequest.key,
                        result = ((telemetries || {})[source] || {})[key];
                    if (result) {
                        callback(result);
                    }
                }

                return getTelemetryService() &&
                        telemetryService.subscribe(update, [fullRequest]);
            }

            return {
                /**
                 * Request telemetry data for this specific domain object.
                 * @param {TelemetryRequest} [request] parameters for this
                 *        specific request
                 * @returns {Promise} a promise for the resulting telemetry
                 *          object
                 */
                requestData: requestTelemetry,

                /**
                 * Get metadata about this domain object's associated
                 * telemetry.
                 */
                getMetadata: function () {
                    // metadata just looks like a request,
                    // so use buildRequest to bring in both
                    // type-level and object-level telemetry
                    // properties
                    return buildRequest({});
                },

                /**
                 * Subscribe to updates to telemetry data for this domain
                 * object.
                 * @param {Function} callback a function to call when new
                 *        data becomes available; the telemetry series
                 *        containing the data will be given as an argument.
                 * @param {TelemetryRequest} [request] parameters for the
                 *        subscription request
                 */
                subscribe: subscribe
            };
        }

        /**
         * The telemetry capability is applicable when a
         * domain object model has a "telemetry" field.
         */
        TelemetryCapability.appliesTo = function (model) {
            return (model &&
                    model.telemetry) ? true : false;
        };

        return TelemetryCapability;
    }
);