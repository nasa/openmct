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
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The ScrollingListPopulator is responsible for filling in the
         * values which should appear within columns of a scrolling list
         * view, based on received telemetry data.
         * @memberof platform/features/scrolling
         * @constructor
         * @param {Column[]} columns the columns to be populated
         */
        function ScrollingListPopulator(columns) {
            this.columns = columns;
        }

        /**
         * Look up the most recent values from a set of data objects.
         * Returns an array of objects in the order in which data
         * should be displayed; each element is an object with
         * two properties:
         *
         * * objectIndex: The index of the domain object associated
         *                with the data point to be displayed in that
         *                row.
         * * pointIndex: The index of the data point itself, within
         *               its data set.
         *
         * @param {Array<Telemetry>} datas an array of the most recent
         *            data objects; expected to be in the same order
         *            as the domain objects provided at constructor
         * @param {number} count the number of rows to provide
         * @returns {Array} latest data values in display order
         * @private
         */
        function getLatestDataValues(datas, count) {
            var latest = [],
                candidate,
                candidateTime,
                used = datas.map(function () { return 0; });

            // This algorithm is O(nk) for n rows and k telemetry elements;
            // one O(k) linear search for a max is made for each of n rows.
            // This could be done in O(n lg k + k lg k), using a priority
            // queue (where priority is max-finding) containing k initial
            // values. For n rows, pop the max from the queue and replenish
            // the queue with a value from the data at the same
            // objectIndex, if available.
            // But k is small, so this might not give an observable
            // improvement in performance.

            // Find the most recent unused data point (this will be used
            // in a loop to find and the N most recent data points)
            function findCandidate(data, i) {
                var nextTime,
                    pointCount = data.getPointCount(),
                    pointIndex = pointCount - used[i] - 1;
                if (data && pointIndex >= 0) {
                    nextTime = data.getDomainValue(pointIndex);
                    if (nextTime > candidateTime) {
                        candidateTime = nextTime;
                        candidate = {
                            objectIndex: i,
                            pointIndex: pointIndex
                        };
                    }
                }
            }

            // Assemble a list of the most recent data points
            while (latest.length < count) {
                // Reset variables pre-search
                candidateTime = Number.NEGATIVE_INFINITY;
                candidate = undefined;

                // Linear search for most recent
                datas.forEach(findCandidate);

                if (candidate) {
                    // Record this data point - it is the most recent
                    latest.push(candidate);

                    // Track the data points used so we can look farther back
                    // in the data set on the next iteration
                    used[candidate.objectIndex] = used[candidate.objectIndex] + 1;
                } else {
                    // Ran out of candidates; not enough data points
                    // available to fill all rows.
                    break;
                }
            }

            return latest;
        }

        /**
         * Get the text which should appear in headers for the
         * provided columns.
         * @returns {string[]} column headers
         */
        ScrollingListPopulator.prototype.getHeaders = function () {
            return this.columns.map(function (column) {
                return column.getTitle();
            });
        };

        /**
         * Get the contents of rows for the scrolling list view.
         * @param {TelemetrySeries[]} datas the data sets
         * @param {DomainObject[]} objects the domain objects which
         *        provided the data sets; these should match
         *        index-to-index with the `datas` argument
         * @param {number} count the number of rows to populate
         * @returns {string[][]} an array of rows, each of which
         *          is an array of values which should appear
         *          in that row
         */
        ScrollingListPopulator.prototype.getRows = function (datas, objects, count) {
            var values = getLatestDataValues(datas, count),
                self = this;

            // From a telemetry series, retrieve a single data point
            // containing all fields for domains/ranges
            function makeDatum(domainObject, series, index) {
                var telemetry = domainObject.getCapability('telemetry'),
                    metadata = telemetry ? telemetry.getMetadata() : {},
                    result = {};

                (metadata.domains || []).forEach(function (domain) {
                    result[domain.key] =
                        series.getDomainValue(index, domain.key);
                });

                (metadata.ranges || []).forEach(function (range) {
                    result[range.key] =
                        series.getRangeValue(index, range.key);
                });

                return result;
            }

            // Each value will become a row, which will contain
            // some value in each column (rendering by the
            // column object itself)
            return values.map(function (value) {
                var datum = makeDatum(
                    objects[value.objectIndex],
                    datas[value.objectIndex],
                    value.pointIndex
                );

                return self.columns.map(function (column) {
                    return column.getValue(
                        objects[value.objectIndex],
                        datum
                    );
                });
            });
        };

        return ScrollingListPopulator;

    }
);

