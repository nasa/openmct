/*global define*/

define(
    ['./TelemetryHandle'],
    function (TelemetryHandle) {
        "use strict";


        /**
         * A TelemetryRequester provides an easy interface to request
         * telemetry associated with a set of domain objects.
         *
         * @constructor
         * @param $q Angular's $q
         */
        function TelemetryHandler($q, telemetrySubscriber) {
            return {
                handle: function (domainObject, callback, lossless) {
                    var subscription = telemetrySubscriber.subscribe(
                        domainObject,
                        callback,
                        lossless
                    );

                    return new TelemetryHandle($q, subscription);
                }
            };
        }

        return TelemetryHandler;

    }
);