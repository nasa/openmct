/*global define*/

define([
    './MCTChartSeriesElement'
], function (
    MCTChartSeriesElement
) {
    'use strict';

    var MCTChartLineStepAfter = MCTChartSeriesElement.extend({
        removePoint: function (point, index, count) {
            if (index > 0 && index / 2 < this.count) {
                this.buffer[index + 1] = this.buffer[index - 1];
            }
        },
        vertexCountForPointAtIndex: function (index) {
            if (index === 0 && this.count === 0) {
                return 2;
            }
            return 4;
        },
        startIndexForPointAtIndex: function (index) {
            if (index === 0) {
                return 0;
            }
            return 2 + ((index - 1) * 4);
        },
        addPoint: function (point, start, count) {
            if (start === 0 && this.count === 0) {
                // First point is easy.
                this.buffer[start] = point.x;
                this.buffer[start + 1] = point.y; // one point
            } else if (start === 0 && this.count > 0) {
                // Unshifting requires adding an extra point.
                this.buffer[start] = point.x;
                this.buffer[start + 1] = point.y;
                this.buffer[start + 2] = this.buffer[start + 4];
                this.buffer[start + 3] = point.y;
            } else {
                // Appending anywhere in line, insert standard two points.
                this.buffer[start] = point.x;
                this.buffer[start + 1] = this.buffer[start - 1];
                this.buffer[start + 2] = point.x;
                this.buffer[start + 3] = point.y;

                if (start < this.count * 2) {
                    // Insert into the middle, need to update the following
                    // point.
                    this.buffer[start + 5] = point.y;
                }
            }
        }
    });

    return MCTChartLineStepAfter;

});

