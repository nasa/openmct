/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Handles configuration of RequireJS to expose libraries
         * from bundles with module names that can be used from other
         * bundles.
         * @constructor
         * @param requirejs an instance of RequireJS
         */
        function RequireConfigurator(requirejs) {
            // Utility function to clone part of a bundle definition
            function clone(obj) {
                return JSON.parse(JSON.stringify(obj));
            }

            // Look up module configuration from the bundle definition.
            // This will adjust paths to libraries as-needed.
            function getConfiguration(bundle) {
                var configuration = bundle.getConfiguration();

                // Adjust paths to point to libraries
                if (configuration.paths) {
                    // Don't modify the actual bundle definition...
                    configuration = clone(configuration);
                    // ...replace values in a clone instead.
                    Object.keys(configuration.paths).forEach(function (path) {
                        configuration.paths[path] =
                            bundle.getLibraryPath(configuration.paths[path]);
                    });
                }

                return configuration;
            }

            // Build up paths and shim values from multiple bundles;
            // this is sensitive to the value from baseConfiguration
            // passed via reduce in buildConfiguration below, insofar
            // as it assumes paths and shim will have initial empty values.
            function mergeConfigurations(base, next) {
                ["paths", "shim"].forEach(function (k) {
                    Object.keys(next[k] || {}).forEach(function (p) {
                        base[k][p] = next[k][p];
                    });
                });
                return base;
            }

            // Build a configuration object, to pass to requirejs.config,
            // based on the defined configurations for all bundles.
            // The paths and shim properties from all bundles will be
            // merged to allow one requirejs.config call.
            function buildConfiguration(bundles) {
                // Provide an initial requirejs configuration...
                var baseConfiguration = {
                        baseUrl: "",
                        paths: {},
                        shim: {}
                    },
                    // ...and pull out all bundle-specific parts
                    bundleConfigurations = bundles.map(getConfiguration);

                // Reduce this into one configuration object.
                return bundleConfigurations.reduce(
                    mergeConfigurations,
                    baseConfiguration
                );
            }

            return {
                /**
                 * Configure RequireJS to utilize any path/shim definitions
                 * provided by these bundles.
                 *
                 * @param {Bundle[]} the bundles to include in this
                 *                   configuration
                 */
                configure: function (bundles) {
                    return requirejs.config(buildConfiguration(bundles));
                }
            };
        }

        return RequireConfigurator;

    }
);