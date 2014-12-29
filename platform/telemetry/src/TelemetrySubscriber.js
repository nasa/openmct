/*global define*/

define(
    [],
    function () {
        "use strict";

        function TelemetrySubscriber($q, $timeout, domainObject, callback) {
            var unsubscribePromise,
                latestValues = {},
                telemetryObjects = [],
                updatePending;

            // Look up domain objects which have telemetry capabilities.
            // This will either be the object in view, or object that
            // this object delegates its telemetry capability to.
            function promiseRelevantObjects(domainObject) {
                // If object has been cleared, there are no relevant
                // telemetry-providing domain objects.
                if (!domainObject) {
                    return $q.when([]);
                }

                // Otherwise, try delegation first, and attach the
                // object itself if it has a telemetry capability.
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

            function fireCallback(values) {
                callback(values);
                updatePending = false;
            }

            function update(domainObject, telemetry) {
                var count = telemetry && telemetry.getPointCount();

                if (!updatePending && count) {
                    updatePending = true;
                    $timeout(fireCallback, 0);
                }

                if (count > 0) {
                    latestValues[domainObject.getId()] = {
                        domain: telemetry.getDomainValue(count - 1),
                        range: telemetry.getRangeValue(count - 1)
                    };
                }
            }

            function subscribe(domainObject) {
                var telemetryCapability =
                    domainObject.getCapability("telemetry");
                return telemetryCapability.subscribe(function (telemetry) {
                    update(domainObject, telemetry);
                });
            }

            function subscribeAll(domainObjects) {
                return domainObjects.map(subscribe);
            }

            function cacheObjectReferences(objects) {
                telemetryObjects = objects;
                return objects;
            }

            // Get a reference to relevant objects (those with telemetry
            // capabilities)
            unsubscribePromise =
                promiseRelevantObjects(domainObject)
                    .then(cacheObjectReferences)
                    .then(subscribeAll);

            return {
                unsubscribe: function () {
                    return unsubscribePromise.then(function (unsubscribes) {
                        return $q.all(unsubscribes.map(function (unsubscribe) {
                            return unsubscribe();
                        }));
                    });
                },
                getDomainValue: function (domainObject) {
                    var id = domainObject.getId();
                    return (latestValues[id] || {}).domain;
                },
                getRangeValue: function (domainObject) {
                    var id = domainObject.getId();
                    return (latestValues[id] || {}).range;
                },
                getTelemetryObjects: function () {
                    return telemetryObjects;
                }
            };
        }

        return TelemetrySubscriber;

    }
);