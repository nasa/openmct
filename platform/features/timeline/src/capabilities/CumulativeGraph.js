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

        /**
         * Provide points for a cumulative resource summary graph, using
         * a provided instantaneous resource summary graph.
         *
         * @param {ResourceGraph} graph the resource graph
         * @param {number} minimum the minimum allowable level
         * @param {number} maximum the maximum allowable level
         * @param {number} initial the initial state of the resource
         * @param {number} rate the rate at which one unit of instantaneous
         *        utilization changes the available level in one unit
         *        of domain values (that is, per millisecond)
         * @constructor
         */
        function CumulativeGraph(graph, minimum, maximum, initial, rate) {
            var values;

            // Calculate the domain value at which a line starting at
            // (domain, range) and proceeding with the specified slope
            // will have the specified range value.
            function intercept(domain, range, slope, value) {
                // value = slope * (intercept - domain) + range
                // value - range = slope * ...
                // intercept - domain = (value - range) / slope
                // intercept = domain + (value - range) / slope
                return domain + (value - range) / slope;
            }

            // Initialize the data values
            function initializeValues() {
                var values = [],
                    slope = 0,
                    previous = 0,
                    i;

                // Add a point (or points, if needed) reaching to the provided
                // domain and/or range value
                function addPoint(domain, range) {
                    var previous = values[values.length - 1],
                        delta = domain - previous.domain, // time delta
                        change = delta * slope * rate, // change
                        next = previous.range + change;

                    // Crop to minimum boundary...
                    if (next < minimum) {
                        values.push({
                            domain: intercept(
                                previous.domain,
                                previous.range,
                                slope * rate,
                                minimum
                            ),
                            range: minimum
                        });
                        next = minimum;
                    }

                    // ...and maximum boundary
                    if (next > maximum) {
                        values.push({
                            domain: intercept(
                                previous.domain,
                                previous.range,
                                slope * rate,
                                maximum
                            ),
                            range: maximum
                        });
                        next = maximum;
                    }

                    // Add the new data value
                    if (delta > 0) {
                        values.push({ domain: domain, range: next });
                    }

                    slope = range;
                }

                values.push({ domain: 0, range: initial });

                for (i = 0; i < graph.getPointCount(); i += 1) {
                    addPoint(graph.getDomainValue(i), graph.getRangeValue(i));
                }

                return values;
            }

            function convertToPercent(point) {
                point.range = 100 *
                    (point.range - minimum) / (maximum - minimum);
            }

            // Calculate cumulative values...
            values = initializeValues();

            // ...and convert to percentages.
            values.forEach(convertToPercent);

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

        return CumulativeGraph;
    }
);