/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
         * @memberof platform/features/plot
         * @constructor
         */
        function PlotLineBuffer(domainOffset, initialSize, maxSize) {
            this.buffer = new Float32Array(initialSize * 2);
            this.rangeExtrema =
                [ Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY ];
            this.length = 0;
            this.domainOffset = domainOffset;
            this.initialSize = initialSize;
            this.maxSize = maxSize;
        }

        // Binary search for an insertion index
        PlotLineBuffer.prototype.binSearch = function (value, min, max) {
            var mid = Math.floor((min + max) / 2),
                found = this.buffer[mid * 2];

            // On collisions, insert at same index
            if (found === value) {
                return mid;
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
                return this.binSearch(value, mid + 1, max);
            } else {
                return this.binSearch(value, min, mid - 1);
            }
        };

        // Increase the size of the buffer
        PlotLineBuffer.prototype.doubleBufferSize = function () {
            var sz = Math.min(this.maxSize * 2, this.buffer.length * 2),
                canDouble = sz > this.buffer.length,
                doubled = canDouble && new Float32Array(sz);

            if (canDouble) {
                doubled.set(this.buffer); // Copy contents of original
                this.buffer = doubled;
            }

            return canDouble;
        };

        // Decrease the size of the buffer
        PlotLineBuffer.prototype.halveBufferSize = function () {
            var sz = Math.max(this.initialSize * 2, this.buffer.length / 2),
                canHalve = sz < this.buffer.length;

            if (canHalve) {
                this.buffer = new Float32Array(this.buffer.subarray(0, sz));
            }

            return canHalve;
        };

        // Set a value in the buffer
        PlotLineBuffer.prototype.setValue = function (index, domainValue, rangeValue) {
            this.buffer[index * 2] = domainValue - this.domainOffset;
            this.buffer[index * 2 + 1] = rangeValue;
            // Track min/max of range values (min/max for
            // domain values can be read directly from buffer)
            this.rangeExtrema[0] = Math.min(this.rangeExtrema[0], rangeValue);
            this.rangeExtrema[1] = Math.max(this.rangeExtrema[1], rangeValue);
        };

        /**
         * Get the WebGL-displayable buffer of points to plot.
         * @returns {Float32Array} displayable buffer for this line
         */
        PlotLineBuffer.prototype.getBuffer = function () {
            return this.buffer;
        };

        /**
         * Get the number of points stored in this buffer.
         * @returns {number} the number of points stored
         */
        PlotLineBuffer.prototype.getLength = function () {
            return this.length;
        };

        /**
         * Get the min/max range values that are currently in this
         * buffer. Unlike range extrema, these will change as the
         * buffer gets trimmed.
         * @returns {number[]} min, max domain values
         */
        PlotLineBuffer.prototype.getDomainExtrema = function () {
            // Since these are ordered in the buffer, assume
            // these are the values at the first and last index
            return [
                this.buffer[0] + this.domainOffset,
                this.buffer[this.length * 2 - 2] + this.domainOffset
            ];
        };

        /**
         * Get the min/max range values that have been observed for this
         * buffer. Note that these values may have been trimmed out at
         * some point.
         * @returns {number[]} min, max range values
         */
        PlotLineBuffer.prototype.getRangeExtrema = function () {
            return this.rangeExtrema;
        };

        /**
         * Remove values from this buffer.
         * Normally, values are removed from the start
         * of the buffer; a truthy value in the second argument
         * will cause values to be removed from the end.
         * @param {number} count number of values to remove
         * @param {boolean} [fromEnd] true if the most recent
         *        values should be removed
         */
        PlotLineBuffer.prototype.trim = function (count, fromEnd) {
            // If we're removing values from the start...
            if (!fromEnd) {
                // ...do so by shifting buffer contents over
                this.buffer.set(this.buffer.subarray(2 * count));
            }
            // Reduce used buffer size accordingly
            this.length -= count;
            // Finally, if less than half of the buffer is being
            // used, free up some memory.
            if (this.length < this.buffer.length / 4) {
                this.halveBufferSize();
            }
        };

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
        PlotLineBuffer.prototype.insert = function (series, index) {
            var sz = series.getPointCount(),
                i;

            // Don't allow append after the end; that doesn't make sense
            index = Math.min(index, this.length);

            // Resize if necessary
            while (sz > ((this.buffer.length / 2) - this.length)) {
                if (!this.doubleBufferSize()) {
                    // Can't make room for this, insertion fails
                    return false;
                }
            }

            // Shift data over if necessary
            if (index < this.length) {
                this.buffer.set(
                    this.buffer.subarray(index * 2, this.length * 2),
                    (index + sz) * 2
                );
            }

            // Insert data into the set
            for (i = 0; i < sz; i += 1) {
                this.setValue(
                    i + index,
                    series.getDomainValue(i),
                    series.getRangeValue(i)
                );
            }

            // Increase the length
            this.length += sz;

            // Indicate that insertion was successful
            return true;
        };

        /**
         * Append a single data point.
         * @memberof platform/features/plot.PlotLineBuffer#
         */
        PlotLineBuffer.prototype.insertPoint = function (domainValue, rangeValue) {
            // Ensure there is space for this point
            if (this.length >= (this.buffer.length / 2)) {
                if (!this.doubleBufferSize()) {
                    return false;
                }
            }

            // Put the data in the buffer
            this.setValue(this.length, domainValue, rangeValue);

            // Update length
            this.length += 1;

            // Indicate that this was successful
            return true;
        };

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
        PlotLineBuffer.prototype.findInsertionIndex = function (timestamp) {
            var value = timestamp - this.domainOffset;

            // Handle empty buffer case and check for an
            // append opportunity (which is most common case for
            // real-time data so is optimized-for) before falling
            // back to a binary search for the insertion point.
            return (this.length < 1) ? 0 :
                (value > this.buffer[this.length * 2 - 2]) ? this.length :
                    this.binSearch(value, 0, this.length - 1);
        };

        return PlotLineBuffer;
    }
);

