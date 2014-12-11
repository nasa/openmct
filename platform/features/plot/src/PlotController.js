/*global define*/

/**
 * Module defining PlotController. Created by vwoeltje on 11/12/14.
 */
define(
    [
        "./elements/PlotPreparer",
        "./elements/PlotPalette",
        "./elements/PlotPanZoomStack",
        "./elements/PlotPosition",
        "./elements/PlotTickGenerator",
        "./elements/PlotFormatter",
        "./elements/PlotAxis",
        "./modes/PlotModeOptions"
    ],
    function (
        PlotPreparer,
        PlotPalette,
        PlotPanZoomStack,
        PlotPosition,
        PlotTickGenerator,
        PlotFormatter,
        PlotAxis,
        PlotModeOptions
    ) {
        "use strict";

        var AXIS_DEFAULTS = [
                { "name": "Time" },
                { "name": "Value" }
            ],
            DOMAIN_TICKS = 5,
            RANGE_TICKS = 7;

        /**
         * The PlotController is responsible for any computation/logic
         * associated with displaying the plot view. Specifically, these
         * responsibilities include:
         *
         * * Describing axes and labeling.
         * * Handling user interactions.
         * * Deciding what needs to be drawn in the chart area.
         *
         * @constructor
         */
        function PlotController($scope) {
            var modeOptions = new PlotModeOptions([]),
                subplots = [],
                domainOffset;

            // Populate the scope with axis information (specifically, options
            // available for each axis.)
            function setupAxes(metadatas) {
                $scope.axes = [
                    new PlotAxis("domain", metadatas, AXIS_DEFAULTS[0]),
                    new PlotAxis("range", metadatas, AXIS_DEFAULTS[1])
                ];
            }

            // Respond to newly-available telemetry data; update the
            // drawing area accordingly.
            function plotTelemetry() {
                var prepared, datas, telemetry;

                // Get a reference to the TelemetryController
                telemetry = $scope.telemetry;

                // Nothing to plot without TelemetryController
                if (!telemetry) {
                    return;
                }

                // Ensure axes have been initialized (we will want to
                // get the active axis below)
                if (!$scope.axes) {
                    setupAxes(telemetry.getMetadata());
                }

                // Get data sets
                datas = telemetry.getResponse();

                // Prepare data sets for rendering
                prepared = new PlotPreparer(
                    datas,
                    ($scope.axes[0].active || {}).key,
                    ($scope.axes[1].active || {}).key
                );

                modeOptions.getModeHandler().plotTelemetry(prepared);
            }

            function setupModes(telemetryObjects) {
                modeOptions = new PlotModeOptions(telemetryObjects || []);
            }

            $scope.$watch("telemetry.getTelemetryObjects()", setupModes);
            $scope.$watch("telemetry.getMetadata()", setupAxes);
            $scope.$on("telemetryUpdate", plotTelemetry);

            return {
                /**
                 * Get the color (as a style-friendly string) to use
                 * for plotting the trace at the specified index.
                 * @param {number} index the index of the trace
                 * @returns {string} the color, in #RRGGBB form
                 */
                getColor: function (index) {
                    return PlotPalette.getStringColor(index);
                },
                /**
                 * Check if the plot is zoomed or panned out
                 * of its default state (to determine whether back/unzoom
                 * controls should be shown)
                 * @returns {boolean} true if not in default state
                 */
                isZoomed: function () {
                    return modeOptions.getModeHandler().isZoomed();
                },
                /**
                 * Undo the most recent pan/zoom change and restore
                 * the prior state.
                 */
                stepBackPanZoom: function () {
                    return modeOptions.getModeHandler().stepBackPanZoom();
                },
                /**
                 * Undo all pan/zoom changes and restore the initial state.
                 */
                unzoom: function () {
                    return modeOptions.getModeHandler().unzoom();
                },
                /**
                 * Get the mode options (Stacked/Overlaid) that are applicable
                 * for this plot.
                 */
                getModeOptions: function () {
                    return modeOptions.getModeOptions();
                },
                /**
                 * Get the current mode that is applicable to this plot. This
                 * will include key, name, and glyph fields.
                 */
                getMode: function () {
                    return modeOptions.getMode();
                },
                /**
                 * Set the mode which should be active in this plot.
                 * @param mode one of the mode options returned from
                 *        getModeOptions()
                 */
                setMode: function (mode) {
                    return modeOptions.setMode(mode);
                },
                /**
                 * Get all individual plots contained within this Plot view.
                 * (Multiple may be contained when in Stacked mode).
                 * @returns {SubPlot[]} all subplots in this Plot view
                 */
                getSubPlots: function () {
                    return modeOptions.getModeHandler().getSubPlots();
                }

            };
        }

        return PlotController;
    }
);