/*global define,Float32Array*/

define([
    '../lib/extend',
    '../lib/eventHelpers'
], function (
    extend,
    eventHelpers
) {
    'use strict';

    function MCTChartAlarmPointSet(series, chart, offset) {
        this.series = series;
        this.chart = chart;
        this.offset = offset;
        this.points = [];

        this.listenTo(series, 'add', this.append, this);
        this.listenTo(series, 'remove', this.remove, this);
        this.listenTo(series, 'reset', this.reset, this);
        this.listenTo(series, 'destroy', this.destroy, this);
        series.data.forEach(function (point, index) {
            this.append(point, index, series)
        }, this);
    }

    MCTChartAlarmPointSet.prototype.append = function (datum) {
        if (datum._limit) {
            this.points.push({
                x: this.offset.xVal(datum, this.series),
                y: this.offset.yVal(datum, this.series),
                datum: datum
            });
        }
    };

    MCTChartAlarmPointSet.prototype.remove = function (datum) {
        this.points = this.points.filter(function (p) {
            return p.datum !== datum;
        });
    };

    MCTChartAlarmPointSet.prototype.reset = function () {
        this.points = [];
    };

    MCTChartAlarmPointSet.prototype.destroy = function () {
        this.stopListening();
    };



    eventHelpers.extend(MCTChartAlarmPointSet.prototype);

    return MCTChartAlarmPointSet;

});
