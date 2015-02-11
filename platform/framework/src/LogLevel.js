/*global define*/

define(
    [],
    function () {
        "use strict";

        // Log levels; note that these must be in order of
        // most-important-first for LogLevel to function correctly
        // as implemented.
        var LOG_LEVELS = [
            'error',
            'warn',
            'info',
            'log',
            'debug'
        ];

        // No-op, to replace undesired log levels with
        function NOOP() {}

        /**
         * Handles enforcement of logging at different levels, specified
         * at load time. The provided level should be one of "error",
         * "warn", "info", "log", or "debug"; otherwise, "warn" is used
         * as a default. Only log messages of levels equal to or greater
         * than the specified level will be passed to console.
         *
         * @constructor
         * @param {string} level the logging level
         */
        function LogLevel(level) {
            // Find the numeric level associated with the string
            var index = LOG_LEVELS.indexOf(level);

            // Replace logging methods with no-ops, if they are
            // not of an appropriate level.
            function decorate(log) {
                LOG_LEVELS.forEach(function (m, i) {
                    // Determine applicability based on index
                    // (since levels are in descending order)
                    if (i > index) {
                        log[m] = NOOP;
                    }
                });
            }

            // Default to 'warn' level if unspecified
            if (index < 0) {
                index = 1;
            }

            return {
                /**
                 * Configure logging to suppress log output if it is
                 * not of an appropriate level. Both the Angular app
                 * being initialized and a reference to `$log` should be
                 * passed; the former is used to configure application
                 * logging, while the latter is needed to apply the
                 * same configuration during framework initialization
                 * (since the framework also logs.)
                 *
                 * @param app the Angular app to configure
                 * @param $log Angular's $log (also configured)
                 */
                configure: function (app, $log) {
                    decorate($log);
                    app.config(function ($provide) {
                        $provide.decorator('$log', function ($delegate) {
                            decorate($delegate);
                            return $delegate;
                        });
                    });
                }
            };
        }

        return LogLevel;
    }
);