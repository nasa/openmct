/*global define*/

/**
 * Module defining TelemetryController. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Serves as a reusable controller for views (or parts of views)
         * which need to issue requests for telemetry data and use the
         * results
         *
         * @constructor
         */
        function TelemetryController($scope, $q, $timeout, $log) {

            var self = {
                ids: [],
                response: {},
                request: {},
                pending: 0,
                metadatas: [],
                interval: 1000,
                refreshing: false,
                broadcasting: false
            };


            function doBroadcast() {
                if (!self.broadcasting) {
                    self.broadcasting = true;
                    $timeout(function () {
                        self.broadcasting = false;
                        $scope.$broadcast("telemetryUpdate");
                    });
                }
            }

            function requestTelemetryForId(id, trackPending) {
                var responseObject = self.response[id],
                    domainObject = responseObject.domainObject,
                    telemetry = domainObject.getCapability('telemetry');

                function storeData(data) {
                    self.pending -= trackPending ? 1 : 0;
                    responseObject.data = data;
                    doBroadcast();
                }

                self.pending += trackPending ? 1 : 0;

                if (!telemetry) {
                    $log.warn([
                        "Expected telemetry capability for ",
                        id,
                        " but found none. Cannot request data."
                    ].join(""));
                    return;
                }

                return $q.when(telemetry.requestData(self.request))
                    .then(storeData);
            }

            function requestTelemetry(trackPending) {
                return $q.all(self.ids.map(function (id) {
                    return requestTelemetryForId(id, trackPending);
                }));
            }

            function promiseRelevantDomainObjects(domainObject) {
                if (!domainObject) {
                    return $q.when([]);
                }

                return $q.when(domainObject.useCapability(
                    "delegation",
                    "telemetry"
                )).then(function (result) {
                    var head = domainObject.hasCapability("telemetry") ?
                            [ domainObject ] : [],
                        tail = result || [];
                    return head.concat(tail);
                });
            }

            function buildResponseContainer(domainObject) {
                var telemetry = domainObject &&
                        domainObject.getCapability("telemetry"),
                    metadata;

                if (telemetry) {
                    metadata = telemetry.getMetadata();

                    self.response[domainObject.getId()] = {
                        name: domainObject.getModel().name,
                        domainObject: domainObject,
                        metadata: metadata,
                        pending: 0,
                        data: {}
                    };
                } else {
                    $log.warn([
                        "Expected telemetry capability for ",
                        domainObject.getId(),
                        " but none was found."
                    ].join(""));

                    self.response[domainObject.getId()] = {
                        name: domainObject.getModel().name,
                        domainObject: domainObject,
                        metadata: {},
                        pending: 0,
                        data: {}
                    };
                }
            }

            function buildResponseContainers(domainObjects) {
                domainObjects.forEach(buildResponseContainer);
                self.ids = domainObjects.map(function (obj) {
                    return obj.getId();
                });
                self.metadatas = self.ids.map(function (id) {
                    return self.response[id].metadata;
                });

                // Issue a request for the new objects, if we
                // know what our request looks like
                if (self.request) {
                    requestTelemetry(true);
                }
            }

            function getTelemetryObjects(domainObject) {
                promiseRelevantDomainObjects(domainObject)
                    .then(buildResponseContainers);
            }

            function startTimeout() {
                if (!self.refreshing && self.interval !== undefined) {
                    self.refreshing = true;
                    $timeout(function () {
                        if (self.request) {
                            requestTelemetry(false);
                        }

                        self.refreshing = false;
                        startTimeout();
                    }, self.interval);
                }
            }


            $scope.$watch("domainObject", getTelemetryObjects);
            startTimeout(); // Begin refreshing

            return {
                getMetadata: function () {
                    return self.metadatas;
                },
                getTelemetryObjects: function () {
                    return self.ids.map(function (id) {
                        return self.response[id].domainObject;
                    });
                },
                getResponse: function getResponse(arg) {
                    var id = arg && (typeof arg === 'string' ?
                            arg : arg.getId());

                    if (id) {
                        return (self.response[id] || {}).data;
                    }

                    return (self.ids || []).map(getResponse);
                },
                isRequestPending: function () {
                    return self.pending > 0;
                },
                requestData: function (request) {
                    self.request = request || {};
                    return requestTelemetry(true);
                },
                setRefreshInterval: function (durationMillis) {
                    self.interval = durationMillis;
                    startTimeout();
                }
            };
        }

        return TelemetryController;
    }
);