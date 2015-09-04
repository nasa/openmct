/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Handles configuration of RequireJS to expose libraries
         * from bundles with module names that can be used from other
         * bundles.
         * @memberof platform/framework
         * @constructor
         * @param requirejs an instance of RequireJS
         */
        function RequireConfigurator(requirejs) {
            this.requirejs = requirejs;
        }

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

        /**
         * Configure RequireJS to utilize any path/shim definitions
         * provided by these bundles.
         *
         * @param {Bundle[]} the bundles to include in this
         *                   configuration
         * @memberof platform/framework.RequireConfigurator#
         */
        RequireConfigurator.prototype.configure = function (bundles) {
            return this.requirejs.config(buildConfiguration(bundles));
        };

        return RequireConfigurator;

    }
);
