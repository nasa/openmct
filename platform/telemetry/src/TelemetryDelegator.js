/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Used to handle telemetry delegation associated with a
         * given domain object.
         */
        function TelemetryDelegator($q) {
            return {
                /**
                 * Promise telemetry-providing objects associated with
                 * this domain object (either the domain object itself,
                 * or the objects it delegates)
                 * @returns {Promise.<DomainObject[]>} domain objects with
                 *          a telemetry capability
                 */
                promiseTelemetryObjects: function (domainObject) {
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
            };
        }

        return TelemetryDelegator;
    }
);