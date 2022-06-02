<!--
 Open MCT, Copyright (c) 2014-2022, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<div
    v-if="loaded"
    class="gl-plot"
    :class="[plotLegendExpandedStateClass, plotLegendPositionClass]"
>
    <plot-legend
        v-if="!isNestedWithinAStackedPlot"
        :cursor-locked="!!lockHighlightPoint"
        :series="seriesModels"
        :highlights="highlights"
        :legend="legend"
        @legendHoverChanged="legendHoverChanged"
    />
    <div class="plot-wrapper-axis-and-display-area flex-elem grows">
        <y-axis
            v-if="seriesModels.length > 0"
            :tick-width="tickWidth"
            :single-series="seriesModels.length === 1"
            :has-same-range-value="hasSameRangeValue"
            :series-model="seriesModels[0]"
            :style="{
                left: (plotWidth - tickWidth) + 'px'
            }"
            @yKeyChanged="setYAxisKey"
            @tickWidthChanged="onTickWidthChange"
        />
        <div
            class="gl-plot-wrapper-display-area-and-x-axis"
            :style="{
                left: (plotWidth + 20) + 'px'
            }"
        >

            <div class="gl-plot-display-area has-local-controls has-cursor-guides">
                <div class="l-state-indicators">
                    <span
                        class="l-state-indicators__alert-no-lad t-object-alert t-alert-unsynced icon-alert-triangle"
                        title="This plot is not currently displaying the latest data. Reset pan/zoom to view latest data."
                    ></span>
                </div>

                <mct-ticks
                    v-show="gridLines && !options.compact"
                    :axis-type="'xAxis'"
                    :position="'right'"
                    @plotTickWidth="onTickWidthChange"
                />

                <mct-ticks
                    v-show="gridLines"
                    :axis-type="'yAxis'"
                    :position="'bottom'"
                    @plotTickWidth="onTickWidthChange"
                />

                <div
                    ref="chartContainer"
                    class="gl-plot-chart-wrapper"
                    :class="[
                        { 'alt-pressed': altPressed },
                    ]"
                >
                    <mct-chart
                        :rectangles="rectangles"
                        :highlights="highlights"
                        :show-limit-line-labels="showLimitLineLabels"
                        @plotReinitializeCanvas="initCanvas"
                    />
                </div>

                <div class="gl-plot__local-controls h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover">
                    <div
                        v-if="!options.compact"
                        class="c-button-set c-button-set--strip-h js-zoom"
                    >
                        <button
                            class="c-button icon-minus"
                            title="Zoom out"
                            @click="zoom('out', 0.2)"
                        >
                        </button>
                        <button
                            class="c-button icon-plus"
                            title="Zoom in"
                            @click="zoom('in', 0.2)"
                        >
                        </button>
                    </div>
                    <div
                        v-if="plotHistory.length && !options.compact"
                        class="c-button-set c-button-set--strip-h js-pan"
                    >
                        <button
                            class="c-button icon-arrow-left"
                            title="Restore previous pan/zoom"
                            @click="back()"
                        >
                        </button>
                        <button
                            class="c-button icon-reset"
                            title="Reset pan/zoom"
                            @click="clear()"
                        >
                        </button>
                    </div>
                    <div
                        v-if="isRealTime && !options.compact"
                        class="c-button-set c-button-set--strip-h js-pause"
                    >
                        <button
                            v-if="!isFrozen"
                            class="c-button icon-pause"
                            title="Pause incoming real-time data"
                            @click="pause()"
                        >
                        </button>
                        <button
                            v-if="isFrozen"
                            class="c-button icon-arrow-right pause-play is-paused"
                            title="Resume displaying real-time data"
                            @click="play()"
                        >
                        </button>
                    </div>
                    <div
                        v-if="isTimeOutOfSync || isFrozen"
                        class="c-button-set c-button-set--strip-h"
                    >
                        <button
                            class="c-button icon-clock"
                            title="Synchronize Time Conductor"
                            @click="showSynchronizeDialog()"
                        >
                        </button>
                    </div>
                    <div class="c-button-set c-button-set--strip-h">
                        <button
                            class="c-button icon-crosshair"
                            :class="{ 'is-active': cursorGuide }"
                            title="Toggle cursor guides"
                            @click="toggleCursorGuide"
                        >
                        </button>
                        <button
                            class="c-button"
                            :class="{ 'icon-grid-on': gridLines, 'icon-grid-off': !gridLines }"
                            title="Toggle grid lines"
                            @click="toggleGridLines"
                        >
                        </button>
                    </div>
                </div>

                <!--Cursor guides-->
                <div
                    v-show="cursorGuide"
                    ref="cursorGuideVertical"
                    class="c-cursor-guide--v js-cursor-guide--v"
                >
                </div>
                <div
                    v-show="cursorGuide"
                    ref="cursorGuideHorizontal"
                    class="c-cursor-guide--h js-cursor-guide--h"
                >
                </div>
            </div>
            <x-axis
                v-if="seriesModels.length > 0 && !options.compact"
                :series-model="seriesModels[0]"
            />

        </div>
    </div>

</div>
</template>

<script>

import eventHelpers from './lib/eventHelpers';
import LinearScale from "./LinearScale";
import PlotConfigurationModel from './configuration/PlotConfigurationModel';
import configStore from './configuration/ConfigStore';

import PlotLegend from "./legend/PlotLegend.vue";
import MctTicks from "./MctTicks.vue";
import MctChart from "./chart/MctChart.vue";
import XAxis from "./axis/XAxis.vue";
import YAxis from "./axis/YAxis.vue";
import _ from "lodash";

export default {
    components: {
        XAxis,
        YAxis,
        PlotLegend,
        MctTicks,
        MctChart
    },
    inject: ['openmct', 'domainObject', 'path'],
    props: {
        options: {
            type: Object,
            default() {
                return {
                    compact: false
                };
            }
        },
        initGridLines: {
            type: Boolean,
            default() {
                return true;
            }
        },
        initCursorGuide: {
            type: Boolean,
            default() {
                return false;
            }
        },
        plotTickWidth: {
            type: Number,
            default() {
                return 0;
            }
        },
        limitLineLabels: {
            type: Object,
            default() {
                return {};
            }
        },
        colorPalette: {
            type: Object,
            default() {
                return undefined;
            }
        }
    },
    data() {
        return {
            altPressed: false,
            highlights: [],
            lockHighlightPoint: false,
            tickWidth: 0,
            yKeyOptions: [],
            yAxisLabel: '',
            rectangles: [],
            plotHistory: [],
            selectedXKeyOption: {},
            xKeyOptions: [],
            seriesModels: [],
            legend: {},
            pending: 0,
            isRealTime: this.openmct.time.clock() !== undefined,
            loaded: false,
            isTimeOutOfSync: false,
            showLimitLineLabels: this.limitLineLabels,
            isFrozenOnMouseDown: false,
            hasSameRangeValue: true,
            cursorGuide: this.initCursorGuide,
            gridLines: this.initGridLines
        };
    },
    computed: {
        isNestedWithinAStackedPlot() {
            const isNavigatedObject = this.openmct.router.isNavigatedObject([this.domainObject].concat(this.path));

            return !isNavigatedObject && this.path.find((pathObject, pathObjIndex) => pathObject.type === 'telemetry.plot.stacked');
        },
        isFrozen() {
            return this.config.xAxis.get('frozen') === true && this.config.yAxis.get('frozen') === true;
        },
        plotLegendPositionClass() {
            return !this.isNestedWithinAStackedPlot ? `plot-legend-${this.config.legend.get('position')}` : '';
        },
        plotLegendExpandedStateClass() {
            if (this.isNestedWithinAStackedPlot) {
                return '';
            }

            if (this.config.legend.get('expanded')) {
                return 'plot-legend-expanded';
            } else {
                return 'plot-legend-collapsed';
            }
        },
        plotWidth() {
            return this.plotTickWidth || this.tickWidth;
        }
    },
    watch: {
        limitLineLabels: {
            handler(limitLineLabels) {
                this.legendHoverChanged(limitLineLabels);
            },
            deep: true
        },
        initGridLines(newGridLines) {
            this.gridLines = newGridLines;
        },
        initCursorGuide(newCursorGuide) {
            this.cursorGuide = newCursorGuide;
        }
    },
    mounted() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        eventHelpers.extend(this);
        this.updateRealTime = this.updateRealTime.bind(this);
        this.updateDisplayBounds = this.updateDisplayBounds.bind(this);
        this.setTimeContext = this.setTimeContext.bind(this);

        this.config = this.getConfig();
        this.legend = this.config.legend;

        if (this.isNestedWithinAStackedPlot) {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            this.$emit('configLoaded', configId);
        }

        this.listenTo(this.config.series, 'add', this.addSeries, this);
        this.listenTo(this.config.series, 'remove', this.removeSeries, this);

        this.config.series.models.forEach(this.addSeries, this);

        this.filterObserver = this.openmct.objects.observe(
            this.domainObject,
            'configuration.filters',
            this.updateFiltersAndResubscribe
        );
        this.removeStatusListener = this.openmct.status.observe(this.domainObject.identifier, this.updateStatus);

        this.openmct.objectViews.on('clearData', this.clearData);
        this.setTimeContext();

        this.loaded = true;

        //We're referencing the canvas elements from the mct-chart in the initialize method.
        // So we need $nextTick to ensure the component is fully mounted before we can initialize stuff.
        this.$nextTick(this.initialize);

    },
    beforeDestroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.destroy();
    },
    methods: {
        handleKeyDown(event) {
            if (event.key === 'Alt') {
                this.altPressed = true;
            }
        },
        handleKeyUp(event) {
            if (event.key === 'Alt') {
                this.altPressed = false;
            }
        },
        setTimeContext() {
            this.stopFollowingTimeContext();

            this.timeContext = this.openmct.time.getContextForView(this.path);
            this.followTimeContext();

        },
        followTimeContext() {
            this.updateDisplayBounds(this.timeContext.bounds());
            this.timeContext.on('clock', this.updateRealTime);
            this.timeContext.on('bounds', this.updateDisplayBounds);
            this.synchronized(true);
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off("clock", this.updateRealTime);
                this.timeContext.off("bounds", this.updateDisplayBounds);
            }
        },
        getConfig() {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (!config) {
                config = new PlotConfigurationModel({
                    id: configId,
                    domainObject: this.domainObject,
                    openmct: this.openmct,
                    palette: this.colorPalette,
                    callback: (data) => {
                        this.data = data;
                    }
                });
                configStore.add(configId, config);
            }

            return config;
        },
        addSeries(series, index) {
            this.$set(this.seriesModels, index, series);
            this.listenTo(series, 'change:xKey', (xKey) => {
                this.setDisplayRange(series, xKey);
            }, this);
            this.listenTo(series, 'change:yKey', () => {
                this.checkSameRangeValue();
                this.loadSeriesData(series);
            }, this);

            this.listenTo(series, 'change:interpolate', () => {
                this.loadSeriesData(series);
            }, this);

            this.checkSameRangeValue();
            this.loadSeriesData(series);
        },

        checkSameRangeValue() {
            this.hasSameRangeValue = this.seriesModels.every((model) => {
                return model.get('yKey') === this.seriesModels[0].get('yKey');
            });
        },

        removeSeries(plotSeries) {
            this.checkSameRangeValue();
            this.stopListening(plotSeries);
        },

        loadSeriesData(series) {
            //this check ensures that duplicate requests don't happen on load
            if (!this.timeContext) {
                return;
            }

            if (this.$parent.$refs.plotWrapper.offsetWidth === 0) {
                this.scheduleLoad(series);

                return;
            }

            this.offsetWidth = this.$parent.$refs.plotWrapper.offsetWidth;

            this.startLoading();
            const bounds = this.timeContext.bounds();
            const options = {
                size: this.$parent.$refs.plotWrapper.offsetWidth,
                domain: this.config.xAxis.get('key'),
                start: bounds.start,
                end: bounds.end
            };

            series.load(options)
                .then(this.stopLoading.bind(this));
        },

        loadMoreData(range, purge) {
            this.config.series.forEach(plotSeries => {
                this.offsetWidth = this.$parent.$refs.plotWrapper.offsetWidth;
                this.startLoading();
                plotSeries.load({
                    size: this.offsetWidth,
                    start: range.min,
                    end: range.max,
                    domain: this.config.xAxis.get('key')
                })
                    .then(this.stopLoading());
                if (purge) {
                    plotSeries.purgeRecordsOutsideRange(range);
                }
            });
        },

        scheduleLoad(series) {
            if (!this.scheduledLoads) {
                this.startLoading();
                this.scheduledLoads = [];
                this.checkForSize = setInterval(function () {
                    if (this.$parent.$refs.plotWrapper.offsetWidth === 0) {
                        return;
                    }

                    this.stopLoading();
                    this.scheduledLoads.forEach(this.loadSeriesData, this);
                    delete this.scheduledLoads;
                    clearInterval(this.checkForSize);
                    delete this.checkForSize;
                }.bind(this));
            }

            if (this.scheduledLoads.indexOf(series) === -1) {
                this.scheduledLoads.push(series);
            }
        },

        startLoading() {
            this.pending += 1;
            this.updateLoading();
        },

        stopLoading() {
            this.pending -= 1;
            this.updateLoading();
        },

        updateLoading() {
            this.$emit('loadingUpdated', this.pending > 0);
        },

        updateFiltersAndResubscribe(updatedFilters) {
            this.config.series.forEach(function (series) {
                series.updateFiltersAndRefresh(updatedFilters[series.keyString]);
            });
        },

        clearSeries() {
            this.config.series.forEach(function (series) {
                series.reset();
            });
        },

        compositionPathContainsId(domainObjectToClear) {
            return domainObjectToClear.composition.some((compositionIdentifier) => {
                return this.openmct.objects.areIdsEqual(compositionIdentifier, this.domainObject.identifier);
            });
        },

        clearData(domainObjectToClear) {
            // If we don't have an object to clear (global), or the IDs are equal, just clear the data.
            // If we have an object to clear, but the IDs don't match, we need to check the composition
            // of the object we've been asked to clear to see if it contains the id we're looking for.
            // This happens with stacked plots for example.
            // If we find the ID, clear the plot.
            if (!domainObjectToClear
            || this.openmct.objects.areIdsEqual(domainObjectToClear.identifier, this.domainObject.identifier)
            || this.compositionPathContainsId(domainObjectToClear)) {
                this.clearSeries();
            }
        },

        setDisplayRange(series, xKey) {
            if (this.config.series.models.length !== 1) {
                return;
            }

            const displayRange = series.getDisplayRange(xKey);
            this.config.xAxis.set('range', displayRange);
        },
        updateRealTime(clock) {
            this.isRealTime = clock !== undefined;
        },

        /**
       * Track latest display bounds.  Forces update when not receiving ticks.
       */
        updateDisplayBounds(bounds, isTick) {
            const newRange = {
                min: bounds.start,
                max: bounds.end
            };
            this.config.xAxis.set('range', newRange);
            if (!isTick) {
                this.skipReloadOnInteraction = true;
                this.clear();
                this.skipReloadOnInteraction = false;
                this.loadMoreData(newRange, true);
            } else {
                // If we're not panning or zooming (time conductor and plot x-axis times are not out of sync)
                // Drop any data that is more than 1x (max-min) before min.
                // Limit these purges to once a second.
                const isPanningOrZooming = this.isTimeOutOfSync;
                const purgeRecords = !isPanningOrZooming && (!this.nextPurge || (this.nextPurge < Date.now()));
                if (purgeRecords) {
                    const keepRange = {
                        min: newRange.min - (newRange.max - newRange.min),
                        max: newRange.max
                    };
                    this.config.series.forEach(function (series) {
                        series.purgeRecordsOutsideRange(keepRange);
                    });
                    this.nextPurge = Date.now() + 1000;
                }
            }
        },

        /**
       * Handle end of user viewport change: load more data for current display
       * bounds, and mark view as synchronized if bounds match configured bounds.
       */
        userViewportChangeEnd() {
            const xDisplayRange = this.config.xAxis.get('displayRange');
            const xRange = this.config.xAxis.get('range');

            if (!this.skipReloadOnInteraction) {
                this.loadMoreData(xDisplayRange);
            }

            this.synchronized(xRange.min === xDisplayRange.min
            && xRange.max === xDisplayRange.max);
        },

        /**
       * Getter/setter for "synchronized" value.  If not synchronized and
       * time conductor is in clock mode, will mark objects as unsynced so that
       * displays can update accordingly.
       */
        synchronized(value) {
            const isLocalClock = this.timeContext.clock();

            if (typeof value !== 'undefined') {
                this._synchronized = value;
                this.isTimeOutOfSync = value !== true;

                const isUnsynced = isLocalClock && !value;
                this.setStatus(isUnsynced);
            }

            return this._synchronized;
        },

        setStatus(isNotInSync) {
            const outOfSync = isNotInSync === true
                || this.isTimeOutOfSync === true
                || this.isFrozen === true;
            if (outOfSync === true) {
                this.openmct.status.set(this.domainObject.identifier, 'timeconductor-unsynced');
            } else {
                this.openmct.status.set(this.domainObject.identifier, '');
            }
        },

        initCanvas() {
            if (this.canvas) {
                this.stopListening(this.canvas);
            }

            this.canvas = this.$refs.chartContainer.querySelectorAll('canvas')[1];

            if (!this.options.compact) {
                this.listenTo(this.canvas, 'mousemove', this.trackMousePosition, this);
                this.listenTo(this.canvas, 'mouseleave', this.untrackMousePosition, this);
                this.listenTo(this.canvas, 'mousedown', this.onMouseDown, this);
                this.listenTo(this.canvas, 'wheel', this.wheelZoom, this);
            }
        },

        initialize() {
            this.handleWindowResize = _.debounce(this.handleWindowResize, 500);
            this.plotContainerResizeObserver = new ResizeObserver(this.handleWindowResize);
            this.plotContainerResizeObserver.observe(this.$parent.$refs.plotWrapper);

            // Setup canvas etc.
            this.xScale = new LinearScale(this.config.xAxis.get('displayRange'));
            this.yScale = new LinearScale(this.config.yAxis.get('displayRange'));

            this.pan = undefined;
            this.marquee = undefined;

            this.chartElementBounds = undefined;
            this.tickUpdate = false;

            this.initCanvas();

            this.config.yAxisLabel = this.config.yAxis.get('label');

            this.cursorGuideVertical = this.$refs.cursorGuideVertical;
            this.cursorGuideHorizontal = this.$refs.cursorGuideHorizontal;

            this.listenTo(this.config.xAxis, 'change:displayRange', this.onXAxisChange, this);
            this.listenTo(this.config.yAxis, 'change:displayRange', this.onYAxisChange, this);
        },

        onXAxisChange(displayBounds) {
            if (displayBounds) {
                this.xScale.domain(displayBounds);
            }
        },

        onYAxisChange(displayBounds) {
            if (displayBounds) {
                this.yScale.domain(displayBounds);
            }
        },

        onTickWidthChange(width, fromDifferentObject) {
            if (fromDifferentObject) {
                // Always accept tick width if it comes from a different object.
                this.tickWidth = width;
            } else {
                // Otherwise, only accept tick with if it's larger.
                const newWidth = Math.max(width, this.tickWidth);
                if (newWidth !== this.tickWidth) {
                    this.tickWidth = newWidth;
                }
            }

            const id = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            this.$emit('plotTickWidth', this.tickWidth, id);
        },

        trackMousePosition(event) {
            this.trackChartElementBounds(event);
            this.xScale.range({
                min: 0,
                max: this.chartElementBounds.width
            });
            this.yScale.range({
                min: 0,
                max: this.chartElementBounds.height
            });

            this.positionOverElement = {
                x: event.clientX - this.chartElementBounds.left,
                y: this.chartElementBounds.height
                    - (event.clientY - this.chartElementBounds.top)
            };

            this.positionOverPlot = {
                x: this.xScale.invert(this.positionOverElement.x),
                y: this.yScale.invert(this.positionOverElement.y)
            };

            if (this.cursorGuide) {
                this.updateCrosshairs(event);
            }

            this.highlightValues(this.positionOverPlot.x);
            this.updateMarquee();
            this.updatePan();
            event.preventDefault();
        },

        updateCrosshairs(event) {
            this.cursorGuideVertical.style.left = (event.clientX - this.chartElementBounds.x) + 'px';
            this.cursorGuideHorizontal.style.top = (event.clientY - this.chartElementBounds.y) + 'px';
        },

        trackChartElementBounds(event) {
            if (event.target === this.canvas) {
                this.chartElementBounds = event.target.getBoundingClientRect();
            }
        },

        onPlotHighlightSet($e, point) {
            if (point === this.highlightPoint) {
                return;
            }

            this.highlightValues(point);
        },

        highlightValues(point) {
            this.highlightPoint = point;
            // TODO: used in StackedPlotController
            this.$emit('plotHighlightUpdate', point);
            if (this.lockHighlightPoint) {
                return;
            }

            if (!point) {
                this.highlights = [];
                this.config.series.models.forEach(series => delete series.closest);
            } else {
                this.highlights = this.config.series.models
                    .filter(series => series.getSeriesData().length > 0)
                    .map(series => {
                        series.closest = series.nearestPoint(point);

                        return {
                            series: series,
                            point: series.closest
                        };
                    });
            }

            this.$emit('highlights', this.highlights);
        },

        untrackMousePosition() {
            this.positionOverElement = undefined;
            this.positionOverPlot = undefined;
            this.highlightValues();
        },

        onMouseDown(event) {
        // do not monitor drag events on browser context click
            if (event.ctrlKey) {
                return;
            }

            this.listenTo(window, 'mouseup', this.onMouseUp, this);
            this.listenTo(window, 'mousemove', this.trackMousePosition, this);

            // track frozen state on mouseDown to be read on mouseUp
            const isFrozen = this.config.xAxis.get('frozen') === true && this.config.yAxis.get('frozen') === true;
            this.isFrozenOnMouseDown = isFrozen;

            if (event.altKey) {
                return this.startPan(event);
            } else {
                return this.startMarquee(event);
            }
        },

        onMouseUp(event) {
            this.stopListening(window, 'mouseup', this.onMouseUp, this);
            this.stopListening(window, 'mousemove', this.trackMousePosition, this);

            if (this.isMouseClick()) {
                this.lockHighlightPoint = !this.lockHighlightPoint;
                this.$emit('lockHighlightPoint', this.lockHighlightPoint);
            }

            if (this.pan) {
                return this.endPan(event);
            }

            if (this.marquee) {
                this.endMarquee(event);
            }

            // resume the plot if no pan, zoom, or drag action is taken
            // needs to follow endMarquee so that plotHistory is pruned
            const isAction = Boolean(this.plotHistory.length);
            if (!isAction && !this.isFrozenOnMouseDown) {
                return this.play();
            }
        },

        isMouseClick() {
            if (!this.marquee) {
                return false;
            }

            const { start, end } = this.marquee;

            return start.x === end.x && start.y === end.y;
        },

        updateMarquee() {
            if (!this.marquee) {
                return;
            }

            this.marquee.end = this.positionOverPlot;
            this.marquee.endPixels = this.positionOverElement;
        },

        startMarquee(event) {
            this.canvas.classList.remove('plot-drag');
            this.canvas.classList.add('plot-marquee');

            this.trackMousePosition(event);
            if (this.positionOverPlot) {
                this.freeze();
                this.marquee = {
                    startPixels: this.positionOverElement,
                    endPixels: this.positionOverElement,
                    start: this.positionOverPlot,
                    end: this.positionOverPlot,
                    color: [1, 1, 1, 0.5]
                };
                this.rectangles.push(this.marquee);
                this.trackHistory();
            }
        },

        endMarquee() {
            const startPixels = this.marquee.startPixels;
            const endPixels = this.marquee.endPixels;
            const marqueeDistance = Math.sqrt(
                Math.pow(startPixels.x - endPixels.x, 2)
            + Math.pow(startPixels.y - endPixels.y, 2)
            );
            // Don't zoom if mouse moved less than 7.5 pixels.
            if (marqueeDistance > 7.5) {
                this.config.xAxis.set('displayRange', {
                    min: Math.min(this.marquee.start.x, this.marquee.end.x),
                    max: Math.max(this.marquee.start.x, this.marquee.end.x)
                });
                this.config.yAxis.set('displayRange', {
                    min: Math.min(this.marquee.start.y, this.marquee.end.y),
                    max: Math.max(this.marquee.start.y, this.marquee.end.y)
                });
                this.userViewportChangeEnd();
            } else {
                // A history entry is created by startMarquee, need to remove
                // if marquee zoom doesn't occur.
                this.plotHistory.pop();
            }

            this.rectangles = [];
            this.marquee = undefined;
        },

        zoom(zoomDirection, zoomFactor) {
            const currentXaxis = this.config.xAxis.get('displayRange');
            const currentYaxis = this.config.yAxis.get('displayRange');

            // when there is no plot data, the ranges can be undefined
            // in which case we should not perform zoom
            if (!currentXaxis || !currentYaxis) {
                return;
            }

            this.freeze();
            this.trackHistory();

            const xAxisDist = (currentXaxis.max - currentXaxis.min) * zoomFactor;
            const yAxisDist = (currentYaxis.max - currentYaxis.min) * zoomFactor;

            if (zoomDirection === 'in') {
                this.config.xAxis.set('displayRange', {
                    min: currentXaxis.min + xAxisDist,
                    max: currentXaxis.max - xAxisDist
                });

                this.config.yAxis.set('displayRange', {
                    min: currentYaxis.min + yAxisDist,
                    max: currentYaxis.max - yAxisDist
                });
            } else if (zoomDirection === 'out') {
                this.config.xAxis.set('displayRange', {
                    min: currentXaxis.min - xAxisDist,
                    max: currentXaxis.max + xAxisDist
                });

                this.config.yAxis.set('displayRange', {
                    min: currentYaxis.min - yAxisDist,
                    max: currentYaxis.max + yAxisDist
                });
            }

            this.userViewportChangeEnd();
        },

        wheelZoom(event) {
            const ZOOM_AMT = 0.1;
            event.preventDefault();

            if (event.wheelDelta === undefined
                || !this.positionOverPlot) {
                return;
            }

            let xDisplayRange = this.config.xAxis.get('displayRange');
            let yDisplayRange = this.config.yAxis.get('displayRange');

            // when there is no plot data, the ranges can be undefined
            // in which case we should not perform zoom
            if (!xDisplayRange || !yDisplayRange) {
                return;
            }

            this.freeze();
            window.clearTimeout(this.stillZooming);

            let xAxisDist = (xDisplayRange.max - xDisplayRange.min);
            let yAxisDist = (yDisplayRange.max - yDisplayRange.min);
            let xDistMouseToMax = xDisplayRange.max - this.positionOverPlot.x;
            let xDistMouseToMin = this.positionOverPlot.x - xDisplayRange.min;
            let yDistMouseToMax = yDisplayRange.max - this.positionOverPlot.y;
            let yDistMouseToMin = this.positionOverPlot.y - yDisplayRange.min;
            let xAxisMaxDist = xDistMouseToMax / xAxisDist;
            let xAxisMinDist = xDistMouseToMin / xAxisDist;
            let yAxisMaxDist = yDistMouseToMax / yAxisDist;
            let yAxisMinDist = yDistMouseToMin / yAxisDist;

            let plotHistoryStep;

            if (!plotHistoryStep) {
                plotHistoryStep = {
                    x: xDisplayRange,
                    y: yDisplayRange
                };
            }

            if (event.wheelDelta < 0) {

                this.config.xAxis.set('displayRange', {
                    min: xDisplayRange.min + ((xAxisDist * ZOOM_AMT) * xAxisMinDist),
                    max: xDisplayRange.max - ((xAxisDist * ZOOM_AMT) * xAxisMaxDist)
                });

                this.config.yAxis.set('displayRange', {
                    min: yDisplayRange.min + ((yAxisDist * ZOOM_AMT) * yAxisMinDist),
                    max: yDisplayRange.max - ((yAxisDist * ZOOM_AMT) * yAxisMaxDist)
                });
            } else if (event.wheelDelta >= 0) {

                this.config.xAxis.set('displayRange', {
                    min: xDisplayRange.min - ((xAxisDist * ZOOM_AMT) * xAxisMinDist),
                    max: xDisplayRange.max + ((xAxisDist * ZOOM_AMT) * xAxisMaxDist)
                });

                this.config.yAxis.set('displayRange', {
                    min: yDisplayRange.min - ((yAxisDist * ZOOM_AMT) * yAxisMinDist),
                    max: yDisplayRange.max + ((yAxisDist * ZOOM_AMT) * yAxisMaxDist)
                });
            }

            this.stillZooming = window.setTimeout(function () {
                this.plotHistory.push(plotHistoryStep);
                plotHistoryStep = undefined;
                this.userViewportChangeEnd();
            }.bind(this), 250);
        },

        startPan(event) {
            this.canvas.classList.add('plot-drag');
            this.canvas.classList.remove('plot-marquee');

            this.trackMousePosition(event);
            this.freeze();
            this.pan = {
                start: this.positionOverPlot
            };
            event.preventDefault();
            this.trackHistory();

            return false;
        },

        updatePan() {
        // calculate offset between points.  Apply that offset to viewport.
            if (!this.pan) {
                return;
            }

            const dX = this.pan.start.x - this.positionOverPlot.x;
            const dY = this.pan.start.y - this.positionOverPlot.y;
            const xRange = this.config.xAxis.get('displayRange');
            const yRange = this.config.yAxis.get('displayRange');

            this.config.xAxis.set('displayRange', {
                min: xRange.min + dX,
                max: xRange.max + dX
            });
            this.config.yAxis.set('displayRange', {
                min: yRange.min + dY,
                max: yRange.max + dY
            });
        },

        trackHistory() {
            this.plotHistory.push({
                x: this.config.xAxis.get('displayRange'),
                y: this.config.yAxis.get('displayRange')
            });
        },

        endPan() {
            this.pan = undefined;
            this.userViewportChangeEnd();
        },

        freeze() {
            this.config.yAxis.set('frozen', true);
            this.config.xAxis.set('frozen', true);
            this.setStatus();
        },

        clear() {
            this.config.yAxis.set('frozen', false);
            this.config.xAxis.set('frozen', false);
            this.setStatus();
            this.plotHistory = [];
            this.userViewportChangeEnd();
        },

        back() {
            const previousAxisRanges = this.plotHistory.pop();
            if (this.plotHistory.length === 0) {
                this.clear();

                return;
            }

            this.config.xAxis.set('displayRange', previousAxisRanges.x);
            this.config.yAxis.set('displayRange', previousAxisRanges.y);
            this.userViewportChangeEnd();
        },

        setYAxisKey(yKey) {
            this.config.series.models[0].set('yKey', yKey);
        },

        pause() {
            this.freeze();
        },

        play() {
            this.clear();
        },

        showSynchronizeDialog() {
            const isLocalClock = this.timeContext.clock();
            if (isLocalClock !== undefined) {
                const message = `
                This action will change the Time Conductor to Fixed Timespan mode with this plot view's current time bounds.
                Do you want to continue?
            `;

                let dialog = this.openmct.overlays.dialog({
                    title: 'Synchronize Time Conductor',
                    iconClass: 'alert',
                    size: 'fit',
                    message: message,
                    buttons: [
                        {
                            label: 'OK',
                            callback: () => {
                                dialog.dismiss();
                                this.synchronizeTimeConductor();
                            }
                        },
                        {
                            label: 'Cancel',
                            callback: () => {
                                dialog.dismiss();
                            }
                        }
                    ]
                });
            } else {
                this.openmct.notifications.alert('Time conductor bounds have changed.');
                this.synchronizeTimeConductor();
            }
        },

        synchronizeTimeConductor() {
            this.timeContext.stopClock();
            const range = this.config.xAxis.get('displayRange');
            this.timeContext.bounds({
                start: range.min,
                end: range.max
            });
            this.isTimeOutOfSync = false;
        },

        destroy() {
            configStore.deleteStore(this.config.id);

            this.stopListening();

            if (this.checkForSize) {
                clearInterval(this.checkForSize);
                delete this.checkForSize;
            }

            if (this.filterObserver) {
                this.filterObserver();
            }

            if (this.removeStatusListener) {
                this.removeStatusListener();
            }

            this.plotContainerResizeObserver.disconnect();

            this.stopFollowingTimeContext();
            this.openmct.objectViews.off('clearData', this.clearData);
        },
        updateStatus(status) {
            this.$emit('statusUpdated', status);
        },
        handleWindowResize() {
            if (this.$parent.$refs.plotWrapper
                && (this.offsetWidth !== this.$parent.$refs.plotWrapper.offsetWidth)) {
                this.offsetWidth = this.$parent.$refs.plotWrapper.offsetWidth;
                this.config.series.models.forEach(this.loadSeriesData, this);
            }
        },
        legendHoverChanged(data) {
            this.showLimitLineLabels = data;
        },
        toggleCursorGuide() {
            this.cursorGuide = !this.cursorGuide;
            this.$emit('cursorGuide', this.cursorGuide);
        },
        toggleGridLines() {
            this.gridLines = !this.gridLines;
            this.$emit('gridLines', this.gridLines);
        }
    }
};

</script>
