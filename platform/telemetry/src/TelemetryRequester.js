/*global define*/

define(
    ['./TelemetryDelegator'],
    function (TelemetryDelegator) {
        "use strict";


        /**
         * A TelemetryRequester provides an easy interface to request
         * telemetry associated with a set of domain objects.
         *
         * @constructor
         * @param $q Angular's $q
         */
        function TelemetryRequester($q) {
            var delegator = new TelemetryDelegator($q);

            // Look up domain objects which have telemetry capabilities.
            // This will either be the object in view, or object that
            // this object delegates its telemetry capability to.
            function promiseRelevantObjects(domainObject) {
                return delegator.promiseTelemetryObjects(domainObject);
            }

            return {

            };
        }

        return TelemetryRequester;

    }
);