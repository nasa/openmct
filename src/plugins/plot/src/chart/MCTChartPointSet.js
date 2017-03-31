/*global define*/

define([
    './MCTChartSeriesElement'
], function (
    MCTChartSeriesElement
) {
    'use strict';

    var MCTChartPointSet = MCTChartSeriesElement.extend({
        addPoint: function (point, start, count) {
            this.buffer[start] = point.x;
            this.buffer[start + 1] = point.y;
        }
    });

    return MCTChartPointSet;

});

