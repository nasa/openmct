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
            this.axisType = axisType;
            this.defaultValue = defaultValue;
            this.optionKeys = {};

            /**
             * The currently chosen option for this axis. An
             * initial value is provided; this will be updated
             * directly form the plot template.
             * @memberof platform/features/plot.PlotAxis#
             */
            this.active = defaultValue;

            /**
             * The set of options applicable for this axis;
             * an array of objects, where each object contains a
             * "key" field and a "name" field (for machine- and
             * human-readable names respectively)
             * @memberof platform/features/plot.PlotAxis#
             */
            this.options = [];

            // Initialize options from metadata objects
            this.updateMetadata(metadatas);
        }


        /**
         * Update axis options to reflect current metadata.
         * @param {TelemetryMetadata[]} metadata objects describing
         *        applicable telemetry
         */
        PlotAxis.prototype.updateMetadata = function (metadatas) {
            var axisType = this.axisType,
                optionKeys = this.optionKeys,
                newOptions = {},
                toAdd = [];

            function isValid(option) {
                return option && optionKeys[option.key];
            }

            metadatas.forEach(function (m) {
                (m[axisType] || []).forEach(function (option) {
                    var key = option.key;
                    if (!optionKeys[key] && !newOptions[key]) {
                        toAdd.push(option);
                    }
                    newOptions[key] = true;
                });
            });

            optionKeys = this.optionKeys = newOptions;

            // General approach here is to avoid changing object
            // instances unless something has really changed, since
            // Angular is watching; don't want to trigger extra digests.
            if (!this.options.every(isValid)) {
                this.options = this.options.filter(isValid);
            }

            if (toAdd.length > 0) {
                this.options = this.options.concat(toAdd);
            }

            if (!isValid(this.active)) {
                this.active = this.options[0] || this.defaultValue;
            }
        };

        /**
         * Change the domain/range selection for this axis. If the
         * provided `key` is not recognized as an option, no change
         * will occur.
         * @param {string} key the identifier for the domain/range
         */
        PlotAxis.prototype.chooseOption = function (key) {
            var self = this;
            this.options.forEach(function (option) {
                if (option.key === key) {
                    self.active = option;
                }
            });
        };

        return PlotAxis;

    }
);
