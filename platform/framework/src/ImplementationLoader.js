/*global define,Promise*/

/**
 * Module defining ImplementationLoader. Created by vwoeltje on 11/3/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Responsible for loading extension implementations
         * (AMD modules.) Acts as a wrapper around RequireJS to
         * provide a promise-like API.
         * @constructor
         * @param {*} require RequireJS, or an object with similar API
         * @param {*} $log Angular's logging service
         */
        function ImplementationLoader(require) {
            function loadModule(path) {
                return new Promise(function (fulfill, reject) {
                    require(path, fulfill, reject);
                });
            }

            return {
                /**
                 * Load an extension's implementation; or, equivalently,
                 * load an AMD module. This is fundamentally similar
                 * to a call to RequireJS, except that the result is
                 * wrapped in a promise. The promise will be fulfilled
                 * with the loaded module, or rejected with the error
                 * reported by Require.
                 *
                 * @method
                 * @memberof ImplementationLoader#
                 * @param {string} path the path to the module to load
                 * @returns {Promise} a promise for the specified module.
                 */
                load: loadModule
            };
        }

        return ImplementationLoader;
    }
);