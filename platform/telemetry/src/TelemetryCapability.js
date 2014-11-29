/*global define*/

/**
 * Module defining TelemetryCapability. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function TelemetryCapability($injector, $q, $log, domainObject) {
            var telemetryService;

            // We could depend on telemetryService directly, but
            // there isn't a platform implementation of this;
            function getTelemetryService() {
                if (!telemetryService) {
                    try {
                        telemetryService =
                            $q.when($injector.get("telemetryService"));
                    } catch (e) {
                        $log.warn("Telemetry service unavailable");
                        telemetryService = $q.reject(e);
                    }
                }
                return telemetryService;
            }

            function buildRequest(request) {
                var type = domainObject.getCapability("type"),
                    typeRequest = (type && type.getDefinition().telemetry) || {},
                    modelTelemetry = domainObject.getModel().telemetry,
                    fullRequest = Object.create(typeRequest);

                Object.keys(modelTelemetry).forEach(function (k) {
                    fullRequest[k] = modelTelemetry[k];
                });

                Object.keys(request).forEach(function (k) {
                    fullRequest[k] = request[k];
                });

                // Include domain object ID, at minimum
                if (!fullRequest.id) {
                    fullRequest.id = domainObject.getId();
                }
                if (!fullRequest.key) {
                    fullRequest.key = domainObject.getId();
                }

                return fullRequest;
            }

            function requestTelemetry(request) {
                // Bring in any defaults from the object model
                var fullRequest = buildRequest(request || {}),
                    source = fullRequest.source,
                    key = fullRequest.key;

                function getRelevantResponse(response) {
                    return ((response || {})[source] || {})[key] || {};
                }

                function requestTelemetryFromService(telemetryService) {
                    return telemetryService.requestTelemetry([fullRequest]);
                }

                return getTelemetryService()
                        .then(requestTelemetryFromService)
                        .then(getRelevantResponse);
            }

            return {
                requestData: requestTelemetry,
                getMetadata: function () {
                    return buildRequest({});
                }
            };
        }

        TelemetryCapability.appliesTo = function (model) {
            return (model &&
                    model.telemetry &&
                    model.telemetry.source) ? true : false;
        };

        return TelemetryCapability;
    }
);