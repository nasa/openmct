/*global define,requestAnimationFrame,Float32Array*/

/**
 * Module defining MCTChart. Created by vwoeltje on 11/12/14.
 */
define([
    './MCTChartLineLinear',
    './MCTChartLineStepAfter',
    './MCTChartPointSet',
    '../draw/DrawLoader',
    '../lib/eventHelpers',
    'lodash'
],
function (
    MCTChartLineLinear,
    MCTChartLineStepAfter,
    MCTChartPointSet,
    DrawLoader,
    eventHelpers,
    _
) {
    'use strict';

    var MARKER_SIZE = 6.0,
        HIGHLIGHT_SIZE = MARKER_SIZE * 2.0;

    /**
     * Offsetter adjusts x and y values by a fixed amount,
     * generally increasing the precision of the 32 bit float representation
     * required for plotting.
     *
     * @constructor
     */
    function MCTChartController($scope) {
        this.$scope = $scope;
        this.isDestroyed = false;
        this.lines = [];
        this.pointSets = [];
        this.offset = {};
        this.config = $scope.config;
        this.$scope.$on(
            '$destroy',
            _.bind(this.onDestroy, this)
        );
        this.draw = this.draw.bind(this);
        this.seriesElements = new WeakMap();

        this.listenTo(this.config.series, 'add', this.onSeriesAdd, this);
        this.listenTo(this.config.series, 'remove', this.onSeriesRemove, this);
        this.listenTo(this.config.yAxis, 'change:key', this.clearOffset, this);
        this.listenTo(this.config.xAxis, 'change:key', this.clearOffset, this);
        this.config.series.forEach(this.onSeriesAdd, this);
        window.chart = this;
    }

    eventHelpers.extend(MCTChartController.prototype);

    MCTChartController.$inject = ['$scope'];

    MCTChartController.prototype.onSeriesAdd = function (series) {
        this.listenTo(series, 'reset', this.onSeriesReset, this);
        this.listenTo(series, 'change:interpolate', this.changeinterpolate, this);
        this.listenTo(series, 'change:markers', this.changeMarkers, this);
        this.makeChartElement(series);
    };

    MCTChartController.prototype.changeinterpolate = function (mode, o, series) {
        if (mode === o) {
            return;
        }
        var elements = this.seriesElements.get(series);
        elements.lines.forEach(function (line) {
            this.lines.splice(this.lines.indexOf(line), 1);
            line.destroy();
        }, this);
        elements.lines = [];

        var newLine = this.lineForSeries(series);
        if (newLine) {
            elements.lines.push(newLine);
            this.lines.push(newLine);
        }
    };

    MCTChartController.prototype.changeMarkers = function (mode, o, series) {
        if (mode === o) {
            return;
        }
        var elements = this.seriesElements.get(series);
        elements.pointSets.forEach(function (pointSet) {
            this.pointSets.splice(this.pointSets.indexOf(pointSet), 1);
            pointSet.destroy();
        }, this);
        elements.pointSets = [];

        var pointSet = this.pointSetForSeries(series);
        if (pointSet) {
            elements.pointSets.push(pointSet);
            this.pointSets.push(pointSet);
        }
    };

    MCTChartController.prototype.onSeriesRemove = function (series) {
        this.stopListening(series);
        this.removeChartElement(series);
    };

    MCTChartController.prototype.onSeriesReset = function (series) {
        this.clearOffset();
    };

    MCTChartController.prototype.onDestroy = function () {
        this.isDestroyed = true;
        this.stopListening();
        _.invoke(this.lines, 'destroy');
        DrawLoader.releaseDrawAPI(this.drawAPI);
    };

    MCTChartController.prototype.clearOffset = function () {
        delete this.offset.x;
        delete this.offset.y;
        delete this.offset.xVal;
        delete this.offset.yVal;
        delete this.offset.xKey;
        delete this.offset.yKey;
        this.lines.forEach(function (line) {
            line.reset();
        });
        this.pointSets.forEach(function (pointSet) {
            pointSet.reset();
        })
    };

    MCTChartController.prototype.setOffset = function (point, index, series) {
        if (this.offset.x && this.offset.y) {
            return;
        }

        var xKey = this.config.xAxis.get('key');
        var yKey = this.config.yAxis.get('key');

        if (!xKey || !yKey) {
            return;
        }

        var offsets = {
            x: series.value(point, xKey),
            y: series.value(point, yKey),
            xKey: xKey,
            yKey: yKey
        };

        this.offset.x = function (x) {
            return x - offsets.x;
        }.bind(this);
        this.offset.y = function (y) {
            return y - offsets.y;
        }.bind(this);
        this.offset.xVal = function (point, pSeries) {
            return this.offset.x(pSeries.value(point, xKey));
        }.bind(this);
        this.offset.yVal = function (point, pSeries) {
            return this.offset.y(pSeries.value(point, yKey));
        }.bind(this);
    };

    MCTChartController.prototype.initializeCanvas = function (canvas) {
        this.canvas = canvas;
        this.drawAPI = DrawLoader.getDrawAPI(canvas);
        return !!this.drawAPI;
    };

    MCTChartController.prototype.removeChartElement = function (series) {
        var elements = this.seriesElements.get(series);

        elements.lines.forEach(function (line) {
            this.lines.splice(this.lines.indexOf(line), 1);
            line.destroy();
        }, this);
        elements.pointSets.forEach(function (pointSet) {
            this.pointSets.splice(this.pointSets.indexOf(pointSet), 1);
            pointSet.destroy();
        }, this);
        this.seriesElements.delete(series);
    };

    MCTChartController.prototype.lineForSeries = function (series) {
        if (series.get('interpolate') === 'linear') {
            return new MCTChartLineLinear(
                series,
                this,
                this.offset
            );
        }
        if (series.get('interpolate') === 'stepAfter') {
            return new MCTChartLineStepAfter(
                series,
                this,
                this.offset
            );
        }
    };

    MCTChartController.prototype.pointSetForSeries = function (series) {
        if (series.get('markers')) {
            return new MCTChartPointSet(
                series,
                this,
                this.offset
            );
        }
    };

    MCTChartController.prototype.makeChartElement = function (series) {
        var elements = {
            lines: [],
            pointSets: []
        };

        var line = this.lineForSeries(series);
        if (line) {
            elements.lines.push(line);
            this.lines.push(line);
        }

        var pointSet = this.pointSetForSeries(series);
        if (pointSet) {
            elements.pointSets.push(pointSet);
            this.pointSets.push(pointSet);
        }

        this.seriesElements.set(series, elements);
    };

    MCTChartController.prototype.canDraw = function () {
        if (!this.offset.x || !this.offset.y) {
            return false;
        }
        return true;
    };

    MCTChartController.prototype.draw = function () {
        if (this.isDestroyed) {
            return;
        }
        requestAnimationFrame(this.draw);
        this.drawAPI.clear();
        if (this.canDraw()) {
            this.updateViewport();
            this.drawSeries();
            this.drawRectangles();
            this.drawHighlights();
        }
    };

    MCTChartController.prototype.updateViewport = function () {
        var xRange = this.config.xAxis.get('displayRange'),
            yRange = this.config.yAxis.get('displayRange');

        if (!xRange || !yRange) {
            return;
        }

        var dimensions = [
                xRange.max - xRange.min,
                yRange.max - yRange.min
            ],
            origin = [
                this.offset.x(xRange.min),
                this.offset.y(yRange.min)
            ];

        this.drawAPI.setDimensions(
            dimensions,
            origin
        );
    };

    MCTChartController.prototype.drawSeries = function () {
        this.lines.forEach(this.drawLine, this);
        this.pointSets.forEach(this.drawPoints, this);
    };

    MCTChartController.prototype.drawPoints = function (chartElement) {
        this.drawAPI.drawPoints(
            chartElement.getBuffer(),
            chartElement.color().asRGBAArray(),
            chartElement.count,
            chartElement.series.get('markerSize')
        );
    };

    MCTChartController.prototype.drawLine = function (chartElement) {
        this.drawAPI.drawLine(
            chartElement.getBuffer(),
            chartElement.color().asRGBAArray(),
            chartElement.count
        );
    };

    MCTChartController.prototype.drawHighlights = function () {
        if (this.$scope.highlights && this.$scope.highlights.length) {
            this.$scope.highlights.forEach(this.drawHighlight, this);
        }
    };

    MCTChartController.prototype.drawHighlight = function (highlight) {
        var points = new Float32Array([
                this.offset.xVal(highlight.point, highlight.series),
                this.offset.yVal(highlight.point, highlight.series)
            ]),
            color = highlight.series.get('color').asRGBAArray(),
            pointCount = 1;

        this.drawAPI.drawPoints(points, color, pointCount, HIGHLIGHT_SIZE);
    };

    MCTChartController.prototype.drawRectangles = function () {
        if (this.$scope.rectangles) {
            this.$scope.rectangles.forEach(this.drawRectangle, this);
        }
    };

    MCTChartController.prototype.drawRectangle = function (rect) {
        this.drawAPI.drawSquare(
            [
                this.offset.x(rect.start.x),
                this.offset.y(rect.start.y)
            ],
            [
                this.offset.x(rect.end.x),
                this.offset.y(rect.end.y)
            ],
            rect.color
        );
    };

    return MCTChartController;
});
