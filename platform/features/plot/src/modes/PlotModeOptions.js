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
                glyph: "m",
                Constructor: PlotStackMode
            },
            OVERLAID = {
                key: "overlaid",
                name: "Overlaid",
                glyph: "6",
                Constructor: PlotOverlayMode
            };

        /**
         * Handles distinct behavior associated with different
         * plot modes.
         *
         * @interface platform/features/plot.PlotModeHandler
         * @private
         */

        /**
         * Plot telemetry to the sub-plot(s) managed by this mode.
         * @param {platform/features/plot.PlotUpdater} updater a source
         *        of data that is ready to plot
         * @method platform/features/plot.PlotModeHandler#plotTelemetry
         */
        /**
         * Get all sub-plots to be displayed in this mode; used
         * to populate the plot template.
         * @return {platform/features/plot.SubPlot[]} all sub-plots to
         *         display in this mode
         * @method platform/features/plot.PlotModeHandler#getSubPlots
         */
        /**
         * Check if we are not in our base pan-zoom state (that is,
         * there are some temporary user modifications to the
         * current pan-zoom state.)
         * @returns {boolean} true if not in the base pan-zoom state
         * @method platform/features/plot.PlotModeHandler#isZoomed
         */
        /**
         * Undo the most recent pan/zoom change and restore
         * the prior state.
         * @method platform/features/plot.PlotModeHandler#stepBackPanZoom
         */
        /**
         * Undo all pan/zoom change and restore the base state.
         * @method platform/features/plot.PlotModeHandler#unzoom
         */

        /**
         * Determines which plotting modes (stacked/overlaid)
         * are applicable in a given plot view, maintains current
         * selection state thereof, and provides handlers for the
         * different behaviors associated with these modes.
         * @memberof platform/features/plot
         * @constructor
         * @param {DomainObject[]} telemetryObjects the telemetry objects being
         *        represented in this plot view
         * @param {platform/features/plot.SubPlotFactory} subPlotFactory a
         *        factory for creating sub-plots
         */
        function PlotModeOptions(telemetryObjects, subPlotFactory) {
            this.options = telemetryObjects.length > 1 ?
                    [ OVERLAID, STACKED ] : [ OVERLAID ];
            this.mode = this.options[0]; // Initial selection (overlaid)
            this.telemetryObjects = telemetryObjects;
            this.subPlotFactory = subPlotFactory;
        }

        /**
         * Get a handler for the current mode. This will handle
         * plotting telemetry, providing subplots for the template,
         * and view-level interactions with pan-zoom state.
         * @returns {PlotOverlayMode|PlotStackMode} a handler
         *          for the current mode
         */
        PlotModeOptions.prototype.getModeHandler = function () {
            // Lazily initialize
            if (!this.modeHandler) {
                this.modeHandler = new this.mode.Constructor(
                    this.telemetryObjects,
                    this.subPlotFactory
                );
            }
            return this.modeHandler;
        };

        /**
         * Get all mode options available for each plot. Each
         * mode contains a `name` and `glyph` field suitable
         * for display in a template.
         * @return {Array} the available modes
         */
        PlotModeOptions.prototype.getModeOptions = function () {
            return this.options;
        };

        /**
         * Get the plotting mode option currently in use.
         * This will be one of the elements returned from
         * `getModeOptions`.
         * @return {*} the current mode
         */
        PlotModeOptions.prototype.getMode = function () {
            return this.mode;
        };

        /**
         * Set the plotting mode option to use.
         * The passed argument must be one of the options
         * returned by `getModeOptions`.
         * @param {object} option one of the plot mode options
         *        from `getModeOptions`
         */
        PlotModeOptions.prototype.setMode = function (option) {
            if (this.mode !== option) {
                this.mode = option;
                // Clear the existing mode handler, so it
                // can be instantiated next time it's needed.
                this.modeHandler = undefined;
            }
        };


        return PlotModeOptions;
    }
);
