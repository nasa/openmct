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
    ['lodash'],
    function (_) {
        function TelemetryCollection() {
            this.telemetry = [];
            this.sortField = undefined;
            this.lastBounds = {};

            _.bindAll(this,[
                'iteratee'
            ]);
        }

        TelemetryCollection.prototype.iteratee = function (element) {
            return _.get(element, this.sortField);
        };

        TelemetryCollection.prototype.bounds = function (bounds) {
            var startChanged = this.lastBounds.start !== bounds.start;
            var endChanged = this.lastBounds.end !== bounds.end;
            var fromStart = 0;
            var fromEnd = 0;
            var discarded = [];

            if (startChanged){
                var testValue = _.set({}, this.sortField, bounds.start);
                fromStart = _.sortedIndex(this.telemetry, testValue, this.sortField);
                discarded = this.telemetry.splice(0, fromStart);
            }
            if (endChanged) {
                var testValue = _.set({}, this.sortField, bounds.end);
                fromEnd = _.sortedLastIndex(this.telemetry, testValue, this.sortField);
                discarded = discarded.concat(this.telemetry.splice(fromEnd, this.telemetry.length - fromEnd));
            }
            this.lastBounds = bounds;
            return discarded;
        };

        TelemetryCollection.prototype.isValid = function (element) {
            var noBoundsDefined = !this.lastBounds || (!this.lastBounds.start && !this.lastBounds.end);
            var withinBounds = _.get(element, this.sortField) >= this.lastBounds.start &&
                _.get(element, this.sortField) <= this.lastBounds.end;

            return noBoundsDefined || withinBounds;
        };

        TelemetryCollection.prototype.add = function (element) {
            //console.log('data: ' + element.Time.value);
            if (this.isValid(element)){
                // Going to check for duplicates. Bound the search problem to
                // elements around the given time. Use sortedIndex because it
                // employs a binary search which is O(log n). Can use binary search
                // based on time stamp because the array is guaranteed ordered due
                // to sorted insertion.

                var isDuplicate = false;
                var startIx = _.sortedIndex(this.telemetry, element, this.sortField);

                if (startIx !== this.telemetry.length) {
                    var endIx = _.sortedLastIndex(this.telemetry, element, this.sortField);

                    // Create an array of potential dupes, based on having the
                    // same time stamp
                    var potentialDupes = this.telemetry.slice(startIx, endIx + 1);
                    // Search potential dupes for exact dupe
                    isDuplicate = _.findIndex(potentialDupes, _.isEqual.bind(undefined, element)) > -1;
                }

                if (!isDuplicate) {
                    this.telemetry.splice(startIx, 0, element);
                    return true;
                } else {
                    return false;
                }

            } else {
                return false;
            }
        };

        TelemetryCollection.prototype.clear = function () {
            this.telemetry = undefined;
        };

        TelemetryCollection.prototype.sort = function (sortField){
            this.sortField = sortField;
            this.telemetry = _.sortBy(this.telemetry, this.iteratee);
        };

        return TelemetryCollection;
    }
);
