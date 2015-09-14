/*global define*/

define(
    ['moment'],
    function (moment) {
        "use strict";

        /**
         * Calls functions every second, as close to the actual second
         * tick as is feasible.
         * @constructor
         * @param $timeout Angular's $timeout
         * @param {Function} now function to provide the current time in ms
         */
        function TickerService($timeout, now) {
            var callbacks = [],
                last = now() - 1000;

            function tick() {
                var timestamp = now(),
                    millis = timestamp % 1000;

                // Only update callbacks if a second has actually passed.
                if (timestamp >= last + 1000) {
                    callbacks.forEach(function (callback) {
                        callback(timestamp);
                    });
                    last = timestamp - millis;
                }

                // Try to update at exactly the next second
                $timeout(tick, 1000 - millis, true);
            }

            tick();

            return {
                /**
                 * Listen for clock ticks. The provided callback will
                 * be invoked with the current timestamp (in milliseconds
                 * since Jan 1 1970) at regular intervals, as near to the
                 * second boundary as possible.
                 *
                 * @method listen
                 * @name TickerService#listen
                 * @param {Function} callback callback to invoke
                 * @returns {Function} a function to unregister this listener
                 */
                listen: function (callback) {
                    callbacks.push(callback);

                    // Provide immediate feedback
                    callback(last);

                    // Provide a deregistration function
                    return function () {
                        callbacks = callbacks.filter(function (cb) {
                            return cb !== callback;
                        });
                    };
                }
            };

        }

        return TickerService;
    }
);
