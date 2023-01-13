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

<!-- eslint-disable vue/no-v-html -->

<template>
<div class="gl-plot-chart-area">
    <span v-html="canvasTemplate"></span>
    <span v-html="canvasTemplate"></span>
    <div
        ref="limitArea"
        class="js-limit-area"
    ></div>
</div>
</template>

<script>

import eventHelpers from "../lib/eventHelpers";
import { DrawLoader } from '../draw/DrawLoader';
import MCTChartLineLinear from './MCTChartLineLinear';
import MCTChartLineStepAfter from './MCTChartLineStepAfter';
import MCTChartPointSet from './MCTChartPointSet';
import MCTChartAlarmPointSet from './MCTChartAlarmPointSet';
import MCTChartAlarmLineSet from "./MCTChartAlarmLineSet";
import configStore from "../configuration/ConfigStore";
import PlotConfigurationModel from "../configuration/PlotConfigurationModel";
import LimitLine from "./LimitLine.vue";
import LimitLabel from "./LimitLabel.vue";
import Vue from 'vue';

const MARKER_SIZE = 6.0;
const HIGHLIGHT_SIZE = MARKER_SIZE * 2.0;
const CLEARANCE = 15;

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        rectangles: {
            type: Array,
            default() {
                return [];
            }
        },
        highlights: {
            type: Array,
            default() {
                return [];
            }
        },
        showLimitLineLabels: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            canvasTemplate: '<canvas style="position: absolute; background: none; width: 100%; height: 100%;"></canvas>'
        };
    },
    watch: {
        highlights() {
            this.scheduleDraw();
        },
        rectangles() {
            this.scheduleDraw();
        },
        showLimitLineLabels() {
            this.drawLimitLines();
        }
    },
    mounted() {
        eventHelpers.extend(this);
        this.config = this.getConfig();
        this.isDestroyed = false;
        this.lines = [];
        this.limitLines = [];
        this.pointSets = [];
        this.alarmSets = [];
        const yAxisId = this.config.yAxis.get('id');
        this.offset = {
            [yAxisId]: {}
        };
        this.listenTo(this.config.yAxis, 'change:key', this.resetOffsetAndSeriesDataForYAxis.bind(this, yAxisId), this);
        this.listenTo(this.config.yAxis, 'change', this.updateLimitsAndDraw);
        if (this.config.additionalYAxes.length) {
            this.config.additionalYAxes.forEach(yAxis => {
                const id = yAxis.get('id');
                this.offset[id] = {};
                this.listenTo(yAxis, 'change', this.updateLimitsAndDraw);
                this.listenTo(yAxis, 'change:key', this.resetOffsetAndSeriesDataForYAxis.bind(this, id), this);
            });
        }

        this.seriesElements = new WeakMap();
        this.seriesLimits = new WeakMap();

        let canvasEls = this.$parent.$refs.chartContainer.querySelectorAll("canvas");
        const mainCanvas = canvasEls[1];
        const overlayCanvas = canvasEls[0];
        if (this.initializeCanvas(mainCanvas, overlayCanvas)) {
            this.draw();
        }

        this.listenTo(this.config.series, 'add', this.onSeriesAdd, this);
        this.listenTo(this.config.series, 'remove', this.onSeriesRemove, this);

        this.listenTo(this.config.xAxis, 'change', this.updateLimitsAndDraw);
        this.config.series.forEach(this.onSeriesAdd, this);
        this.$emit('chartLoaded');
    },
    beforeDestroy() {
        this.destroy();
    },
    methods: {
        getConfig() {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (!config) {
                config = new PlotConfigurationModel({
                    id: configId,
                    domainObject: this.domainObject,
                    openmct: this.openmct
                });
                configStore.add(configId, config);
            }

            return config;
        },
        reDraw(mode, o, series) {
            this.changeInterpolate(mode, o, series);
            this.changeMarkers(mode, o, series);
            this.changeAlarmMarkers(mode, o, series);
            this.changeLimitLines(mode, o, series);
        },
        onSeriesAdd(series) {
            this.listenTo(series, 'change:xKey', this.reDraw, this);
            this.listenTo(series, 'change:interpolate', this.changeInterpolate, this);
            this.listenTo(series, 'change:markers', this.changeMarkers, this);
            this.listenTo(series, 'change:alarmMarkers', this.changeAlarmMarkers, this);
            this.listenTo(series, 'change:limitLines', this.changeLimitLines, this);
            this.listenTo(series, 'change', this.scheduleDraw);
            this.listenTo(series, 'add', this.scheduleDraw);
            this.makeChartElement(series);
            this.makeLimitLines(series);
        },
        changeInterpolate(mode, o, series) {
            if (mode === o) {
                return;
            }

            const elements = this.seriesElements.get(series);
            elements.lines.forEach(function (line) {
                this.lines.splice(this.lines.indexOf(line), 1);
                line.destroy();
            }, this);
            elements.lines = [];

            const newLine = this.lineForSeries(series);
            if (newLine) {
                elements.lines.push(newLine);
                this.lines.push(newLine);
            }
        },
        changeAlarmMarkers(mode, o, series) {
            if (mode === o) {
                return;
            }

            const elements = this.seriesElements.get(series);
            if (elements.alarmSet) {
                elements.alarmSet.destroy();
                this.alarmSets.splice(this.alarmSets.indexOf(elements.alarmSet), 1);
            }

            elements.alarmSet = this.alarmPointSetForSeries(series);
            if (elements.alarmSet) {
                this.alarmSets.push(elements.alarmSet);
            }
        },
        changeMarkers(mode, o, series) {
            if (mode === o) {
                return;
            }

            const elements = this.seriesElements.get(series);
            elements.pointSets.forEach(function (pointSet) {
                this.pointSets.splice(this.pointSets.indexOf(pointSet), 1);
                pointSet.destroy();
            }, this);
            elements.pointSets = [];

            const pointSet = this.pointSetForSeries(series);
            if (pointSet) {
                elements.pointSets.push(pointSet);
                this.pointSets.push(pointSet);
            }
        },
        changeLimitLines(mode, o, series) {
            if (mode === o) {
                return;
            }

            this.makeLimitLines(series);
            this.updateLimitsAndDraw();
        },
        onSeriesRemove(series) {
            this.stopListening(series);
            this.removeChartElement(series);
            this.scheduleDraw();
        },
        destroy() {
            this.isDestroyed = true;
            this.stopListening();
            this.lines.forEach(line => line.destroy());
            this.limitLines.forEach(line => line.destroy());
            DrawLoader.releaseDrawAPI(this.drawAPI);
        },
        resetOffsetAndSeriesDataForYAxis(yAxisId) {
            delete this.offset[yAxisId].x;
            delete this.offset[yAxisId].y;
            delete this.offset[yAxisId].xVal;
            delete this.offset[yAxisId].yVal;
            delete this.offset[yAxisId].xKey;
            delete this.offset[yAxisId].yKey;

            const lines = this.lines.filter(this.matchByYAxisId.bind(this, yAxisId));
            lines.forEach(function (line) {
                line.reset();
            });
            const limitLines = this.limitLines.filter(this.matchByYAxisId.bind(this, yAxisId));
            limitLines.forEach(function (line) {
                line.reset();
            });
            const pointSets = this.pointSets.filter(this.matchByYAxisId.bind(this, yAxisId));
            pointSets.forEach(function (pointSet) {
                pointSet.reset();
            });
        },
        setOffset(offsetPoint, index, series) {
            const mainYAxisId = this.config.yAxis.get('id');
            const yAxisId = series.get('yAxisId') || mainYAxisId;
            if (this.offset[yAxisId].x && this.offset[yAxisId].y) {
                return;
            }

            const offsets = {
                x: series.getXVal(offsetPoint),
                y: series.getYVal(offsetPoint)
            };

            this.offset[yAxisId].x = function (x) {
                return x - offsets.x;
            }.bind(this);
            this.offset[yAxisId].y = function (y) {
                return y - offsets.y;
            }.bind(this);
            this.offset[yAxisId].xVal = function (point, pSeries) {
                return this.offset[yAxisId].x(pSeries.getXVal(point));
            }.bind(this);
            this.offset[yAxisId].yVal = function (point, pSeries) {
                return this.offset[yAxisId].y(pSeries.getYVal(point));
            }.bind(this);
        },

        initializeCanvas(canvas, overlay) {
            this.canvas = canvas;
            this.overlay = overlay;
            this.drawAPI = DrawLoader.getDrawAPI(canvas, overlay);
            if (this.drawAPI) {
                this.listenTo(this.drawAPI, 'error', this.fallbackToCanvas, this);
            }

            return Boolean(this.drawAPI);
        },
        fallbackToCanvas() {
            this.stopListening(this.drawAPI);
            DrawLoader.releaseDrawAPI(this.drawAPI);
            // Have to throw away the old canvas elements and replace with new
            // canvas elements in order to get new drawing contexts.
            const div = document.createElement('div');
            div.innerHTML = this.canvasTemplate + this.canvasTemplate;
            const mainCanvas = div.querySelectorAll("canvas")[1];
            const overlayCanvas = div.querySelectorAll("canvas")[0];
            this.canvas.parentNode.replaceChild(mainCanvas, this.canvas);
            this.canvas = mainCanvas;
            this.overlay.parentNode.replaceChild(overlayCanvas, this.overlay);
            this.overlay = overlayCanvas;
            this.drawAPI = DrawLoader.getFallbackDrawAPI(this.canvas, this.overlay);
            this.$emit('plotReinitializeCanvas');
        },
        removeChartElement(series) {
            const elements = this.seriesElements.get(series);

            elements.lines.forEach(function (line) {
                this.lines.splice(this.lines.indexOf(line), 1);
                line.destroy();
            }, this);
            elements.pointSets.forEach(function (pointSet) {
                this.pointSets.splice(this.pointSets.indexOf(pointSet), 1);
                pointSet.destroy();
            }, this);
            if (elements.alarmSet) {
                elements.alarmSet.destroy();
                this.alarmSets.splice(this.alarmSets.indexOf(elements.alarmSet), 1);
            }

            this.seriesElements.delete(series);

            this.clearLimitLines(series);
        },
        lineForSeries(series) {
            const mainYAxisId = this.config.yAxis.get('id');
            const yAxisId = series.get('yAxisId') || mainYAxisId;
            let offset = this.offset[yAxisId];

            if (series.get('interpolate') === 'linear') {
                return new MCTChartLineLinear(
                    series,
                    this,
                    offset
                );
            }

            if (series.get('interpolate') === 'stepAfter') {
                return new MCTChartLineStepAfter(
                    series,
                    this,
                    offset
                );
            }
        },
        limitLineForSeries(series) {
            const mainYAxisId = this.config.yAxis.get('id');
            const yAxisId = series.get('yAxisId') || mainYAxisId;
            let offset = this.offset[yAxisId];

            return new MCTChartAlarmLineSet(
                series,
                this,
                offset,
                this.openmct.time.bounds()
            );
        },
        pointSetForSeries(series) {
            const mainYAxisId = this.config.yAxis.get('id');
            const yAxisId = series.get('yAxisId') || mainYAxisId;
            let offset = this.offset[yAxisId];

            if (series.get('markers')) {
                return new MCTChartPointSet(
                    series,
                    this,
                    offset
                );
            }
        },
        alarmPointSetForSeries(series) {
            const mainYAxisId = this.config.yAxis.get('id');
            const yAxisId = series.get('yAxisId') || mainYAxisId;
            let offset = this.offset[yAxisId];

            if (series.get('alarmMarkers')) {
                return new MCTChartAlarmPointSet(
                    series,
                    this,
                    offset
                );
            }
        },
        makeChartElement(series) {
            const elements = {
                lines: [],
                pointSets: [],
                limitLines: []
            };

            const line = this.lineForSeries(series);
            if (line) {
                elements.lines.push(line);
                this.lines.push(line);
            }

            const pointSet = this.pointSetForSeries(series);
            if (pointSet) {
                elements.pointSets.push(pointSet);
                this.pointSets.push(pointSet);
            }

            elements.alarmSet = this.alarmPointSetForSeries(series);
            if (elements.alarmSet) {
                this.alarmSets.push(elements.alarmSet);
            }

            this.seriesElements.set(series, elements);
        },
        makeLimitLines(series) {
            this.clearLimitLines(series);

            if (!series || !series.get('limitLines')) {
                return;
            }

            const limitElements = {
                limitLines: []
            };

            const limitLine = this.limitLineForSeries(series);
            if (limitLine) {
                limitElements.limitLines.push(limitLine);
                this.limitLines.push(limitLine);
            }

            this.seriesLimits.set(series, limitElements);
        },
        clearLimitLines(series) {
            const seriesLimits = this.seriesLimits.get(series);

            if (seriesLimits) {
                seriesLimits.limitLines.forEach(function (line) {
                    this.limitLines.splice(this.limitLines.indexOf(line), 1);
                    line.destroy();
                }, this);

                this.seriesLimits.delete(series);
            }
        },
        canDraw(yAxisId) {
            if (!this.offset[yAxisId] || !this.offset[yAxisId].x || !this.offset[yAxisId].y) {
                return false;
            }

            return true;
        },
        updateLimitsAndDraw() {
            this.drawLimitLines();
            this.scheduleDraw();
        },
        scheduleDraw() {
            if (!this.drawScheduled) {
                requestAnimationFrame(this.draw);
                this.drawScheduled = true;
            }
        },
        draw() {
            this.drawScheduled = false;
            if (this.isDestroyed) {
                return;
            }

            this.drawAPI.clear();
            const mainYAxisId = this.config.yAxis.get('id');
            //There has to be at least one yAxis
            const yAxisIds = [mainYAxisId].concat(this.config.additionalYAxes.map(yAxis => yAxis.get('id')));
            // Repeat drawing for all yAxes
            yAxisIds.forEach((id) => {
                if (this.canDraw(id)) {
                    this.updateViewport(id);
                    this.drawSeries(id);
                    this.drawRectangles(id);
                    this.drawHighlights(id);
                }
            });
        },
        updateViewport(yAxisId) {
            const mainYAxisId = this.config.yAxis.get('id');
            const xRange = this.config.xAxis.get('displayRange');
            let yRange;
            if (yAxisId === mainYAxisId) {
                yRange = this.config.yAxis.get('displayRange');
            } else {
                if (this.config.additionalYAxes.length) {
                    const yAxisForId = this.config.additionalYAxes.find(yAxis => yAxis.get('id') === yAxisId);
                    yRange = yAxisForId.get('displayRange');
                }
            }

            if (!xRange || !yRange) {
                return;
            }

            const dimensions = [
                xRange.max - xRange.min,
                yRange.max - yRange.min
            ];

            let origin;
            origin = [
                this.offset[yAxisId].x(xRange.min),
                this.offset[yAxisId].y(yRange.min)
            ];

            this.drawAPI.setDimensions(
                dimensions,
                origin
            );
        },
        matchByYAxisId(id, item) {
            console.log('matchByYAxisId');
            const mainYAxisId = this.config.yAxis.get('id');
            let matchesId = false;

            const series = item.series;
            if (series) {
                const seriesYAxisId = series.get('yAxisId') || mainYAxisId;

                matchesId = seriesYAxisId === id;
            }

            return matchesId;
        },
        drawSeries(id) {
            const lines = this.lines.filter(this.matchByYAxisId.bind(this, id));
            lines.forEach(this.drawLine, this);
            const pointSets = this.pointSets.filter(this.matchByYAxisId.bind(this, id));
            pointSets.forEach(this.drawPoints, this);
            const alarmSets = this.alarmSets.filter(this.matchByYAxisId.bind(this, id));
            alarmSets.forEach(this.drawAlarmPoints, this);
        },
        drawLimitLines() {
            this.config.series.models.forEach(series => {
                const yAxisId = series.get('yAxisId');
                this.drawLimitLinesForSeries(yAxisId, series);
            });
        },
        drawLimitLinesForSeries(yAxisId, series) {
            if (!this.canDraw(yAxisId)) {
                return;
            }

            this.updateViewport(yAxisId);

            if (!this.drawAPI.origin) {
                return;
            }

            Array.from(this.$refs.limitArea.children).forEach((el) => el.remove());
            let limitPointOverlap = [];
            this.limitLines.forEach((limitLine) => {
                let limitContainerEl = this.$refs.limitArea;
                limitLine.limits.forEach((limit) => {
                    if (!series.includes(limit.seriesKey)) {
                        return;
                    }

                    const showLabels = this.showLabels(limit.seriesKey);
                    if (showLabels) {
                        const overlap = this.getLimitOverlap(limit, limitPointOverlap);
                        limitPointOverlap.push(overlap);
                        let limitLabelEl = this.getLimitLabel(limit, overlap);
                        limitContainerEl.appendChild(limitLabelEl);
                    }

                    let limitEl = this.getLimitElement(limit);
                    limitContainerEl.appendChild(limitEl);

                }, this);
            });
        },
        showLabels(seriesKey) {
            return this.showLimitLineLabels.seriesKey
                    && (this.showLimitLineLabels.seriesKey === seriesKey);
        },
        getLimitElement(limit) {
            let point = {
                left: 0,
                top: this.drawAPI.y(limit.point.y)
            };
            let LimitLineClass = Vue.extend(LimitLine);
            const component = new LimitLineClass({
                propsData: {
                    point,
                    limit
                }
            });
            component.$mount();

            return component.$el;
        },
        getLimitOverlap(limit, overlapMap) {
            //calculate if limit lines are too close to each other
            let limitTop = this.drawAPI.y(limit.point.y);
            const needsVerticalAdjustment = limitTop - CLEARANCE <= 0;
            let needsHorizontalAdjustment = false;
            overlapMap.forEach(value => {
                let diffTop;
                if (limitTop > value.overlapTop) {
                    diffTop = limitTop - value.overlapTop;
                } else {
                    diffTop = value.overlapTop - limitTop;
                }

                //need to compare +ves to +ves and -ves to -ves
                if (!needsHorizontalAdjustment
                    && Math.abs(diffTop) <= CLEARANCE
                    && value.needsHorizontalAdjustment !== true) {
                    needsHorizontalAdjustment = true;
                }
            });

            return {
                needsHorizontalAdjustment,
                needsVerticalAdjustment,
                overlapTop: limitTop
            };
        },
        getLimitLabel(limit, overlap) {
            let point = {
                left: 0,
                top: this.drawAPI.y(limit.point.y)
            };
            let LimitLabelClass = Vue.extend(LimitLabel);
            const component = new LimitLabelClass({
                propsData: {
                    limit: Object.assign({}, overlap, limit),
                    point
                }
            });
            component.$mount();

            return component.$el;
        },
        drawAlarmPoints(alarmSet) {
            this.drawAPI.drawLimitPoints(
                alarmSet.points,
                alarmSet.series.get('color').asRGBAArray(),
                alarmSet.series.get('markerSize')
            );
        },
        drawPoints(chartElement) {
            this.drawAPI.drawPoints(
                chartElement.getBuffer(),
                chartElement.color().asRGBAArray(),
                chartElement.count,
                chartElement.series.get('markerSize'),
                chartElement.series.get('markerShape')
            );
        },
        drawLine(chartElement, disconnected) {
            if (chartElement) {
                this.drawAPI.drawLine(
                    chartElement.getBuffer(),
                    chartElement.color().asRGBAArray(),
                    chartElement.count,
                    disconnected
                );
            }
        },
        drawHighlights(yAxisId) {
            if (this.highlights && this.highlights.length) {
                const highlights = this.highlights.filter(this.matchByYAxisId.bind(this, yAxisId));
                highlights.forEach(this.drawHighlight.bind(this, yAxisId), this);
            }
        },
        drawHighlight(yAxisId, highlight) {
            const points = new Float32Array([
                this.offset[yAxisId].xVal(highlight.point, highlight.series),
                this.offset[yAxisId].yVal(highlight.point, highlight.series)
            ]);

            const color = highlight.series.get('color').asRGBAArray();
            const pointCount = 1;
            const shape = highlight.series.get('markerShape');

            this.drawAPI.drawPoints(points, color, pointCount, HIGHLIGHT_SIZE, shape);
        },
        drawRectangles(yAxisId) {
            if (this.rectangles) {
                const rectangles = this.rectangles.filter(this.matchByYAxisId.bind(this, yAxisId));
                rectangles.forEach(this.drawRectangle.bind(this, yAxisId), this);
            }
        },
        drawRectangle(yAxisId, rect) {
            console.log('drawRectangle');
            this.drawAPI.drawSquare(
                [
                    this.offset[yAxisId].x(rect.start.x),
                    this.offset[yAxisId].y(rect.start.y)
                ],
                [
                    this.offset[yAxisId].x(rect.end.x),
                    this.offset[yAxisId].y(rect.end.y)
                ],
                rect.color
            );
        }
    }
};

</script>
