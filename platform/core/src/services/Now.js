/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Defines the `now` service, which is a simple wrapper upon
         * `Date.now()` which can be injected to support testability.
         *
         * @returns {Function} a function which returns current system time
         */
        function Now() {
            /**
             * Get the current time.
             * @returns {number} current time, in milliseconds since
             *          1970-01-01 00:00:00Z
             */
            return function () {
                return Date.now();
            };
        }

        return Now;
    }
);