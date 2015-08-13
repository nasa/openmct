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
    ["./SubPlot"],
    function (SubPlot) {
        "use strict";

        /**
         * Utility factory; wraps the SubPlot constructor and adds
         * in a reference to the telemetryFormatter, which will be
         * used to represent telemetry values (timestamps or data
         * values) as human-readable strings.
         * @memberof platform/features/plot
         * @constructor
         */
        function SubPlotFactory(telemetryFormatter) {
            this.telemetryFormatter = telemetryFormatter;
        }

        /**
         * Instantiate a new sub-plot.
         * @param {DomainObject[]} telemetryObjects the domain objects
         *        which will be plotted in this sub-plot
         * @param {PlotPanZoomStack} panZoomStack the stack of pan-zoom
         *        states which is applicable to this sub-plot
         * @returns {SubPlot} the instantiated sub-plot
         * @method
         */
        SubPlotFactory.prototype.createSubPlot = function (telemetryObjects, panZoomStack) {
            return new SubPlot(
                telemetryObjects,
                panZoomStack,
                this.telemetryFormatter
            );
        };

        return SubPlotFactory;

    }
);
