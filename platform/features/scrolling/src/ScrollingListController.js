/*global define,Promise*/

/**
 * Module defining ListController. Created by vwoeltje on 11/18/14.
 */
define(
    ["./NameColumn", "./DomainColumn", "./RangeColumn"],
    function (NameColumn, DomainColumn, RangeColumn) {
        "use strict";

        var ROW_COUNT = 18;

        /**
         * The ScrollingListController is responsible for populating
         * the contents of the scrolling list view.
         * @constructor
         */
        function ScrollingListController($scope) {
            var columns = []; // Domain used

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
            function getLatestDataValues(datas) {
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
                while (latest.length < ROW_COUNT) {
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

            // Get a set of populated, ready-to-display rows for the
            // latest data values.
            function getRows(telemetry) {
                var datas = telemetry.getResponse(),
                    objects = telemetry.getTelemetryObjects(),
                    values = getLatestDataValues(datas);

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

            // Update the contents
            function updateRows() {
                var telemetry = $scope.telemetry;
                $scope.rows = telemetry ? getRows(telemetry) : [];
            }

            // Set up columns based on telemetry metadata. This will
            // include one column for each domain and range type, as
            // well as a column for the domain object name.
            function setupColumns(telemetry) {
                var domainKeys = {},
                    rangeKeys = {},
                    metadata;

                // Add a domain to the set of columns, if a domain
                // with the same key has not yet been inclued.
                function addDomain(domain) {
                    var key = domain.key;
                    if (key && !domainKeys[key]) {
                        columns.push(new DomainColumn(domain));
                    }
                }

                // Add a range to the set of columns, if a range
                // with the same key has not yet been inclued.
                function addRange(range) {
                    var key = range.key;
                    if (key && !rangeKeys[key]) {
                        columns.push(new RangeColumn(range));
                    }
                }

                // We cannot proceed if the telemetry controller
                // is not available; clear all rows/columns.
                if (!telemetry) {
                    columns = [];
                    $scope.rows = [];
                    $scope.headers = [];
                    return;
                }

                columns = [ new NameColumn() ];

                // Add domain, range columns
                metadata = telemetry.getMetadata();
                (metadata || []).forEach(function (metadata) {
                    (metadata.domains || []).forEach(addDomain);
                    (metadata.ranges || []).forEach(addRange);
                });

                // Add default domain, range columns if none
                // were described in metadata.
                if (Object.keys(domainKeys).length < 1) {
                    columns.push(new DomainColumn({ name: "Time" }));
                }
                if (Object.keys(rangeKeys).length < 1) {
                    columns.push(new RangeColumn({ name: "Value" }));
                }

                // We have all columns now, so populate the headers
                // for these columns in the scope.
                $scope.headers = columns.map(function (column) {
                    return column.getTitle();
                });

                // Fill in the contents of the rows.
                updateRows();
            }

            $scope.$on("telemetryUpdate", updateRows);
            $scope.$watch("telemetry", setupColumns);
        }

        return ScrollingListController;
    }
);