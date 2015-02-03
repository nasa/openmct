/*global define,Float32Array*/

/**
 * Prepares data to be rendered in a GL Plot. Handles
 * the conversion from data API to displayable buffers.
 */
define(
    function () {
        'use strict';

        var MAX_POINTS = 86400,
            INITIAL_SIZE = 675; // 1/128 of MAX_POINTS

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
        function PlotUpdater(subscription, domain, range) {
            var max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
                min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
                x,
                y,
                domainOffset,
                buffers = {},
                lengths = {},
                lengthArray = [],
                bufferArray = [];

            // Double the size of a Float32Array
            function doubleSize(buffer) {
                var doubled = new Float32Array(buffer.length * 2);
                doubled.set(buffer); // Copy contents of original
                return doubled;
            }

            // Make sure there is enough space in a buffer to accomodate a
            // new point at the specified index. This will updates buffers[id]
            // if necessary.
            function ensureBufferSize(buffer, id, index) {
                // Check if we don't have enough room
                if (index > (buffer.length / 2 - 1)) {
                    // If we don't, can we expand?
                    if (index < MAX_POINTS) {
                        // Double the buffer size
                        buffer = buffers[id] = doubleSize(buffer);
                    } else {
                        // Just shift the existing buffer
                        buffer.copyWithin(0, 2);
                    }
                }

                return buffer;
            }

            // Add data to the plot.
            function addData(obj) {
                var id = obj.getId(),
                    index = lengths[id] || 0,
                    buffer = buffers[id],
                    domainValue = subscription.getDomainValue(obj, domain),
                    rangeValue = subscription.getRangeValue(obj, range);

                // If we don't already have a data buffer for that ID,
                // make one.
                if (!buffer) {
                    buffer = new Float32Array(INITIAL_SIZE);
                    buffers[id] = buffer;
                }

                // Make sure there's data to add, and then add it
                if (domainValue !== undefined && rangeValue !== undefined &&
                        (index < 1 || domainValue !== buffer[index * 2 - 2])) {
                    // Use the first observed domain value as a domainOffset
                    domainOffset = domainOffset !== undefined ?
                            domainOffset : domainValue;
                    // Ensure there is space for the new buffer
                    buffer = ensureBufferSize(buffer, id, index);
                    // Account for shifting that may have occurred
                    index = Math.min(index, MAX_POINTS - 2);
                    // Update the buffer
                    buffer[index * 2] = domainValue - domainOffset;
                    buffer[index * 2 + 1] = rangeValue;
                    // Update length
                    lengths[id] = Math.min(index + 1, MAX_POINTS);
                    // Observe max/min range values
                    max[1] = Math.max(max[1], rangeValue);
                    min[1] = Math.min(min[1], rangeValue);
                }

                return buffer;
            }

            // Update min/max domain values for these objects
            function updateDomainExtrema(objects) {
                max[0] = Number.NEGATIVE_INFINITY;
                min[0] = Number.POSITIVE_INFINITY;
                objects.forEach(function (obj) {
                    var id = obj.getId(),
                        buffer = buffers[id],
                        length = lengths[id],
                        low = buffer[0] + domainOffset,
                        high = buffer[length * 2 - 2] + domainOffset;
                    max[0] = Math.max(high, max[0]);
                    min[0] = Math.min(low, min[0]);
                });
            }

            // Handle new telemetry data
            function update() {
                var objects = subscription.getTelemetryObjects();
                bufferArray = objects.map(addData);
                lengthArray = objects.map(function (obj) {
                    return lengths[obj.getId()];
                });
                updateDomainExtrema(objects);
            }

            // Prepare buffers and related state for this object
            function prepare(telemetryObject) {
                var id = telemetryObject.getId();
                lengths[id] = 0;
                buffers[id] = new Float32Array(INITIAL_SIZE);
                lengthArray.push(lengths[id]);
                bufferArray.push(buffers[id]);
            }

            // Initially prepare state for these objects.
            // Note that this may be an empty array at this time,
            // so we also need to check during update cycles.
            subscription.getTelemetryObjects().forEach(prepare);

            return {
                /**
                 * Get the dimensions which bound all data in the provided
                 * data sets. This is given as a two-element array where the
                 * first element is domain, and second is range.
                 * @returns {number[]} the dimensions which bound this data set
                 */
                getDimensions: function () {
                    // Pad range if necessary
                    return (max[1] === min[1]) ?
                            [max[0] - min[0], 2.0 ] :
                            [max[0] - min[0], max[1] - min[1]];
                },
                /**
                 * Get the origin of this data set's boundary.
                 * This is given as a two-element array where the
                 * first element is domain, and second is range.
                 * The domain value here is not adjusted by the domain offset.
                 * @returns {number[]} the origin of this data set's boundary
                 */
                getOrigin: function () {
                    // Pad range if necessary
                    return (max[1] === min[1]) ? [ min[0], min[1] - 1.0 ] : min;
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
                    return bufferArray;
                },
                /**
                 * Get the number of points in the buffer with the specified
                 * index. Buffers are padded to minimize memory allocations,
                 * so user code will need this information to know how much
                 * data to plot.
                 * @returns {number} the number of points in this buffer
                 */
                getLength: function (index) {
                    return lengthArray[index] || 0;
                },
                /**
                 * Update with latest data.
                 */
                update: update
            };
        }

        return PlotUpdater;

    }
);