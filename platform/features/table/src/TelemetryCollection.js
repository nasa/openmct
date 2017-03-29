/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [
        'lodash',
        'EventEmitter'
    ],
    function (_, EventEmitter) {

        /**
         * @constructor
         */
        function TelemetryCollection() {
            EventEmitter.call(this, arguments);
            this.telemetry = [];
            this.highBuffer = [];
            this.sortField = undefined;
            this.lastBounds = {};

            _.bindAll(this, [
                'addOne',
                'iteratee'
            ]);
        }

        TelemetryCollection.prototype = Object.create(EventEmitter.prototype);

        TelemetryCollection.prototype.iteratee = function (item) {
            return _.get(item, this.sortField);
        };

        /**
         * This function is optimized for ticking - it assumes that start and end
         * bounds will only increase and as such this cannot be used for decreasing
         * bounds changes.
         *
         * An implication of this is that data will not be discarded that exceeds
         * the given end bounds. For arbitrary bounds changes, it's assumed that
         * a telemetry requery is performed anyway, and the collection is cleared
         * and repopulated.
         *
         * @fires TelemetryCollection#added
         * @fires TelemetryCollection#discarded
         * @param bounds
         */
        TelemetryCollection.prototype.bounds = function (bounds) {
            var startChanged = this.lastBounds.start !== bounds.start;
            var endChanged = this.lastBounds.end !== bounds.end;
            var startIndex = 0;
            var endIndex = 0;
            var discarded;
            var added;
            var testValue;

            // If collection is not sorted by a time field, we cannot respond to
            // bounds events
            if (this.sortField === undefined) {
                this.lastBounds = bounds;
                return;
            }

            if (startChanged) {
                testValue = _.set({}, this.sortField, bounds.start);
                // Calculate the new index of the first item within the bounds
                startIndex = _.sortedIndex(this.telemetry, testValue, this.sortField);
                discarded = this.telemetry.splice(0, startIndex);
            }
            if (endChanged) {
                testValue = _.set({}, this.sortField, bounds.end);
                // Calculate the new index of the last item in bounds
                endIndex = _.sortedLastIndex(this.highBuffer, testValue, this.sortField);
                added = this.highBuffer.splice(0, endIndex);
                this.telemetry = this.telemetry.concat(added);
            }

            if (discarded && discarded.length > 0) {
                /**
                 * A `discarded` event is emitted when telemetry data fall out of
                 * bounds due to a bounds change event
                 * @type {object[]} discarded the telemetry data
                 * discarded as a result of the bounds change
                 */
                this.emit('discarded', discarded);
            }
            if (added && added.length > 0) {
                /**
                 * An `added` event is emitted when a bounds change results in
                 * received telemetry falling within the new bounds.
                 * @type {object[]} added the telemetry data that is now within bounds
                 */
                this.emit('added', added);
            }
            this.lastBounds = bounds;
        };

        /**
         * Adds an individual item to the collection. Used internally only
         * @private
         * @param item
         */
        TelemetryCollection.prototype.addOne = function (item) {
            var isDuplicate = false;
            var boundsDefined = this.lastBounds &&
                (this.lastBounds.start !== undefined && this.lastBounds.end !== undefined);
            var array;
            var boundsLow;
            var boundsHigh;

            // If collection is not sorted by a time field, we cannot respond to
            // bounds events, so no bounds checking necessary
            if (this.sortField === undefined) {
                this.telemetry.push(item);
                return true;
            }

            // Insert into either in-bounds array, or the out of bounds high buffer.
            // Data in the high buffer will be re-evaluated for possible insertion on next tick

            if (boundsDefined) {
                boundsHigh = _.get(item, this.sortField) > this.lastBounds.end;
                boundsLow = _.get(item, this.sortField) < this.lastBounds.start;

                if (!boundsHigh && !boundsLow) {
                    array = this.telemetry;
                } else if (boundsHigh) {
                    array = this.highBuffer;
                }
            } else {
                array = this.telemetry;
            }

            // If out of bounds low, disregard data
            if (!boundsLow) {

                // Going to check for duplicates. Bound the search problem to
                // items around the given time. Use sortedIndex because it
                // employs a binary search which is O(log n). Can use binary search
                // based on time stamp because the array is guaranteed ordered due
                // to sorted insertion.
                var startIx = _.sortedIndex(array, item, this.sortField);
                var endIx;

                if (startIx !== array.length) {
                    endIx = _.sortedLastIndex(array, item, this.sortField);

                    // Create an array of potential dupes, based on having the
                    // same time stamp
                    var potentialDupes = array.slice(startIx, endIx + 1);
                    // Search potential dupes for exact dupe
                    isDuplicate = _.findIndex(potentialDupes, _.isEqual.bind(undefined, item)) > -1;
                }

                if (!isDuplicate) {
                    array.splice(endIx || startIx, 0, item);

                    //Return true if it was added and in bounds
                    return array === this.telemetry;
                }
            }
            return false;
        };

        /**
         * Add an array of objects to this telemetry collection
         * @fires TelemetryCollection#added
         * @param {object[]} items
         */
        TelemetryCollection.prototype.add = function (items) {
            var added = items.filter(this.addOne);
            this.emit('added', added);
        };

        /**
         * Clears the contents of the telemetry collection
         */
        TelemetryCollection.prototype.clear = function () {
            this.telemetry = [];
            this.highBuffer = [];
        };

        /**
         * Sorts the telemetry collection based on the provided sort field
         * specifier. Subsequent inserts are sorted to maintain specified sport
         * order.
         *
         * @example
         * // First build some mock telemetry for the purpose of an example
         * let now = Date.now();
         * let telemetry = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (value) {
         *     return {
         *         // define an object property to demonstrate nested paths
         *         timestamp: {
         *             ms: now - value * 1000,
         *             text:
         *         },
         *         value: value
         *     }
         * });
         * let collection = new TelemetryCollection();
         *
         * collection.add(telemetry);
         *
         * // Sort by telemetry value
         * collection.sort("value");
         *
         * // Sort by ms since epoch
         * collection.sort("timestamp.ms");
         *
         * // Sort by formatted date text
         * collection.sort("timestamp.text");
         *
         *
         * @param {string} sortField An object property path.
         */
        TelemetryCollection.prototype.sort = function (sortField) {
            this.sortField = sortField;
            if (sortField !== undefined) {
                this.telemetry = _.sortBy(this.telemetry, this.iteratee);
            }
        };

        return TelemetryCollection;
    }
);
