/*global define*/

define(
    ["./TelemetrySubscription"],
    function (TelemetrySubscription) {
        "use strict";

        function TelemetrySubscriber($q, $timeout) {
            return {
                subscribe: function (domainObject, callback) {
                    return new TelemetrySubscription(
                        $q,
                        $timeout,
                        domainObject,
                        callback
                    );
                }
            };
        }

        return TelemetrySubscriber;
    }
);