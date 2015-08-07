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
         * A PlotAxis provides a template-ready set of options
         * for the domain or range axis, sufficient to populate
         * selectors.
         *
         * @memberof platform/features/plot
         * @constructor
         * @param {string} axisType the field in metadatas to
         *        look at for axis options; usually one of
         *        "domains" or "ranges"
         * @param {object[]} metadatas metadata objects, as
         *        returned by the `getMetadata()` method of
         *        a `telemetry` capability.
         * @param {object} defaultValue the value to use for the
         *        active state in the event that no options are
         *        found; should contain "name" and "key" at
         *        minimum.
         *
         */
        function PlotAxis(axisType, metadatas, defaultValue) {
            var keys = {},
                options = [];

            // Look through all metadata objects and assemble a list
            // of all possible domain or range options
            function buildOptionsForMetadata(m) {
                (m[axisType] || []).forEach(function (option) {
                    if (!keys[option.key]) {
                        keys[option.key] = true;
                        options.push(option);
                    }
                });
            }

            (metadatas || []).forEach(buildOptionsForMetadata);

            // Plot axis will be used directly from the Angular
            // template, so expose properties directly to facilitate
            // two-way data binding (for drop-down menus)
            return {
                /**
                 * The set of options applicable for this axis;
                 * an array of objects, where each object contains a
                 * "key" field and a "name" field (for machine- and
                 * human-readable names respectively)
                 * @memberof platform/features/plot.PlotAxis#
                 */
                options: options,
                /**
                 * The currently chosen option for this axis. An
                 * initial value is provided; this will be updated
                 * directly form the plot template.
                 * @memberof platform/features/plot.PlotAxis#
                 */
                active: options[0] || defaultValue
            };
        }

        return PlotAxis;

    }
);
