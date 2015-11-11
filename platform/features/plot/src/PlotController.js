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

/**
 * This bundle adds a "Plot" view for numeric telemetry data.
 * @namespace platform/features/plot
 */
define(
    [
        "./elements/PlotUpdater",
        "./elements/PlotPalette",
        "./elements/PlotAxis",
        "./elements/PlotLimitTracker",
        "./elements/PlotTelemetryFormatter",
        "./modes/PlotModeOptions",
        "./SubPlotFactory"
    ],
    function (
        PlotUpdater,
        PlotPalette,
        PlotAxis,
        PlotLimitTracker,
        PlotTelemetryFormatter,
        PlotModeOptions,
        SubPlotFactory
    ) {
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
         * @memberof platform/features/plot
         * @constructor
         */
        function PlotController(
            $scope,
            telemetryFormatter,
            telemetryHandler,
            throttle,
            PLOT_FIXED_DURATION
        ) {
            var self = this,
                plotTelemetryFormatter =
                    new PlotTelemetryFormatter(telemetryFormatter),
                subPlotFactory =
                    new SubPlotFactory(plotTelemetryFormatter),
                cachedObjects = [],
                updater,
                lastBounds,
                lastRange,
                lastDomain,
                handle;

            // Populate the scope with axis information (specifically, options
            // available for each axis.)
            function setupAxes(metadatas) {
                $scope.axes.forEach(function (axis) {
                    axis.updateMetadata(metadatas);
                });
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
                    self.modeOptions = new PlotModeOptions(
                        telemetryObjects || [],
                        subPlotFactory
                    );
                }
            }

            // Change the displayable bounds
            function setBasePanZoom(bounds) {
                var start = bounds.start,
                    end = bounds.end;
                if (updater) {
                    updater.setDomainBounds(start, end);
                    self.update();
                }
                lastBounds = bounds;
            }

            // Reinstantiate the plot updater (e.g. because we have a
            // new subscription.) This will clear the plot.
            function recreateUpdater() {
                var domain = $scope.axes[0].active.key,
                    range = $scope.axes[1].active.key,
                    duration = PLOT_FIXED_DURATION;

                updater = new PlotUpdater(handle, domain, range, duration);
                lastDomain = domain;
                lastRange = range;

                self.limitTracker = new PlotLimitTracker(handle, range);

                // Keep any externally-provided bounds
                if (lastBounds) {
                    setBasePanZoom(lastBounds);
                }
            }

            function getUpdater() {
                if (!updater) {
                    recreateUpdater();
                }
                return updater;
            }

            // Handle new telemetry data in this plot
            function updateValues() {
                self.pending = false;
                if (handle) {
                    setupModes(handle.getTelemetryObjects());
                    setupAxes(handle.getMetadata());
                    getUpdater().update();
                    self.modeOptions.getModeHandler().plotTelemetry(updater);
                    self.limitTracker.update();
                    self.update();
                }
            }

            // Display new historical data as it becomes available
            function addHistoricalData(domainObject, series) {
                self.pending = false;
                getUpdater().addHistorical(domainObject, series);
                self.modeOptions.getModeHandler().plotTelemetry(updater);
                self.update();
            }

            // Issue a new request for historical telemetry
            function requestTelemetry() {
                if (handle) {
                    handle.request({}, addHistoricalData);
                }
            }

            // Requery for data entirely
            function replot() {
                if (handle) {
                    updater = undefined;
                    requestTelemetry();
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
                replot();
            }

            // Release the current subscription (called when scope is destroyed)
            function releaseSubscription() {
                if (handle) {
                    handle.unsubscribe();
                    handle = undefined;
                }
            }

            function requery() {
                self.pending = true;
                releaseSubscription();
                subscribe($scope.domainObject);
            }

            function updateDomainFormat() {
                var domainAxis = $scope.axes[0];
                plotTelemetryFormatter
                    .setDomainFormat(domainAxis.active.format);
            }

            function domainRequery(newDomain) {
                if (newDomain !== lastDomain) {
                    updateDomainFormat();
                    requery();
                }
            }

            function rangeRequery(newRange) {
                if (newRange !== lastRange) {
                    requery();
                }
            }

            // Respond to a display bounds change (requery for data)
            function changeDisplayBounds(event, bounds) {
                var domainAxis = $scope.axes[0];

                domainAxis.chooseOption(bounds.domain);
                updateDomainFormat();
                setBasePanZoom(bounds);
                requery();
            }

            this.modeOptions = new PlotModeOptions([], subPlotFactory);
            this.updateValues = updateValues;

            // Create a throttled update function
            this.scheduleUpdate = throttle(function () {
                self.modeOptions.getModeHandler().getSubPlots()
                    .forEach(updateSubplot);
            });

            self.pending = true;

            // Initialize axes; will get repopulated when telemetry
            // metadata becomes available.
            $scope.axes = [
                new PlotAxis("domains", [], AXIS_DEFAULTS[0]),
                new PlotAxis("ranges", [], AXIS_DEFAULTS[1])
            ];

            // Watch for changes to the selected axis
            $scope.$watch("axes[0].active.key", domainRequery);
            $scope.$watch("axes[1].active.key", rangeRequery);

            // Subscribe to telemetry when a domain object becomes available
            $scope.$watch('domainObject', subscribe);

            // Respond to external bounds changes
            $scope.$on("telemetry:display:bounds", changeDisplayBounds);

            // Unsubscribe when the plot is destroyed
            $scope.$on("$destroy", releaseSubscription);
        }

        /**
         * Get the color (as a style-friendly string) to use
         * for plotting the trace at the specified index.
         * @param {number} index the index of the trace
         * @returns {string} the color, in #RRGGBB form
         */
        PlotController.prototype.getColor = function (index) {
            return PlotPalette.getStringColor(index);
        };

        /**
         * Check if the plot is zoomed or panned out
         * of its default state (to determine whether back/unzoom
         * controls should be shown)
         * @returns {boolean} true if not in default state
         */
        PlotController.prototype.isZoomed = function () {
            return this.modeOptions.getModeHandler().isZoomed();
        };

        /**
         * Undo the most recent pan/zoom change and restore
         * the prior state.
         */
        PlotController.prototype.stepBackPanZoom = function () {
            return this.modeOptions.getModeHandler().stepBackPanZoom();
        };

        /**
         * Undo all pan/zoom changes and restore the initial state.
         */
        PlotController.prototype.unzoom = function () {
            return this.modeOptions.getModeHandler().unzoom();
        };

        /**
         * Get the mode options (Stacked/Overlaid) that are applicable
         * for this plot.
         */
        PlotController.prototype.getModeOptions = function () {
            return this.modeOptions.getModeOptions();
        };

        /**
         * Get the current mode that is applicable to this plot. This
         * will include key, name, and glyph fields.
         */
        PlotController.prototype.getMode = function () {
            return this.modeOptions.getMode();
        };

        /**
         * Set the mode which should be active in this plot.
         * @param mode one of the mode options returned from
         *        getModeOptions()
         */
        PlotController.prototype.setMode = function (mode) {
            this.modeOptions.setMode(mode);
            this.updateValues();
        };

        /**
         * Get all individual plots contained within this Plot view.
         * (Multiple may be contained when in Stacked mode).
         * @returns {SubPlot[]} all subplots in this Plot view
         */
        PlotController.prototype.getSubPlots = function () {
            return this.modeOptions.getModeHandler().getSubPlots();
        };

        /**
         * Get the CSS class to apply to the legend for this domain
         * object; this will reflect limit state.
         * @returns {string} the CSS class
         */
        PlotController.prototype.getLegendClass = function (telemetryObject) {
            return this.limitTracker &&
                this.limitTracker.getLegendClass(telemetryObject);
        };

        /**
         * Explicitly update all plots.
         */
        PlotController.prototype.update = function () {
            this.scheduleUpdate();
        };

        /**
         * Check if a request is pending (to show the wait spinner)
         */
        PlotController.prototype.isRequestPending = function () {
            // Placeholder; this should reflect request state
            // when requesting historical telemetry
            return this.pending;
        };

        return PlotController;
    }
);

