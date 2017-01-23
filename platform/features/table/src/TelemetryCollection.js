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
        function TelemetryCollection() {
            EventEmitter.call(this, arguments);
            this.telemetry = [];
            this.highBuffer = [];
            this.sortField = undefined;
            this.lastBounds = {};

            _.bindAll(this,[
                'addOne',
                'iteratee'
            ]);
        }

        TelemetryCollection.prototype = Object.create(EventEmitter.prototype);

        TelemetryCollection.prototype.iteratee = function (element) {
            return _.get(element, this.sortField);
        };

        /**
         * This function is optimized for ticking - it assumes that start and end bounds
         * will only increase and as such this cannot be used for decreasing bounds changes.
         * For arbitrary bounds changes, it's assumed that a telemetry requery is performed anyway, and the
         * collection is cleared and repopulated.
         * @param bounds
         */
        TelemetryCollection.prototype.bounds = function (bounds) {
            var startChanged = this.lastBounds.start !== bounds.start;
            var endChanged = this.lastBounds.end !== bounds.end;
            var startIndex = 0;
            var endIndex = 0;
            var discarded = undefined;
            var added = undefined;

            if (startChanged){
                var testValue = _.set({}, this.sortField, bounds.start);
                // Calculate the new index of the first element within the bounds
                startIndex = _.sortedIndex(this.telemetry, testValue, this.sortField);
                discarded = this.telemetry.splice(0, startIndex);
            }
            if (endChanged) {
                var testValue = _.set({}, this.sortField, bounds.end);
                // Calculate the new index of the last element in bounds
                endIndex = _.sortedLastIndex(this.highBuffer, testValue, this.sortField);
                added = this.highBuffer.splice(0, endIndex);
                this.telemetry = this.telemetry.concat(added);
            }

            if (discarded && discarded.length > 0){
                this.emit('discarded', discarded);
            }
            if (added && added.length > 0) {
                this.emit('added', added);
            }
            this.lastBounds = bounds;
        };

        TelemetryCollection.prototype.inBounds = function (element) {
            var noBoundsDefined = !this.lastBounds || (!this.lastBounds.start && !this.lastBounds.end);
            var withinBounds =
                _.get(element, this.sortField) >= this.lastBounds.start &&
                _.get(element, this.sortField) <= this.lastBounds.end;

            return noBoundsDefined || withinBounds;
        };

        /**
         * @private
         * @param element
         */
        TelemetryCollection.prototype.addOne = function (element) {
            var isDuplicate = false;
            var boundsDefined = this.lastBounds && (this.lastBounds.start && this.lastBounds.end);
            var array;

            // Insert into either in-bounds array, or the out of bounds high buffer.
            // Data in the high buffer will be re-evaluated for possible insertion on next tick

            if (boundsDefined) {
                var boundsHigh = _.get(element, this.sortField) > this.lastBounds.end;
                var boundsLow = _.get(element, this.sortField) < this.lastBounds.start;

                if (!boundsHigh && !boundsLow) {
                    array = this.telemetry;
                } else if (boundsHigh) {
                    array = this.highBuffer;
                }
            } else {
                array = this.highBuffer;
            }

            // If out of bounds low, disregard data
            if (!boundsLow) {
                // Going to check for duplicates. Bound the search problem to
                // elements around the given time. Use sortedIndex because it
                // employs a binary search which is O(log n). Can use binary search
                // based on time stamp because the array is guaranteed ordered due
                // to sorted insertion.

                var startIx = _.sortedIndex(array, element, this.sortField);

                if (startIx !== array.length) {
                    var endIx = _.sortedLastIndex(array, element, this.sortField);

                    // Create an array of potential dupes, based on having the
                    // same time stamp
                    var potentialDupes = array.slice(startIx, endIx + 1);
                    // Search potential dupes for exact dupe
                    isDuplicate = _.findIndex(potentialDupes, _.isEqual.bind(undefined, element)) > -1;
                }

                if (!isDuplicate) {
                    array.splice(startIx, 0, element);

                    //Return true if it was added and in bounds
                    return array === this.telemetry;
                }
            }
            return false;
        };

        TelemetryCollection.prototype.addAll = function (elements) {
            var added = elements.filter(this.addOne);
            this.emit('added', added);
        };

        //Todo: addAll for initial historical data
        TelemetryCollection.prototype.add = function (element) {
            if (this.addOne(element)){
                this.emit('added', [element]);
                return true;
            } else {
                return false;
            }
        };

        TelemetryCollection.prototype.clear = function () {
            this.telemetry = [];
        };

        TelemetryCollection.prototype.sort = function (sortField){
            this.sortField = sortField;
            this.telemetry = _.sortBy(this.telemetry, this.iteratee);
        };

        return TelemetryCollection;
    }
);
