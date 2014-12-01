/*global define,Float32Array*/

/**
 * Prepares data to be rendered in a GL Plot. Handles
 * the conversion from data API to displayable buffers.
 */
define(
    function () {
        'use strict';

        function identity(x) { return x; }

        function GLPlotPreparer(datas, domain, range) {
            var index,
                vertices = [],
                max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
                min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
                x,
                y,
                xLabels = {},
                yLabels = {},
                yUnits = {},
                domainOffset = Number.POSITIVE_INFINITY,
                buffers;

            datas = datas || [];

            datas.filter(identity).forEach(function (data) {
                domainOffset = Math.min(data.getDomainValue(0, domain), domainOffset);
            });

            datas.forEach(function (data, i) {
                if (!data) {
                    return; // skip null data
                }

                vertices.push([]);
                for (index = 0; index < data.getPointCount(); index = index + 1) {
                    x = data.getDomainValue(index, domain) - domainOffset;
                    y = data.getRangeValue(index, range);
                    vertices[i].push(x);
                    vertices[i].push(y);
                    min[0] = Math.min(min[0], x);
                    min[1] = Math.min(min[1], y);
                    max[0] = Math.max(max[0], x);
                    max[1] = Math.max(max[1], y);
                }

                if (data.getDomainLabel) {
                    xLabels[data.getDomainLabel(domain)] = true;
                }

                if (data.getRangeLabel) {
                    yLabels[data.getRangeLabel(range)] = true;
                }

                if (data.getRangeUnits) {
                    yUnits[data.getRangeUnits(range)] = true;
                }
            });

            if (max[1] === min[1]) {
                max[1] = max[1] + 1.0;
                min[1] = min[1] - 1.0;
            }

            xLabels = Object.keys(xLabels).sort();
            yLabels = Object.keys(yLabels).sort();
            yUnits = Object.keys(yUnits).sort();

            buffers = vertices.map(function (v) { return new Float32Array(v); });

            return {
                getDimensions: function () {
                    return [max[0] - min[0], max[1] - min[1]];
                },
                getOrigin: function () {
                    return min;
                },
                getDomainOffset: function () {
                    return domainOffset;
                },
                getBuffers: function () {
                    return buffers;
                }
            };
        }

        return GLPlotPreparer;

    }
);