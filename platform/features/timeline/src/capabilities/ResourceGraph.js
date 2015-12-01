/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define*/

define(
    [],
    function () {
        "use strict";

        // Utility function to copy an array, sorted by a specific field
        function sort(array, field) {
            return array.slice().sort(function (a, b) {
                return a[field] - b[field];
            });
        }

        /**
         * Provides data to populate resource graphs associated
         * with timelines and activities.
         * @param {Array} utilizations resource utilizations
         * @constructor
         */
        function ResourceGraph(utilizations) {
            // Overview of algorithm here:
            // * Goal: Have a list of time/value pairs which represents
            //   points along a stepped chart of resource utilization.
            //   Each change (stepping up or down) should have two points,
            //   at the bottom and top of the step respectively.
            // * Step 1: Prepare two lists of utilizations sorted by start
            //   and end times. The "starts" will become step-ups, the
            //   "ends" will become step-downs.
            // * Step 2: Initialize empty arrays for results, and a variable
            //   for the current utilization level.
            // * Step 3: While there are still start or end times to add...
            //   * Step 3a: Determine whether the next change should be a
            //     step-up (start) or step-down (end) based on which of the
            //     next start/end times comes next (note that starts and ends
            //     are both sorted, so we look at the head of the array.)
            //   * Step 3b: Pull the next start or end (per previous decision)
            //     and convert it to a time-delta pair, negating if it's an
            //     end time (to step down or "un-step")
            //   * Step 3c: Add a point at the new time and the current
            //     running total (first point in the step, before the change)
            //     then increment the running total and add a new point
            //     (second point in the step, after the change)
            // * Step 4: Filter out unnecessary points (if two activities
            //   run up against each other, there will be a zero-duration
            //   spike if we don't filter out the extra points from their
            //   start/end times.)
            //
            var starts = sort(utilizations, "start"),
                ends = sort(utilizations, "end"),
                values = [],
                running = 0;

            // If there are sequences of points with the same timestamp,
            // allow only the first and last.
            function filterPoint(value, index, values) {
                // Allow the first or last point as a base case; aside from
                // that, allow only points that have different timestamps
                // from their predecessor or successor.
                return (index === 0) || (index === values.length - 1) ||
                    (value.domain !== values[index - 1].domain) ||
                    (value.domain !== values[index + 1].domain);
            }

            // Add a step up or down (Step 3c above)
            function addDelta(time, delta) {
                values.push({ domain: time, range: running });
                running += delta;
                values.push({ domain: time, range: running });
            }

            // Add a start time (Step 3b above)
            function addStart() {
                var next = starts.shift();
                addDelta(next.start, next.value);
            }

            // Add an end time (Step 3b above)
            function addEnd() {
                var next = ends.shift();
                addDelta(next.end, -next.value);
            }

            // Decide whether next step should correspond to a start or
            // an end. (Step 3c above)
            function pickStart() {
                return ends.length < 1 ||
                    (starts.length > 0 && starts[0].start <= ends[0].end);
            }

            // Build up start/end arrays (step 3 above)
            while (starts.length > 0 || ends.length > 0) {
                (pickStart() ? addStart : addEnd)();
            }

            // Filter out excess points
            values = values.filter(filterPoint);

            return {
                /**
                 * Get the total number of points in this graph.
                 * @returns {number} the total number of points
                 */
                getPointCount: function () {
                    return values.length;
                },
                /**
                 * Get the domain value (timestamp) for a point in this graph.
                 * @returns {number} the domain value
                 */
                getDomainValue: function (index) {
                    return values[index].domain;
                },
                /**
                 * Get the range value (utilization level) for a point in
                 * this graph.
                 * @returns {number} the range value
                 */
                getRangeValue: function (index) {
                    return values[index].range;
                }
            };
        }

        return ResourceGraph;
    }

);