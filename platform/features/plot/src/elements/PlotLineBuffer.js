/*global define,Float32Array*/

define(
    [],
    function () {
        "use strict";

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

            return {
                getBuffer: function () {
                    return buffer;
                },
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
                            // TODO: Figure out which data to discard
                            i = 0;
                        }
                    }

                    // Insert data into the set
                    for (i = 0; i < series.getPointCount(); i += 1) {
                        buffer[(i + index) * 2] =
                            series.getDomainValue(i) - domainOffset;
                        buffer[(i + index) * 2 + 1] =
                            series.getRangeValue(i);
                    }

                    // Increase the length
                    length += sz;
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