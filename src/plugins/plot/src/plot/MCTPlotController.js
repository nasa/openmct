/*global define*/

define([
    './LinearScale'
], function (
    LinearScale
) {
    'use strict';

    function MCTPlotController($scope, $element, $window) {
        this.$scope = $scope;
        this.$scope.config = this.config;
        this.$scope.plot = this;
        this.$element = $element;
        this.$window = $window;

        this.xScale = new LinearScale(this.config.xAxis.get('displayRange'));
        this.yScale = new LinearScale(this.config.yAxis.get('displayRange'));

        this.pan = undefined;
        this.marquee = undefined;

        this.chartElementBounds = undefined;
        this.tickUpdate = false;

        this.$scope.plotHistory = this.plotHistory = [];

        // Bind handlers so they are properly removed.
        [
            'toggleInteractionMode',
            'resetInteractionMode',
            'onMouseDown',
            'onMouseUp',
            'trackMousePosition',
            'untrackMousePosition',
            'stopWatching',
            'onPlotHighlightSet',
            'onTickWidthChange',
            'onXAxisChange',
            'onYAxisChange'
        ].forEach(function (handler) {
            this[handler] = this[handler].bind(this);
        }, this);

        this.initialize();
        window.control = this;
    }

    MCTPlotController.$inject = ['$scope', '$element', '$window'];

    MCTPlotController.prototype.initialize = function () {
        this.$canvas = this.$element.find('canvas');

        this.$canvas.on('mousemove', this.trackMousePosition);
        this.$canvas.on('mouseleave', this.untrackMousePosition);
        this.$canvas.on('mousedown', this.onMouseDown);

        this.watchForMarquee();

        this.$window.addEventListener('keydown', this.toggleInteractionMode);
        this.$window.addEventListener('keyup', this.resetInteractionMode);

        this.$scope.rectangles = [];
        this.$scope.tickWidth = 0;

        this.$scope.xAxis = this.config.xAxis;
        this.$scope.yAxis = this.config.yAxis;
        this.$scope.series = this.config.series.models;

        this.$scope.$on('$destroy', this.stopWatching);
        this.$scope.$on('plot:tickWidth', this.onTickWidthChange);
        this.$scope.$on('plot:highlight:set', this.onPlotHighlightSet);

        this.config.xAxis.on('change:displayRange', this.onXAxisChange);
        this.config.yAxis.on('change:displayRange', this.onYAxisChange);

        // TODO: something needs to give me a viewport.
    };

    MCTPlotController.prototype.onXAxisChange = function (displayBounds) {
        if (displayBounds) {
            this.xScale.domain(displayBounds);
        }
    };

    MCTPlotController.prototype.onYAxisChange = function (displayBounds) {
        if (displayBounds) {
            this.yScale.domain(displayBounds);
        }
    };

    MCTPlotController.prototype.onTickWidthChange = function ($event, width) {
        if ($event.targetScope.domainObject !== this.$scope.domainObject) {
            // Always accept tick width if it comes from a different object.
            this.$scope.tickWidth = width;
        } else {
            // Otherwise, only accept tick with if it's larger.
            var newWidth = Math.max(width, this.$scope.tickWidth);
            if (newWidth !== this.$scope.tickWidth) {
                this.$scope.tickWidth = newWidth;
                this.$scope.$digest();
            }
        }
    };

    MCTPlotController.prototype.trackMousePosition = function ($event) {
        this.trackChartElementBounds($event);
        this.xScale.range({min: 0, max: this.chartElementBounds.width});
        this.yScale.range({min: 0, max: this.chartElementBounds.height});

        this.positionOverElement = {
            x: $event.clientX - this.chartElementBounds.left,
            y: this.chartElementBounds.height -
                ($event.clientY - this.chartElementBounds.top)
        };

        this.positionOverPlot = {
            x: this.xScale.invert(this.positionOverElement.x),
            y: this.yScale.invert(this.positionOverElement.y)
        };

        this.highlightValues(this.positionOverPlot.x);
        this.updateMarquee();
        this.updatePan();
        this.$scope.$digest();
        $event.preventDefault();
    };

    MCTPlotController.prototype.trackChartElementBounds = function ($event) {
        if ($event.target === this.$canvas[0]) {
            this.chartElementBounds = $event.target.getBoundingClientRect();
        }
    };

    MCTPlotController.prototype.onPlotHighlightSet = function ($e, point) {
        if (point === this.highlightPoint) {
            return;
        }
        this.highlightValues(point);
    };

    MCTPlotController.prototype.highlightValues = function (point) {
        this.highlightPoint = point;
        this.$scope.$emit('plot:highlight:update', point);
        if (!point) {
            this.$scope.highlights = [];
        } else {
            this.$scope.highlights = this.$scope.series
                .filter(function (series) {
                    return series.data.length > 0;
                }).map(function (series) {
                    var closest = series.nearestPoint(point);
                    return {
                        series: series,
                        point: closest
                    };
                }, this);
        }
        this.$scope.$digest();
    };

    MCTPlotController.prototype.untrackMousePosition = function () {
        // TODO: don't untrack if the user is actively drawing.
        this.positionOverElement = undefined;
        this.positionOverPlot = undefined;
        this.highlightValues();
    };

    MCTPlotController.prototype.onMouseDown = function ($event) {
        this.$window.addEventListener('mouseup', this.onMouseUp);
        this.$window.addEventListener('mousemove', this.trackMousePosition);
        if (this.allowPan) {
            return this.startPan($event);
        }
        if (this.allowMarquee) {
            return this.startMarquee($event);
        }
    };

    MCTPlotController.prototype.onMouseUp = function ($event) {
        this.$window.removeEventListener('mouseup', this.onMouseUp);
        this.$window.removeEventListener('mousemove', this.trackMousePosition);
        if (this.pan) {
            this.endPan($event);
        }
        if (this.marquee) {
            this.endMarquee($event);
        }
        this.$scope.$apply();
    };

    MCTPlotController.prototype.updateMarquee = function () {
        if (!this.marquee) { return; }
        this.marquee.end = this.positionOverPlot;
    };

    MCTPlotController.prototype.startMarquee = function ($event) {
        this.trackMousePosition($event);
        if (this.positionOverPlot) {
            this.$scope.$emit('user:viewport:change:start');
            this.marquee = {
                start: this.positionOverPlot,
                end: this.positionOverPlot,
                color: [1, 1, 1, 0.5]
            };
            this.$scope.rectangles.push(this.marquee);
        }
    };

    MCTPlotController.prototype.endMarquee = function () {
        if (this.marquee.start.x !== this.marquee.end.x &&
            this.marquee.start.y !== this.marquee.end.y) {
            this.$scope.xAxis.set('displayRange', {
                min: Math.min(this.marquee.start.x, this.marquee.end.x),
                max: Math.max(this.marquee.start.x, this.marquee.end.x)
            });
            this.$scope.yAxis.set('displayRange', {
                min: Math.min(this.marquee.start.y, this.marquee.end.y),
                max: Math.max(this.marquee.start.y, this.marquee.end.y)
            });
            this.trackHistory();
            this.$scope.$emit('user:viewport:change:end');
        }
        this.$scope.rectangles = [];
        this.marquee = undefined;
    };

    MCTPlotController.prototype.startPan = function ($event) {
        this.trackMousePosition($event);
        this.$scope.$emit('user:viewport:change:start');
        this.pan = {
            start: this.positionOverPlot
        };
        $event.preventDefault();
        return false;
    };

    MCTPlotController.prototype.updatePan = function () {
        // calculate offset between points.  Apply that offset to viewport.
        if (!this.pan) { return; }
        var dX = this.pan.start.x - this.positionOverPlot.x,
            dY = this.pan.start.y - this.positionOverPlot.y,
            xRange = this.config.xAxis.get('displayRange'),
            yRange = this.config.yAxis.get('displayRange');

        this.config.xAxis.set('displayRange', {
            min: xRange.min + dX,
            max: xRange.max + dX
        });
        this.config.yAxis.set('displayRange', {
            min: yRange.min + dY,
            max: yRange.max + dY
        });
    };

    MCTPlotController.prototype.trackHistory = function () {
        this.plotHistory.push({
            x: this.config.xAxis.get('displayRange'),
            y: this.config.yAxis.get('displayRange')
        });
    };

    MCTPlotController.prototype.endPan = function () {
        this.pan = undefined;
        this.trackHistory();
        this.$scope.$emit('user:viewport:change:end');
    };

    MCTPlotController.prototype.watchForMarquee = function () {
        this.$canvas.removeClass('plot-drag');
        this.$canvas.addClass('plot-marquee');
        this.allowPan = false;
        this.allowMarquee = true;
    };

    MCTPlotController.prototype.watchForPan = function () {
        this.$canvas.addClass('plot-drag');
        this.$canvas.removeClass('plot-marquee');
        this.allowPan = true;
        this.allowMarquee = false;
    };

    MCTPlotController.prototype.toggleInteractionMode = function (event) {
        if (event.keyCode === 18) { // control key.
            this.watchForPan();
        }
    };

    MCTPlotController.prototype.resetInteractionMode = function (event) {
        if (event.keyCode === 18) {
            this.watchForMarquee();
        }
    };

    MCTPlotController.prototype.clear = function () {
        this.$scope.plotHistory = this.plotHistory = [];
        this.config.xAxis.set('displayRange', this.config.xAxis.get('range'));
        this.config.yAxis.set('autoscale', true);
        this.$scope.$emit('user:viewport:change:end');
    };

    MCTPlotController.prototype.back = function () {
        var currentAxisRanges = this.plotHistory.pop(),
            previousAxisRanges = this.plotHistory[this.plotHistory.length - 1];

        if (previousAxisRanges) {
            this.config.xAxis.set('displayRange', previousAxisRanges.x);
            this.config.yAxis.set('displayRange', previousAxisRanges.y);
            this.$scope.$emit('user:viewport:change:end');
        } else {
            this.clear();
        }
    };

    MCTPlotController.prototype.stopWatching = function () {
        if (this.$canvas) {
            this.$canvas.off('mousedown', this.onMouseDown);
            this.$canvas.off('mouseup', this.onMouseUp);
        }
        this.$window.removeEventListener('keydown', this.toggleInteractionMode);
        this.$window.removeEventListener('keyup', this.resetInteractionMode);
    };

    return MCTPlotController;
});
