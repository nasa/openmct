/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

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
     (
        PlotUpdater,
        PlotPalette,
        PlotAxis,
        PlotLimitTracker,
        PlotTelemetryFormatter,
        PlotModeOptions,
        SubPlotFactory
    ) => {

        let AXIS_DEFAULTS = [
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
        class PlotController {
          constructor(
              $scope,
              $element,
              exportImageService,
              telemetryFormatter,
              telemetryHandler,
              throttle,
              PLOT_FIXED_DURATION,
              openmct
          ) {
            let plotTelemetryFormatter =
                    new PlotTelemetryFormatter(telemetryFormatter),
                subPlotFactory =
                    new SubPlotFactory(plotTelemetryFormatter),
                cachedObjects = [],
                updater,
                lastBounds,
                lastRange,
                lastDomain,
                handle;
            let conductor = openmct.conductor;

            // Populate the scope with axis information (specifically, options
            // available for each axis.)
            const setupAxes = (metadatas) => {
                $scope.axes.forEach( (axis) => {
                    axis.updateMetadata(metadatas);
                });
            }

            // Trigger an update of a specific subplot;
            // used in a loop to update all subplots.
            const updateSubplot = (subplot) => {
                subplot.update();
            }

            // Set up available modes (stacked/overlaid), based on the
            // set of telemetry objects in this plot view.
            const setupModes = (telemetryObjects) => {
                if (cachedObjects !== telemetryObjects) {
                    cachedObjects = telemetryObjects;
                    this.modeOptions = new PlotModeOptions(
                        telemetryObjects || [],
                        subPlotFactory
                    );
                }
            }

            // Change the displayable bounds
            const setBasePanZoom = (bounds) => {
                let start = bounds.start,
                    end = bounds.end;
                if (updater) {
                    updater.setDomainBounds(start, end);
                    this.update();
                }
                lastBounds = bounds;
            }

            // Reinstantiate the plot updater (e.g. because we have a
            // new subscription.) This will clear the plot.
            const recreateUpdater = () => {
                let domain = $scope.axes[0].active.key,
                    range = $scope.axes[1].active.key,
                    duration = PLOT_FIXED_DURATION;

                updater = new PlotUpdater(handle, domain, range, duration);
                lastDomain = domain;
                lastRange = range;

                this.limitTracker = new PlotLimitTracker(handle, range);

                // Keep any externally-provided bounds
                if (lastBounds) {
                    setBasePanZoom(lastBounds);
                }
            }

            const getUpdater = () => {
                if (!updater) {
                    recreateUpdater();
                }
                return updater;
            }

            // Handle new telemetry data in this plot
            const updateValues = () => {
                this.pending = false;
                if (handle) {
                    setupModes(handle.getTelemetryObjects());
                    setupAxes(handle.getMetadata());
                    getUpdater().update();
                    this.modeOptions.getModeHandler().plotTelemetry(updater);
                    this.limitTracker.update();
                    this.update();
                }
            }

            // Display new historical data as it becomes available
            const addHistoricalData = (domainObject, series) => {
                this.pending = false;
                getUpdater().addHistorical(domainObject, series);
                this.modeOptions.getModeHandler().plotTelemetry(updater);
                this.update();
            }

            // Issue a new request for historical telemetry
            const requestTelemetry = () => {
                if (handle) {
                    handle.request({}, addHistoricalData);
                }
            }

            // Requery for data entirely
            const replot = () => {
                if (handle) {
                    updater = undefined;
                    requestTelemetry();
                }
            }

            const changeTimeOfInterest = (timeOfInterest) => {
                if (timeOfInterest !== undefined) {
                    let bounds = conductor.bounds();
                    let range = bounds.end - bounds.start;
                    $scope.toiPerc = ((timeOfInterest - bounds.start) / range) * 100;
                    $scope.toiPinned = true;
                } else {
                    $scope.toiPerc = undefined;
                    $scope.toiPinned = false;
                }
            }

            // Create a new subscription; telemetrySubscriber gets
            // to do the meaningful work here.
            const subscribe = (domainObject) => {
                if (handle) {
                    handle.unsubscribe();
                }
                handle = domainObject && telemetryHandler.handle(
                    domainObject,
                    updateValues,
                    true // Lossless
                );
                replot();

                changeTimeOfInterest(conductor.timeOfInterest());
                conductor.on("timeOfInterest", changeTimeOfInterest);
            }

            // Release the current subscription (called when scope is destroyed)
            const releaseSubscription = () => {
                if (handle) {
                    handle.unsubscribe();
                    handle = undefined;
                    conductor.off("timeOfInterest", changeTimeOfInterest);
                }
            }

            const requery = () => {
                this.pending = true;
                releaseSubscription();
                subscribe($scope.domainObject);
            }

            const updateDomainFormat = () => {
                let domainAxis = $scope.axes[0];
                plotTelemetryFormatter
                    .setDomainFormat(domainAxis.active.format);
            }

            const domainRequery = (newDomain) => {
                if (newDomain !== lastDomain) {
                    updateDomainFormat();
                    requery();
                }
            }

            const rangeRequery = (newRange) => {
                if (newRange !== lastRange) {
                    requery();
                }
            }

            // Respond to a display bounds change (requery for data)
            const changeDisplayBounds = (event, bounds, follow) => {
                //'hack' for follow mode
                if (follow === true) {
                    setBasePanZoom(bounds);
                } else {
                    let domainAxis = $scope.axes[0];

                    if (bounds.domain) {
                        domainAxis.chooseOption(bounds.domain);
                    }
                    updateDomainFormat();
                    setBasePanZoom(bounds);
                    requery();
                }
                this.setUnsynchedStatus($scope.domainObject, follow && this.isZoomed());
                changeTimeOfInterest(conductor.timeOfInterest());
            }

            this.modeOptions = new PlotModeOptions([], subPlotFactory);
            this.updateValues = updateValues;

            // Create a throttled update function
            this.scheduleUpdate = throttle( () => {
                this.modeOptions.getModeHandler().getSubPlots()
                    .forEach(updateSubplot);
            });

            this.pending = true;
            this.$element = $element;
            this.exportImageService = exportImageService;

            // Initialize axes; will get repopulated when telemetry
            // metadata becomes available.
            $scope.axes = [
                new PlotAxis("domains", [], AXIS_DEFAULTS[0]),
                new PlotAxis("ranges", [], AXIS_DEFAULTS[1])
            ];

            //Are some initialized bounds defined?
            let bounds = conductor.bounds();
            if (bounds &&
                bounds.start !== undefined &&
                bounds.end !== undefined) {
                changeDisplayBounds(undefined, conductor.bounds(), conductor.follow());
            }

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
        getColor(index) {
            return PlotPalette.getStringColor(index);
        };

        /**
         * Check if the plot is zoomed or panned out
         * of its default state (to determine whether back/unzoom
         * controls should be shown)
         * @returns {boolean} true if not in default state
         */
        isZoomed() {
            return this.modeOptions.getModeHandler().isZoomed();
        };

        /**
         * Undo the most recent pan/zoom change and restore
         * the prior state.
         */
        stepBackPanZoom() {
            return this.modeOptions.getModeHandler().stepBackPanZoom();
        };

        /**
         * Undo all pan/zoom changes and restore the initial state.
         */
        unzoom() {
            return this.modeOptions.getModeHandler().unzoom();
        };

        /**
         * Get the mode options (Stacked/Overlaid) that are applicable
         * for this plot.
         */
        getModeOptions() {
            return this.modeOptions.getModeOptions();
        };

        /**
         * Get the current mode that is applicable to this plot. This
         * will include key, name, and cssclass fields.
         */
        getMode() {
            return this.modeOptions.getMode();
        };

        /**
         * Set the mode which should be active in this plot.
         * @param mode one of the mode options returned from
         *        getModeOptions()
         */
        setMode(mode) {
            this.modeOptions.setMode(mode);
            this.updateValues();
        };

        /**
         * Get all individual plots contained within this Plot view.
         * (Multiple may be contained when in Stacked mode).
         * @returns {SubPlot[]} all subplots in this Plot view
         */
        getSubPlots() {
            return this.modeOptions.getModeHandler().getSubPlots();
        };

        /**
         * Get the CSS class to apply to the legend for this domain
         * object; this will reflect limit state.
         * @returns {string} the CSS class
         */
        getLegendClass(telemetryObject) {
            return this.limitTracker &&
                this.limitTracker.getLegendClass(telemetryObject);
        };

        /**
         * Explicitly update all plots.
         */
        update() {
            this.scheduleUpdate();
        };

        /**
         * Check if a request is pending (to show the wait spinner)
         */
        isRequestPending() {
            // Placeholder; this should reflect request state
            // when requesting historical telemetry
            return this.pending;
        };

        setUnsynchedStatus(domainObject, status) {
            if (domainObject.hasCapability('status')) {
                domainObject.getCapability('status').set('timeconductor-unsynced', status);
            }
        };

        /**
         * Export the plot to PNG
         */
        exportPNG() {
            this.hideExportButtons = true;
            this.exportImageService.exportPNG(this.$element[0], "plot.png").finally( () => {
                this.hideExportButtons = false;
            });
        };

        /**
         * Export the plot to JPG
         */
        exportJPG() {
            this.hideExportButtons = true;
            this.exportImageService.exportJPG(this.$element[0], "plot.jpg").finally( () => {
                this.hideExportButtons = false;
            });
        };
      }
        return PlotController;
    }
);

