<!--
 Open MCT, Copyright (c) 2014-2020, United States Government
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
<!--plot-legend-{{legend.get('position')}}-->
<div class="gl-plot"
     :class="{'plot-legend-expanded': legend.get('expanded'), 'plot-legend-collapsed': !legend.get('expanded')}"
>
    <!--    <plot-legend :cursor-locked="!!lockHighlightPoint"-->
    <!--                 :show-highlights="!!highlights.length"-->
    <!--                 :series="series"-->
    <!--                 :legend="legend"-->
    <!--    />-->
    <div class="plot-wrapper-axis-and-display-area flex-elem grows">
        <div class="gl-plot-axis-area gl-plot-y has-local-controls"
             :style="{
                 width: (tickWidth + 20) + 'px'
             }"
        >

            <div class="gl-plot-label gl-plot-y-label"
                 :class="{'icon-gear': (yKeyOptions.length > 1 && series.length === 1)}"
            >{{ yAxis.get('label') }}
            </div>

            <select v-if="yKeyOptions.length > 1 && series.length === 1"
                    v-model="yAxisLabel"
                    class="gl-plot-y-label__select local-controls--hidden"
                    @change="toggleYAxisLabel(event)"
            >
                <option v-for="(option, index) in yKeyOptions"
                        :key="index"
                        :value="option.name"
                        :selected="option.name === yAxisLabel"
                >
                    {{ option.name }}
                </option>
            </select>

            <mct-ticks :axis="yAxis"
                       :position="'top'"
                       @plotTickWidth="onTickWidthChange"
            />
        </div>
        <div class="gl-plot-wrapper-display-area-and-x-axis"
             :style="{
                 left: (tickWidth + 20) + 'px'
             }"
        >

            <div class="gl-plot-display-area has-local-controls has-cursor-guides">
                <div class="l-state-indicators">
                    <span class="l-state-indicators__alert-no-lad t-object-alert t-alert-unsynced icon-alert-triangle"
                          title="This plot is not currently displaying the latest data. Reset pan/zoom to view latest data."
                    ></span>
                </div>

                <mct-ticks v-show="gridLines"
                           :axis="xAxis"
                           :position="'right'"
                           @plotTickWidth="onTickWidthChange"
                />

                <mct-ticks v-show="gridLines"
                           :axis="yAxis"
                           :position="'bottom'"
                           @plotTickWidth="onTickWidthChange"
                />

                <div ref="chartContainer"
                     class="gl-plot-chart-wrapper"
                >
                    <mct-chart :series-config="seriesConfig"
                               :rectangles="rectangles"
                               :highlights="highlights"
                               @plotReinitializeCanvas="initCanvas"
                    />
                </div>

                <div class="gl-plot__local-controls h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover">
                    <div class="c-button-set c-button-set--strip-h">
                        <button class="c-button icon-minus"
                                title="Zoom out"
                                @click="zoom('out', 0.2)"
                        >
                        </button>
                        <button class="c-button icon-plus"
                                title="Zoom in"
                                @click="zoom('in', 0.2)"
                        >
                        </button>
                    </div>
                    <div class="c-button-set c-button-set--strip-h"
                         :disabled="!plotHistory.length"
                    >
                        <button class="c-button icon-arrow-left"
                                title="Restore previous pan/zoom"
                                @click="back()"
                        >
                        </button>
                        <button class="c-button icon-reset"
                                title="Reset pan/zoom"
                                @click="clear()"
                        >
                        </button>
                    </div>
                </div>

                <!--Cursor guides-->
                <div v-show="cursorGuide"
                     ref="cursorGuideVertical"
                     class="c-cursor-guide--v js-cursor-guide--v"
                >
                </div>
                <div v-show="cursorGuide"
                     ref="cursorGuideHorizontal"
                     class="c-cursor-guide--h js-cursor-guide--h"
                >
                </div>
            </div>

            <div class="gl-plot-axis-area gl-plot-x has-local-controls">
                <mct-ticks :axis="xAxis"
                           :position="'left'"
                           @plotTickWidth="onTickWidthChange"
                />

                <div
                    class="gl-plot-label gl-plot-x-label"
                    :class="{'icon-gear': isEnabledXKeyToggle()}"
                >
                    {{ xAxis.get('label') }}
                </div>

                <select
                    v-show="isEnabledXKeyToggle()"
                    v-model="selectedXKeyOption.key"
                    class="gl-plot-x-label__select local-controls--hidden"
                    @change="toggleXKeyOption('{{selectedXKeyOption.key}}', series[0])"
                >
                    <option v-for="option in xKeyOptions"
                            :key="option.key"
                            :value="option.key"
                    >{{ option.name }}
                    </option>
                </select>
            </div>

        </div>
    </div>

</div>
</template>

<script>

import eventHelpers from './lib/eventHelpers';
import LinearScale from "./LinearScale";
import PlotLegend from "./legend/PlotLegend.vue";
import MctTicks from "./MctTicks.vue";
import MctChart from "./chart/MctChart.vue";

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        PlotLegend,
        MctTicks,
        MctChart
    },
    props: {
        seriesConfig: {
            type: Object,
            default() {
                return {
                    models: []
                };
            }
        },
        xAxis: {
            type: Object,
            default() {
                return {};
            }
        },
        yAxis: {
            type: Object,
            default() {
                return {};
            }
        },
        legend: {
            type: Object,
            default() {
                return {};
            }
        },
        gridLines: {
            type: Boolean,
            default() {
                return true;
            }
        },
        cursorGuide: {
            type: Boolean,
            default() {
                return true;
            }
        }
    },
    data() {
        return {
            highlights: [],
            lockHighlightPoint: false,
            tickWidth: 0,
            yKeyOptions: [],
            yAxisLabel: '',
            rectangles: [],
            plotHistory: [],
            selectedXKeyOption: {},
            xKeyOptions: [],
            series: []
        };
    },
    watch: {
        gridLines(newGridLines) {
            this.setGridLinesVisibility(newGridLines);
        },
        cursorGuide(newCursorGuide) {
            this.setCursorGuideVisibility(newCursorGuide);
        }
        // xAxis: {
        //     handler: 'onXAxisChange',
        //     deep: true
        // }
    },
    mounted() {
        eventHelpers.extend(this);
        this.series = this.seriesConfig.series.models;
        this.xScale = new LinearScale(this.xAxis.get('displayRange'));
        this.yScale = new LinearScale(this.yAxis.get('displayRange'));

        this.pan = undefined;
        this.marquee = undefined;

        this.chartElementBounds = undefined;
        this.tickUpdate = false;

        //TODO: do this the Vue way
        // this.listenTo(this, 'plot:clearHistory', this.clear, this);
        this.openmct.time.on('timeSystem', this.updateTimeSystem);

        this.initialize();
    },
    methods: {

        initCanvas() {
            if (this.canvas) {
                this.stopListening(this.canvas);
            }

            //TODO: Should this be an array or the mainCanvas?
            this.canvas = this.$refs.chartContainer.querySelectorAll('canvas')[1];

            this.listenTo(this.canvas, 'mousemove', this.trackMousePosition, this);
            this.listenTo(this.canvas, 'mouseleave', this.untrackMousePosition, this);
            this.listenTo(this.canvas, 'mousedown', this.onMouseDown, this);
            this.listenTo(this.canvas, 'wheel', this.wheelZoom, this);
        },

        initialize() {
            //TODO: Should this be an array or the mainCanvas?
            this.canvas = this.$refs.chartContainer.querySelectorAll('canvas')[1];

            this.listenTo(this.canvas, 'mousemove', this.trackMousePosition, this);
            this.listenTo(this.canvas, 'mouseleave', this.untrackMousePosition, this);
            this.listenTo(this.canvas, 'mousedown', this.onMouseDown, this);
            this.listenTo(this.canvas, 'wheel', this.wheelZoom, this);

            this.yAxisLabel = this.yAxis.get('label');

            this.cursorGuideVertical = this.$refs.cursorGuideVertical;
            this.cursorGuideHorizontal = this.$refs.cursorGuideHorizontal;

            //TODO: Need to handle this the Vue way
            // this.listenTo(this, 'plot:highlight:set', this.onPlotHighlightSet, this);

            this.setUpXAxisOptions();
            this.setUpYAxisOptions();
        },

        setUpXAxisOptions() {
            const xAxisKey = this.xAxis.get('key');

            if (this.series.length === 1) {
                let metadata = this.series[0].metadata;

                this.xKeyOptions = metadata
                    .valuesForHints(['domain'])
                    .map(function (o) {
                        return {
                            name: o.name,
                            key: o.key
                        };
                    });
                this.selectedXKeyOption = this.getXKeyOption(xAxisKey);
            }
        },

        setUpYAxisOptions() {
            if (this.series.length === 1) {
                let metadata = this.series[0].metadata;

                this.yKeyOptions = metadata
                    .valuesForHints(['range'])
                    .map(function (o) {
                        return {
                            name: o.name,
                            key: o.key
                        };
                    });

                //  set yAxisLabel if none is set yet
                if (this.yAxisLabel === 'none') {
                    let yKey = this.series[0].model.yKey;
                    let yKeyModel = this.yKeyOptions.filter(o => o.key === yKey)[0];

                    this.yAxisLabel = yKeyModel.name;
                }
            } else {
                this.yKeyOptions = undefined;
            }
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

        onTickWidthChange(width) {
            //TODO: check domain object of sender
            // if (event.targetScope.domainObject !== this.domainObject) {
            //     // Always accept tick width if it comes from a different object.
            //     this.tickWidth = width;
            // } else {
            // Otherwise, only accept tick with if it's larger.
            const newWidth = Math.max(width, this.tickWidth);
            if (newWidth !== this.tickWidth) {
                this.tickWidth = newWidth;
                //TODO: Do we need this?
                // this.$scope.$digest();
            }
            // }
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
            //TODO: Do we need this?
            // this.$scope.$digest();
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
                this.series.forEach(series => delete series.closest);
            } else {
                this.highlights = this.series
                    .filter(series => series.data.length > 0)
                    .map(series => {
                        series.closest = series.nearestPoint(point);

                        return {
                            series: series,
                            point: series.closest
                        };
                    });
            }

            //TODO: Do we need this?
            // this.$scope.$digest();
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
            }

            if (this.pan) {
                return this.endPan(event);
            }

            if (this.marquee) {
                return this.endMarquee(event);
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
                this.xAxis.set('displayRange', {
                    min: Math.min(this.marquee.start.x, this.marquee.end.x),
                    max: Math.max(this.marquee.start.x, this.marquee.end.x)
                });
                this.yAxis.set('displayRange', {
                    min: Math.min(this.marquee.start.y, this.marquee.end.y),
                    max: Math.max(this.marquee.start.y, this.marquee.end.y)
                });
                this.$emit('userViewportChangeEnd');
            } else {
                // A history entry is created by startMarquee, need to remove
                // if marquee zoom doesn't occur.
                this.plotHistory.pop();
            }

            this.rectangles = [];
            this.marquee = undefined;
        },

        zoom(zoomDirection, zoomFactor) {
            const currentXaxis = this.xAxis.get('displayRange');
            const currentYaxis = this.yAxis.get('displayRange');

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
                this.xAxis.set('displayRange', {
                    min: currentXaxis.min + xAxisDist,
                    max: currentXaxis.max - xAxisDist
                });

                this.yAxis.set('displayRange', {
                    min: currentYaxis.min + yAxisDist,
                    max: currentYaxis.max - yAxisDist
                });
            } else if (zoomDirection === 'out') {
                this.xAxis.set('displayRange', {
                    min: currentXaxis.min - xAxisDist,
                    max: currentXaxis.max + xAxisDist
                });

                this.yAxis.set('displayRange', {
                    min: currentYaxis.min - yAxisDist,
                    max: currentYaxis.max + yAxisDist
                });
            }

            this.$emit('userViewportChangeEnd');
        },

        wheelZoom(event) {
            const ZOOM_AMT = 0.1;
            event.preventDefault();

            if (!this.positionOverPlot) {
                return;
            }

            let xDisplayRange = this.xAxis.get('displayRange');
            let yDisplayRange = this.yAxis.get('displayRange');

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

                this.xAxis.set('displayRange', {
                    min: xDisplayRange.min + ((xAxisDist * ZOOM_AMT) * xAxisMinDist),
                    max: xDisplayRange.max - ((xAxisDist * ZOOM_AMT) * xAxisMaxDist)
                });

                this.yAxis.set('displayRange', {
                    min: yDisplayRange.min + ((yAxisDist * ZOOM_AMT) * yAxisMinDist),
                    max: yDisplayRange.max - ((yAxisDist * ZOOM_AMT) * yAxisMaxDist)
                });
            } else if (event.wheelDelta >= 0) {

                this.xAxis.set('displayRange', {
                    min: xDisplayRange.min - ((xAxisDist * ZOOM_AMT) * xAxisMinDist),
                    max: xDisplayRange.max + ((xAxisDist * ZOOM_AMT) * xAxisMaxDist)
                });

                this.yAxis.set('displayRange', {
                    min: yDisplayRange.min - ((yAxisDist * ZOOM_AMT) * yAxisMinDist),
                    max: yDisplayRange.max + ((yAxisDist * ZOOM_AMT) * yAxisMaxDist)
                });
            }

            this.stillZooming = window.setTimeout(function () {
                this.plotHistory.push(plotHistoryStep);
                plotHistoryStep = undefined;
                this.$emit('userViewportChangeEnd');
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
            const xRange = this.xAxis.get('displayRange');
            const yRange = this.yAxis.get('displayRange');

            this.xAxis.set('displayRange', {
                min: xRange.min + dX,
                max: xRange.max + dX
            });
            this.yAxis.set('displayRange', {
                min: yRange.min + dY,
                max: yRange.max + dY
            });
        },

        trackHistory() {
            this.plotHistory.push({
                x: this.xAxis.get('displayRange'),
                y: this.yAxis.get('displayRange')
            });
        },

        endPan() {
            this.pan = undefined;
            this.$emit('userViewportChangeEnd');
        },

        freeze() {
            this.yAxis.set('frozen', true);
            this.xAxis.set('frozen', true);
        },

        clear() {
            this.yAxis.set('frozen', false);
            this.xAxis.set('frozen', false);
            this.plotHistory = [];
            this.$emit('userViewportChangeEnd');
        },

        back() {
            const previousAxisRanges = this.plotHistory.pop();
            if (this.plotHistory.length === 0) {
                this.clear();

                return;
            }

            this.xAxis.set('displayRange', previousAxisRanges.x);
            this.yAxis.set('displayRange', previousAxisRanges.y);
            this.$emit('userViewportChangeEnd');
        },

        destroy() {
            this.stopListening();
        },

        setCursorGuideVisibility(cursorGuide) {
            this.cursorGuide = cursorGuide === true;
        },

        setGridLinesVisibility(gridLines) {
            this.gridLines = gridLines === true;
        },

        getXKeyOption(key) {
            return this.xKeyOptions.find(option => option.key === key);
        },

        isEnabledXKeyToggle() {
            const isSinglePlot = this.xKeyOptions && this.xKeyOptions.length > 1 && this.series.length === 1;
            const isFrozen = this.xAxis.get('frozen');
            const inRealTimeMode = this.openmct.time.clock();

            return isSinglePlot && !isFrozen && !inRealTimeMode;
        },

        toggleXKeyOption(lastXKey, series) {
            const selectedXKey = this.selectedXKeyOption.key;
            const dataForSelectedXKey = series.data
                ? series.data[0][selectedXKey]
                : undefined;

            if (dataForSelectedXKey !== undefined) {
                this.xAxis.set('key', selectedXKey);
            } else {
                this.openmct.notifications.error('Cannot change x-axis view as no data exists for this view type.');
                this.selectedXKeyOption.key = lastXKey;
            }
        },

        toggleYAxisLabel(label, options, series) {
            let yAxisObject = options.filter(o => o.name === label)[0];

            if (yAxisObject) {
                series.emit('change:yKey', yAxisObject.key);
                this.yAxis.set('label', label);
                this.yAxisLabel = label;
            }
        },
        updateTimeSystem(timeSystem) {
            const xAxisKey = this.xAxis.get('key');
            if (xAxisKey !== timeSystem.key) {
                this.setUpXAxisOptions();
            }
        }
    }
};

</script>
