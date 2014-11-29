/*global define,Promise*/

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
        function TelemetryCapability(telemetryService, domainObject) {
            function buildRequest(request) {
                var type = domainObject.getCapability("type"),
                    typeRequest = type.getDefinition().telemetry || {},
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
                    return (response[source] || {})[key] || {};
                }

                return telemetryService.requestTelemetry([fullRequest])
                        .then(getRelevantResponse);
            }

            return {
                requestData: requestTelemetry,
                getMetadata: function () {
                    return buildRequest({});
                }
                //subscribe: subscribe
            };
        }

        TelemetryCapability.appliesTo = function (model) {
            return model.telemetry;
        }

        return TelemetryCapability;
    }
);