/*global define*/

define(
    [],
    function () {
        "use strict";

        function ScrollingListPopulator(columns) {
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
             * @param {Array<ScrollingColumn}
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


            return {
                getHeaders: function () {
                    return columns.map(function (column) {
                        return column.getTitle();
                    });
                },
                getRows: function (datas, objects, count) {
                    var values = getLatestDataValues(datas, count);

                    // Each value will become a row, which will contain
                    // some value in each column (rendering by the
                    // column object itself)
                    return values.map(function (value) {
                        return columns.map(function (column) {
                            return column.getValue(
                                objects[value.objectIndex],
                                datas[value.objectIndex],
                                value.pointIndex
                            );
                        });
                    });
                }
            };
        }

        return ScrollingListPopulator;

    }
);