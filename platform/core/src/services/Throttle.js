/*global define*/

define(
    [],
    function () {
        "use strict";
        
        /**
         * Throttler for function executions, registered as the `throttle`
         * service.
         *
         * Usage:
         *
         *     throttle(fn, delay, [apply])
         *
         * Returns a function that, when invoked, will invoke `fn` after 
         * `delay` milliseconds, only if no other invocations are pending.
         * The optional argument `apply` determines whether.
         *
         * The returned function will itself return a `Promise` which will
         * resolve to the returned value of `fn` whenever that is invoked.
         *
         * @returns {Function}
         */
        function Throttle($timeout) {
            /**
             * Throttle this function.
             * @param {Function} fn the function to throttle
             * @param {number} [delay] the delay, in milliseconds, before
             *        executing this function; defaults to 0.
             * @param {boolean} apply true if a `$apply` call should be 
             *        invoked after this function executes; defaults to
             *        `false`.
             */
            return function (fn, delay, apply) {
                var activeTimeout;
                
                // Clear active timeout, so that next invocation starts
                // a new one.
                function clearActiveTimeout() {
                    activeTimeout = undefined;
                }
                
                // Defaults
                delay = delay || 0;
                apply = apply || false;
                
                return function () {
                    // Start a timeout if needed
                    if (!activeTimeout) {
                        activeTimeout = $timeout(fn, delay, apply);
                        activeTimeout.then(clearActiveTimeout);
                    }
                    // Return whichever timeout is active (to get 
                    // a promise for the results of fn)
                    return activeTimeout;
                };
            };
        }
        
        return Throttle;
    }
);