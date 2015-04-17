/*global define,Float32Array*/

define(
    [],
    function () {
        "use strict";

        /**
         * Contains the buffer used to draw a plot.
         * @param {number} domainOffset number to subtract from domain values
         * @param {number} initialSize initial buffer size
         * @param {number} maxSize maximum buffer size
         * @constructor
         */
        function PlotLineBuffer(domainOffset, initialSize, maxSize) {
            var buffer = new Float32Array(initialSize * 2),
                rangeExtrema = [ Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY ],
                length = 0;

            // Binary search for an insertion index
            function binSearch(value, min, max) {
                var mid = Math.floor((min + max) / 2),
                    found = buffer[mid * 2];

                // Collisions are not wanted
                if (found === value) {
                    return -1;
                }

                // Otherwise, if we're down to a single index,
                // we've found our insertion point
                if (min >= max) {
                    // Compare the found timestamp with the search
                    // value to decide if we'll insert after or before.
                    return min + ((found < value) ? 1 : 0);
                }

                // Finally, do the recursive step
                if (found < value) {
                    return binSearch(value, mid + 1, max);
                } else {
                    return binSearch(value, min, mid - 1);
                }
            }

            // Increase the size of the buffer
            function doubleBufferSize() {
                var sz = Math.min(maxSize * 2, buffer.length * 2),
                    canDouble = sz > buffer.length,
                    doubled = canDouble && new Float32Array(sz);

                if (canDouble) {
                    doubled.set(buffer); // Copy contents of original
                    buffer = doubled;
                }

                return canDouble;
            }

            // Decrease the size of the buffer
            function halveBufferSize() {
                var sz = Math.max(initialSize * 2, buffer.length / 2),
                    canHalve = sz < buffer.length;

                if (canHalve) {
                    buffer = new Float32Array(buffer.subarray(0, sz));
                }

                return canHalve;
            }

            // Set a value in the buffer
            function setValue(index, domainValue, rangeValue) {
                buffer[index * 2] = domainValue - domainOffset;
                buffer[index * 2 + 1] = rangeValue;
                // Track min/max of range values (min/max for
                // domain values can be read directly from buffer)
                rangeExtrema = [
                    Math.min(rangeExtrema[0], rangeValue),
                    Math.max(rangeExtrema[1], rangeValue)
                ];
            }

            return {
                /**
                 * Get the WebGL-displayable buffer of points to plot.
                 * @returns {Float32Array} displayable buffer for this line
                 */
                getBuffer: function () {
                    return buffer;
                },
                /**
                 * Get the number of points stored in this buffer.
                 * @returns {number} the number of points stored
                 */
                getLength: function () {
                    return length;
                },
                /**
                 * Get the min/max range values that are currently in this
                 * buffer. Unlike range extrema, these will change as the
                 * buffer gets trimmed.
                 * @returns {number[]} min, max domain values
                 */
                getDomainExtrema: function () {
                    // Since these are ordered in the buffer, assume
                    // these are the values at the first and last index
                    return [
                        buffer[0] + domainOffset,
                        buffer[length * 2 - 2] + domainOffset
                    ];
                },
                /**
                 * Get the min/max range values that have been observed for this
                 * buffer. Note that these values may have been trimmed out at
                 * some point.
                 * @returns {number[]} min, max range values
                 */
                getRangeExtrema: function () {
                    return rangeExtrema;
                },
                /**
                 * Remove values from this buffer.
                 * Normally, values are removed from the start
                 * of the buffer; a truthy value in the second argument
                 * will cause values to be removed from the end.
                 * @param {number} count number of values to remove
                 * @param {boolean} [fromEnd] true if the most recent
                 *        values should be removed
                 */
                trim: function (count, fromEnd) {
                    // If we're removing values from the start...
                    if (!fromEnd) {
                        // ...do so by shifting buffer contents over
                        buffer.set(buffer.subarray(2 * count));
                    }
                    // Reduce used buffer size accordingly
                    length -= count;
                    // Finally, if less than half of the buffer is being
                    // used, free up some memory.
                    if (length < buffer.length / 4) {
                        halveBufferSize();
                    }
                },
                /**
                 * Insert data from the provided series at the specified
                 * index. If this would exceed the buffer's maximum capacity,
                 * this operation fails and the buffer is unchanged.
                 * @param {TelemetrySeries} series the series to insert
                 * @param {number} index the index at which to insert this
                 *        series
                 * @returns {boolean} true if insertion succeeded; otherwise
                 *          false
                 */
                insert: function (series, index) {
                    var sz = series.getPointCount(),
                        i;

                    // Don't allow append after the end; that doesn't make sense
                    index = Math.min(index, length);

                    // Resize if necessary
                    while (sz > ((buffer.length / 2) - length)) {
                        if (!doubleBufferSize()) {
                            // Can't make room for this, insertion fails
                            return false;
                        }
                    }

                    // Shift data over if necessary
                    if (index < length) {
                        buffer.set(
                            buffer.subarray(index * 2, length * 2),
                            (index + sz) * 2
                        );
                    }

                    // Insert data into the set
                    for (i = 0; i < sz; i += 1) {
                        setValue(
                            i + index,
                            series.getDomainValue(i),
                            series.getRangeValue(i)
                        );
                    }

                    // Increase the length
                    length += sz;

                    // Indicate that insertion was successful
                    return true;
                },
                /**
                 * Append a single data point.
                 */
                insertPoint: function (domainValue, rangeValue, index) {
                    // Don't allow
                    index = Math.min(length, index);

                    // Ensure there is space for this point
                    if (length >= (buffer.length / 2)) {
                        if (!doubleBufferSize()) {
                            return false;
                        }
                    }

                    // Put the data in the buffer
                    setValue(length, domainValue, rangeValue);

                    // Update length
                    length += 1;

                    // Indicate that this was successful
                    return true;
                },
                /**
                 * Find an index for inserting data with this
                 * timestamp. The second argument indicates whether
                 * we are searching for insert-before or insert-after
                 * positions.
                 * Timestamps are meant to be unique, so if a collision
                 * occurs, this will return -1.
                 * @param {number} timestamp timestamp to insert
                 * @returns {number} the index for insertion (or -1)
                 */
                findInsertionIndex: function (timestamp) {
                    var value = timestamp - domainOffset;

                    // Handle empty buffer case and check for an
                    // append opportunity (which is most common case for
                    // real-time data so is optimized-for) before falling
                    // back to a binary search for the insertion point.
                    return (length < 1) ? 0 :
                            (value > buffer[length * 2 - 2]) ? length :
                                    binSearch(value, 0, length - 1);
                }
            };
        }

        return PlotLineBuffer;
    }
);