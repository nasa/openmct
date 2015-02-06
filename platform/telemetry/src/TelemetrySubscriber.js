/*global define*/

define(
    ["./TelemetrySubscription"],
    function (TelemetrySubscription) {
        "use strict";

        /**
         * The TelemetrySubscriber is a service which allows
         * subscriptions to be made for new data associated with
         * domain objects. It is exposed as a service named
         * `telemetrySubscriber`.
         *
         * Subscriptions may also be made directly using the
         * `telemetry` capability of a domain objcet; the subscriber
         * uses this as well, but additionally handles delegation
         * (e.g. for telemetry panels) as well as latest-value
         * extraction.
         *
         * @constructor
         * @param $q Angular's $q
         * @param $timeout Angular's $timeout
         */
        function TelemetrySubscriber($q, $timeout) {
            return {
                /**
                 * Subscribe to streaming telemetry updates
                 * associated with this domain object (either
                 * directly or via capability delegation.)
                 *
                 * @param {DomainObject} domainObject the object whose
                 *        associated telemetry data is of interest
                 * @param {Function} callback a function to invoke
                 *        when new data has become available.
                 * @param {boolean} lossless flag to indicate whether the
                 *        callback should be notified for all values
                 *        (otherwise, multiple values in quick succession
                 *        will call back with only the latest value.)
                 * @returns {TelemetrySubscription} the subscription,
                 *        which will provide access to latest values.
                 *
                 * @method
                 * @memberof TelemetrySubscriber
                 */
                subscribe: function (domainObject, callback, lossless) {
                    return new TelemetrySubscription(
                        $q,
                        $timeout,
                        domainObject,
                        callback,
                        lossless
                    );
                }
            };
        }

        return TelemetrySubscriber;
    }
);