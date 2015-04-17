/*global define*/

/**
 * Module defining PlotController. Created by vwoeltje on 11/12/14.
 */
define(
    [
        "./elements/PlotUpdater",
        "./elements/PlotPalette",
        "./elements/PlotAxis",
        "./modes/PlotModeOptions",
        "./SubPlotFactory"
    ],
    function (PlotUpdater, PlotPalette, PlotAxis, PlotModeOptions, SubPlotFactory) {
        "use strict";

        var AXIS_DEFAULTS = [
                { "name": "Time" },
                { "name": "Value" }
            ];

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
        function PlotController($scope, telemetryFormatter, telemetryHandler) {
            var subPlotFactory = new SubPlotFactory(telemetryFormatter),
                modeOptions = new PlotModeOptions([], subPlotFactory),
                subplots = [],
                cachedObjects = [],
                updater,
                handle,
                domainOffset;

            // Populate the scope with axis information (specifically, options
            // available for each axis.)
            function setupAxes(metadatas) {
                $scope.axes = [
                    new PlotAxis("domain", metadatas, AXIS_DEFAULTS[0]),
                    new PlotAxis("range", metadatas, AXIS_DEFAULTS[1])
                ];
            }

            // Trigger an update of a specific subplot;
            // used in a loop to update all subplots.
            function updateSubplot(subplot) {
                subplot.update();
            }

            // Set up available modes (stacked/overlaid), based on the
            // set of telemetry objects in this plot view.
            function setupModes(telemetryObjects) {
                if (cachedObjects !== telemetryObjects) {
                    cachedObjects = telemetryObjects;
                    modeOptions = new PlotModeOptions(
                        telemetryObjects || [],
                        subPlotFactory
                    );
                }
            }

            // Update all sub-plots
            function update() {
                modeOptions.getModeHandler()
                    .getSubPlots()
                    .forEach(updateSubplot);
            }

            // Reinstantiate the plot updater (e.g. because we have a
            // new subscription.) This will clear the plot.
            function recreateUpdater() {
                updater = new PlotUpdater(
                    handle,
                    ($scope.axes[0].active || {}).key,
                    ($scope.axes[1].active || {}).key
                );
            }

            // Handle new telemetry data in this plot
            function updateValues() {
                if (handle) {
                    setupModes(handle.getTelemetryObjects());
                }
                if (updater) {
                    updater.update();
                    modeOptions.getModeHandler().plotTelemetry(updater);
                }
                update();
            }

            // Issue a new request for historical telemetry
            function requestTelemetry() {
                if (handle && updater) {
                    handle.request({}, updater.addHistorical);
                }
            }

            // Create a new subscription; telemetrySubscriber gets
            // to do the meaningful work here.
            function subscribe(domainObject) {
                if (handle) {
                    handle.unsubscribe();
                }
                handle = domainObject && telemetryHandler.handle(
                    domainObject,
                    updateValues,
                    true // Lossless
                );
                if (handle) {
                    setupModes(handle.getTelemetryObjects());
                    setupAxes(handle.getMetadata());
                    recreateUpdater();
                    requestTelemetry();
                }
            }

            // Release the current subscription (called when scope is destroyed)
            function releaseSubscription() {
                if (handle) {
                    handle.unsubscribe();
                    handle = undefined;
                }
            }

            // Subscribe to telemetry when a domain object becomes available
            $scope.$watch('domainObject', subscribe);

            // Unsubscribe when the plot is destroyed
            $scope.$on("$destroy", releaseSubscription);

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
                    modeOptions.setMode(mode);
                    updateValues();
                },
                /**
                 * Get all individual plots contained within this Plot view.
                 * (Multiple may be contained when in Stacked mode).
                 * @returns {SubPlot[]} all subplots in this Plot view
                 */
                getSubPlots: function () {
                    return modeOptions.getModeHandler().getSubPlots();
                },
                /**
                 * Explicitly update all plots.
                 */
                update: update,
                /**
                 * Check if a request is pending (to show the wait spinner)
                 */
                isRequestPending: function () {
                    // Placeholder; this should reflect request state
                    // when requesting historical telemetry
                    return false;
                }
            };
        }

        return PlotController;
    }
);