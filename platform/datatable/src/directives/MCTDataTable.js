/*global define*/

define(
    [],
    function () {
        "use strict";

        function MCTDataTable($timeout) {

            /**
             * Set default values for optional parameters on a given scope
             */
            function setDefaults($scope) {
                if (typeof $scope.enableFilter === 'undefined') {
                    $scope.enableFilter = true;
                    $scope.filters = {};
                }
                if (typeof $scope.enableSort === 'undefined') {
                    $scope.enableSort = true;
                    $scope.sortColumn = undefined;
                    $scope.sortDirection = undefined;
                }
            }

            function link($scope, element) {
                setDefaults($scope);

                var maxDisplayRows = 50;

                $scope.visibleRows = [];
                $scope.overrideRowPositioning = false;

                /**
                 * Returns true if row matches all filters.
                 */
                function matchRow(filters, row) {
                    return Object.keys(filters).every(function(key) {
                        if (!row[key]) {
                            return false;
                        }
                        var testVal = String(row[key]).toLowerCase();
                        return testVal.indexOf(filters[key]) !== -1;
                    });
                }

                /**
                 * Filter rows.
                 */
                function filterRows(rowsToFilter) {
                    if (!Object.keys($scope.filters).length) {
                        return rowsToFilter;
                    }

                    var filters = {};

                    Object.keys($scope.filters).forEach(function(key) {
                        if (!$scope.filters[key]) {
                            return;
                        }
                        filters[key] = $scope.filters[key].toLowerCase();
                    });

                    return rowsToFilter.filter(matchRow.bind(null, filters));
                }

                /**
                 * Compare two variables, returning a number that represents
                 * which is larger.  Similar to the default array sort
                 * comparator, but does not coerce all values to string before
                 * conversion.  Strings are lowercased before comparison.
                 */
                function genericComparator(a, b) {
                    if (typeof a === "string" && typeof b === "string") {
                        a = a.toLowerCase();
                        b = b.toLowerCase();
                    }

                    if (a < b) {
                        return -1;
                    }
                    if (a > b) {
                        return 1;
                    }
                    return 0;
                }

                /**
                 * Returns a new array which is a result of applying the sort
                 * criteria defined in $scope.
                 *
                 * Does not modify the array that was passed in.
                 */
                function sortRows(rowsToSort) {
                    if (!$scope.sortColumn || !$scope.sortDirection) {
                        return rowsToSort;
                    }
                    var sortKey = $scope.sortColumn,
                        sortDirectionMultiplier;

                    if ($scope.sortDirection === 'asc') {
                        sortDirectionMultiplier = 1;
                    } else if ($scope.sortDirection === 'desc') {
                        sortDirectionMultiplier = -1;
                    }

                    return rowsToSort.slice(0).sort(function(a, b) {
                        return genericComparator(a[sortKey], b[sortKey]) *
                            sortDirectionMultiplier;
                    });
                }


                /**
                 * Returns an object which contains the largest values
                 * for each key in the given set of rows.  This is used to
                 * pre-calculate optimal column sizes without having to render
                 * every row.
                 */
                function findLargestRow(rows) {
                    var largestRow = rows.reduce(function (largestRow, row) {
                        Object.keys(row).forEach(function (key) {
                            var currentColumnLength =
                                    (row[key] && row[key].length) ?
                                        row[key].length :
                                        row[key],
                                largestColumnLength =
                                    (largestRow[key] && largestRow[key].length) ?
                                        largestRow[key].length :
                                        largestRow[key];

                            if (currentColumnLength > largestColumnLength) {
                                largestRow[key] = row[key];
                            }
                        });
                        return largestRow;
                    }, JSON.parse(JSON.stringify(rows[0])));

                    // Pad with characters to accomodate variable-width fonts,
                    // and remove characters that would allow word-wrapping.
                    Object.keys(largestRow).forEach(function(key) {
                        var padCharacters,
                            i;

                        largestRow[key] = String(largestRow[key]);
                        padCharacters = largestRow[key].length / 10;
                        for (i = 0; i < padCharacters; i++) {
                            largestRow[key] = largestRow[key] + 'W';
                        }
                        largestRow[key] = largestRow[key]
                            .replace(/[ \-_]/g, 'W');
                    });
                    return largestRow;
                }

                /**
                 * Read styles from the DOM and use them to calculate offsets
                 * for individual rows.
                 */
                function setElementSizes() {
                    var thead = element.find('thead'),
                        tbody = element.find('tbody'),
                        firstRow = tbody.find('tr'),
                        column = firstRow.find('td'),
                        headerHeight = thead.prop('offsetHeight'),
                        rowHeight = firstRow.prop('offsetHeight'),
                        overallHeight = headerHeight + (rowHeight * ($scope.displayRows ? $scope.displayRows.length - 1  : 0));

                    $scope.columnWidths = [];

                    while (column.length) {
                        $scope.columnWidths.push(column.prop('offsetWidth'));
                        column = column.next();
                    }
                    $scope.headerHeight = headerHeight;
                    $scope.rowHeight = rowHeight;
                    $scope.totalHeight = overallHeight;

                    $scope.visibleRows = $scope.displayRows.slice(0, maxDisplayRows).map(function(row, i) {
                        return {
                            rowIndex: i,
                            offsetY: (i * $scope.rowHeight) + $scope.headerHeight,
                            contents: row
                        };
                    });

                    $scope.overrideRowPositioning = true;
                }

                /**
                 * Update rows with new data.  If filtering is enabled, rows
                 * will be sorted before display.
                 */
                function updateRows(newRows) {
                    var largestRow;

                    $scope.visibleRows = [];
                    $scope.displayRows = [];
                    $scope.overrideRowPositioning = false;

                    if (!$scope.displayHeaders) {
                        return;
                    }

                    if ($scope.enableFilter) {
                        $scope.displayRows = newRows = filterRows(newRows);
                    }

                    if ($scope.enableSort) {
                        $scope.displayRows = newRows = sortRows(newRows);
                    }

                    largestRow = findLargestRow(newRows);

                    $scope.visibleRows = [
                        {
                            rowIndex: 0,
                            offsetY: undefined,
                            contents: largestRow
                        }
                    ];
                    $timeout(setElementSizes, 0);
                }

                /**
                 * Update table headers with new headers.  If filtering is
                 * enabled, reset filters.  If sorting is enabled, reset
                 * sorting.
                 */
                function updateHeaders(newHeaders) {
                    $scope.displayHeaders = newHeaders;
                    if ($scope.enableFilter) {
                        $scope.filters = {};
                    }
                    if ($scope.enableSort) {
                        $scope.sortColumn = undefined;
                        $scope.sortDirection = undefined;
                    }
                }

                /**
                 * On scroll, calculate which rows indexes are visible and
                 * ensure that an equal number of rows are preloaded for
                 * scrolling in either direction.
                 */
                function onScroll(event) {
                    var topScroll = event.target.scrollTop,
                        bottomScroll = topScroll + event.target.offsetHeight,
                        firstVisible,
                        lastVisible,
                        totalVisible,
                        numberOffscreen,
                        start,
                        end;

                    if ($scope.displayRows.length < maxDisplayRows) {
                        return;
                    }

                    if (topScroll < $scope.headerHeight) {
                        firstVisible = 0;
                    } else {
                        firstVisible = Math.floor(
                            (topScroll - $scope.headerHeight) / $scope.rowHeight
                        );
                    }
                    lastVisible = Math.ceil(
                        (bottomScroll - $scope.headerHeight) / $scope.rowHeight
                    );

                    totalVisible = lastVisible - firstVisible;
                    numberOffscreen = maxDisplayRows - totalVisible;
                    start = firstVisible - Math.floor(numberOffscreen / 2);
                    end = lastVisible + Math.ceil(numberOffscreen / 2);

                    if (start < 0) {
                        start = 0;
                        end = $scope.visibleRows.length - 1;
                    } else if (end >= $scope.displayRows.length) {
                        end = $scope.displayRows.length - 1;
                        start = end - maxDisplayRows + 1;
                    }
                    if ($scope.visibleRows[0].rowIndex === start &&
                        $scope.visibleRows[$scope.visibleRows.length-1]
                            .rowIndex === end) {

                        return; // don't update if no changes are required.
                    }

                    $scope.visibleRows = $scope.displayRows.slice(start, end)
                        .map(function(row, i) {
                            return {
                                rowIndex: start + i,
                                offsetY: ((start + i) * $scope.rowHeight) +
                                    $scope.headerHeight,
                                contents: row
                            };
                        });

                    $scope.$digest();
                }

                element.find('div').on('scroll', onScroll);
                $scope.toggleSort = function (key) {
                    if (!$scope.enableSort) {
                        return;
                    }
                    if ($scope.sortColumn !== key) {
                        $scope.sortColumn = key;
                        $scope.sortDirection = 'asc';
                    } else if ($scope.sortDirection === 'asc') {
                        $scope.sortDirection = 'desc';
                    } else if ($scope.sortDirection === 'desc') {
                        $scope.sortColumn = undefined;
                        $scope.sortDirection = undefined;
                    }
                    updateRows($scope.rows);
                };

                $scope.$watchCollection('filters', function () {
                    updateRows($scope.rows);
                });
                $scope.$watch('headers', updateHeaders);
                $scope.$watch('rows', updateRows);
            }

            return {
                restrict: "E",
                templateUrl: "platform/datatable/res/templates/mct-data-table.html",
                link: link,
                scope: {
                    headers: "=",
                    rows: "=",
                    enableFilter: "=?",
                    enableSort: "=?"
                }
            };
        }

        return MCTDataTable;
    }
);
