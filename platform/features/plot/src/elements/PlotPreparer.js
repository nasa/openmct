/*global define,Float32Array*/

/**
 * Prepares data to be rendered in a GL Plot. Handles
 * the conversion from data API to displayable buffers.
 */
define(
    function () {
        'use strict';

        function identity(x) { return x; }

        /**
         * The PlotPreparer is responsible for handling data sets and
         * preparing them to be rendered. It creates a WebGL-plottable
         * Float32Array for each trace, and tracks the boundaries of the
         * data sets (since this is convenient to do during the same pass).
         * @constructor
         * @param {Telemetry[]} datas telemetry data objects
         * @param {string} domain the key to use when looking up domain values
         * @param {string} range the key to use when looking up range values
         */
        function PlotPreparer(datas, domain, range) {
            var index,
                vertices = [],
                max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
                min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
                x,
                y,
                domainOffset = Number.POSITIVE_INFINITY,
                buffers;

            // Remove any undefined data sets
            datas = (datas || []).filter(identity);

            // Do a first pass to determine the domain offset.
            // This will be use to reduce the magnitude of domain values
            // in the buffer, to minimize loss-of-precision when
            // converting to a 32-bit float.
            datas.forEach(function (data) {
                domainOffset = Math.min(data.getDomainValue(0, domain), domainOffset);
            });

            // Assemble buffers, and track bounds of the data present
            datas.forEach(function (data, i) {
                vertices.push([]);
                for (index = 0; index < data.getPointCount(); index += 1) {
                    x = data.getDomainValue(index, domain);
                    y = data.getRangeValue(index, range);
                    vertices[i].push(x - domainOffset);
                    vertices[i].push(y);
                    min[0] = Math.min(min[0], x);
                    min[1] = Math.min(min[1], y);
                    max[0] = Math.max(max[0], x);
                    max[1] = Math.max(max[1], y);
                }
            });

            // If range is empty, add some padding
            if (max[1] === min[1]) {
                max[1] = max[1] + 1.0;
                min[1] = min[1] - 1.0;
            }

            // Convert to Float32Array
            buffers = vertices.map(function (v) { return new Float32Array(v); });

            return {
                /**
                 * Get the dimensions which bound all data in the provided
                 * data sets. This is given as a two-element array where the
                 * first element is domain, and second is range.
                 * @returns {number[]} the dimensions which bound this data set
                 */
                getDimensions: function () {
                    return [max[0] - min[0], max[1] - min[1]];
                },
                /**
                 * Get the origin of this data set's boundary.
                 * This is given as a two-element array where the
                 * first element is domain, and second is range.
                 * The domain value here is not adjusted by the domain offset.
                 * @returns {number[]} the origin of this data set's boundary
                 */
                getOrigin: function () {
                    return min;
                },
                /**
                 * Get the domain offset; this offset will have been subtracted
                 * from all domain values in all buffers returned by this
                 * preparer, in order to minimize loss-of-precision due to
                 * conversion to the 32-bit float format needed by WebGL.
                 * @returns {number} the domain offset
                 */
                getDomainOffset: function () {
                    return domainOffset;
                },
                /**
                 * Get all renderable buffers for this data set. This will
                 * be returned as an array which can be correlated back to
                 * the provided telemetry data objects (from the constructor
                 * call) by index.
                 *
                 * Internally, these are flattened; each buffer contains a
                 * sequence of alternating domain and range values.
                 *
                 * All domain values in all buffers will have been adjusted
                 * from their original values by subtraction of the domain
                 * offset; this minimizes loss-of-precision resulting from
                 * the conversion to 32-bit floats, which may otherwise
                 * cause aliasing artifacts (particularly for timestamps)
                 *
                 * @returns {Float32Array[]} the buffers for these traces
                 */
                getBuffers: function () {
                    return buffers;
                }
            };
        }

        return PlotPreparer;

    }
);