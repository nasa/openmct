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
    ["./PlotOverlayMode", "./PlotStackMode"],
    function (PlotOverlayMode, PlotStackMode) {
        "use strict";

        var STACKED = {
                key: "stacked",
                name: "Stacked",
                glyph: "8",
                factory: PlotStackMode
            },
            OVERLAID = {
                key: "overlaid",
                name: "Overlaid",
                glyph: "6",
                factory: PlotOverlayMode
            };

        /**
         * Determines which plotting modes (stacked/overlaid)
         * are applicable in a given plot view, maintains current
         * selection state thereof, and provides handlers for the
         * different behaviors associated with these modes.
         * @constructor
         * @param {DomainObject[]} the telemetry objects being
         *        represented in this plot view
         */
        function PlotModeOptions(telemetryObjects, subPlotFactory) {
            var options = telemetryObjects.length > 1 ?
                    [ OVERLAID, STACKED ] : [ OVERLAID ],
                mode = options[0], // Initial selection (overlaid)
                modeHandler;

            return {
                /**
                 * Get a handler for the current mode. This will handle
                 * plotting telemetry, providing subplots for the template,
                 * and view-level interactions with pan-zoom state.
                 * @returns {PlotOverlayMode|PlotStackMode} a handler
                 *          for the current mode
                 */
                getModeHandler: function () {
                    // Lazily initialize
                    if (!modeHandler) {
                        modeHandler = mode.factory(
                            telemetryObjects,
                            subPlotFactory
                        );
                    }
                    return modeHandler;
                },
                /**
                 * Get all mode options available for each plot. Each
                 * mode contains a `name` and `glyph` field suitable
                 * for display in a template.
                 * @return {Array} the available modes
                 */
                getModeOptions: function () {
                    return options;
                },
                /**
                 * Get the plotting mode option currently in use.
                 * This will be one of the elements returned from
                 * `getModeOptions`.
                 * @return {object} the current mode
                 */
                getMode: function () {
                    return mode;
                },
                /**
                 * Set the plotting mode option to use.
                 * The passed argument must be one of the options
                 * returned by `getModeOptions`.
                 * @param {object} option one of the plot mode options
                 *        from `getModeOptions`
                 */
                setMode: function (option) {
                    if (mode !== option) {
                        mode = option;
                        // Clear the existing mode handler, so it
                        // can be instantiated next time it's needed.
                        modeHandler = undefined;
                    }
                }
            };
        }

        return PlotModeOptions;
    }
);