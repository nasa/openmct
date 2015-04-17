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
                var sz = Math.min(maxSize, buffer.length * 2),
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
                var sz = Math.max(initialSize, buffer.length / 2),
                    canHalve = sz < buffer.length;

                if (canHalve) {
                    buffer = new Float32Array(buffer.subarray(0, sz));
                }

                return canHalve;
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
                        free = (buffer.length / 2) - length,
                        i;

                    // Don't allow append after the end; that doesn't make sense
                    if (index > length) {
                        index = length;
                    }

                    // Resize if necessary
                    if (sz > free) {
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
                        buffer[(i + index) * 2] =
                            series.getDomainValue(i) - domainOffset;
                        buffer[(i + index) * 2 + 1] =
                            series.getRangeValue(i);
                    }

                    // Increase the length
                    length += sz;

                    // Indicate that insertion was successful
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
                    return binSearch(
                        timestamp - domainOffset,
                        0,
                        length - 1
                    );
                }
            };
        }

        return PlotLineBuffer;
    }
);