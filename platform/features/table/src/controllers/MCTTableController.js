
define(
    [],
    function () {

        function MCTTableController($scope, $timeout, element) {
            var self = this;

            this.$scope = $scope;
            this.element = element;
            this.$timeout = $timeout;
            this.maxDisplayRows = 50;

            $scope.visibleRows = [];
            $scope.overrideRowPositioning = false;

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

            setDefaults($scope);

            element.find('div').on('scroll', this.onScroll.bind(this));

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
                self.updateRows($scope.rows);
            };

            $scope.$watchCollection('filters', function () {
                self.updateRows(self.$scope.rows);
            });
            $scope.$watchCollection('headers', this.updateHeaders.bind(this));
            $scope.$watchCollection('rows', this.updateRows.bind(this));
        }

        /**
         * On scroll, calculate which rows indexes are visible and
         * ensure that an equal number of rows are preloaded for
         * scrolling in either direction.
         */
        MCTTableController.prototype.onScroll = function (event) {
            var self = this,
                topScroll = event.target.scrollTop,
                bottomScroll = topScroll + event.target.offsetHeight,
                firstVisible,
                lastVisible,
                totalVisible,
                numberOffscreen,
                start,
                end;

            if (this.$scope.displayRows.length < this.maxDisplayRows) {
                return;
            }

            if (topScroll < this.$scope.headerHeight) {
                firstVisible = 0;
            } else {
                firstVisible = Math.floor(
                    (topScroll - this.$scope.headerHeight) / this.$scope.rowHeight
                );
            }
            lastVisible = Math.ceil(
                (bottomScroll - this.$scope.headerHeight) / this.$scope.rowHeight
            );

            totalVisible = lastVisible - firstVisible;
            numberOffscreen = this.maxDisplayRows - totalVisible;
            start = firstVisible - Math.floor(numberOffscreen / 2);
            end = lastVisible + Math.ceil(numberOffscreen / 2);

            if (start < 0) {
                start = 0;
                end = this.$scope.visibleRows.length - 1;
            } else if (end >= this.$scope.displayRows.length) {
                end = this.$scope.displayRows.length - 1;
                start = end - this.maxDisplayRows + 1;
            }
            if (this.$scope.visibleRows[0].rowIndex === start &&
                this.$scope.visibleRows[this.$scope.visibleRows.length-1]
                    .rowIndex === end) {

                return; // don't update if no changes are required.
            }

            this.$scope.visibleRows = this.$scope.displayRows.slice(start, end)
                .map(function(row, i) {
                    return {
                        rowIndex: start + i,
                        offsetY: ((start + i) * self.$scope.rowHeight) +
                        self.$scope.headerHeight,
                        contents: row
                    };
                });

            this.$scope.$digest();
        };

        /**
         * Update table headers with new headers.  If filtering is
         * enabled, reset filters.  If sorting is enabled, reset
         * sorting.
         */
        MCTTableController.prototype.updateHeaders = function (newHeaders) {
            if (!newHeaders){
                return;
            }

            this.$scope.displayHeaders = newHeaders;
            if (this.$scope.enableFilter) {
                this.$scope.filters = {};
            }
            // Reset column sort information unless the new headers
            // contain the column current sorted on.
            if (this.$scope.enableSort && newHeaders.indexOf(this.$scope.sortColumn) === -1) {
                this.$scope.sortColumn = undefined;
                this.$scope.sortDirection = undefined;
            }
            this.updateRows(this.$scope.rows);
        };

        /**
         * Read styles from the DOM and use them to calculate offsets
         * for individual rows.
         */
        MCTTableController.prototype.setElementSizes = function () {
            var self = this,
                thead = this.element.find('thead'),
                tbody = this.element.find('tbody'),
                firstRow = tbody.find('tr'),
                column = firstRow.find('td'),
                headerHeight = thead.prop('offsetHeight'),
                //row height is hard-coded for now.
                rowHeight = 20,
                overallHeight = headerHeight + (rowHeight * (this.$scope.displayRows ? this.$scope.displayRows.length - 1  : 0));

            this.$scope.columnWidths = [];

            while (column.length) {
                this.$scope.columnWidths.push(column.prop('offsetWidth'));
                column = column.next();
            }
            this.$scope.headerHeight = headerHeight;
            this.$scope.rowHeight = rowHeight;
            this.$scope.totalHeight = overallHeight;

            this.$scope.visibleRows = this.$scope.displayRows.slice(0, this.maxDisplayRows).map(function(row, i) {
                return {
                    rowIndex: i,
                    offsetY: (i * self.$scope.rowHeight) + self.$scope.headerHeight,
                    contents: row
                };
            });

            this.$scope.overrideRowPositioning = true;
        };

        /**
         * Returns a new array which is a result of applying the sort
         * criteria defined in $scope.
         *
         * Does not modify the array that was passed in.
         */
        MCTTableController.prototype.sortRows = function(rowsToSort) {
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

            if (!this.$scope.sortColumn || !this.$scope.sortDirection) {
                return rowsToSort;
            }
            var sortKey = this.$scope.sortColumn,
                sortDirectionMultiplier;

            if (this.$scope.sortDirection === 'asc') {
                sortDirectionMultiplier = 1;
            } else if (this.$scope.sortDirection === 'desc') {
                sortDirectionMultiplier = -1;
            }

            return rowsToSort.slice(0).sort(function(a, b) {
                //If the values to compare can be compared as
                // numbers, do so. String comparison of number
                // values can cause inconsistencies
                var valA = isNaN(a[sortKey].text) ? a[sortKey].text : parseFloat(a[sortKey].text),
                    valB = isNaN(b[sortKey].text) ? b[sortKey].text : parseFloat(b[sortKey].text);

                return genericComparator(valA, valB) *
                    sortDirectionMultiplier;
            });
        };

        /**
         * Returns an object which contains the largest values
         * for each key in the given set of rows.  This is used to
         * pre-calculate optimal column sizes without having to render
         * every row.
         */
        MCTTableController.prototype.findLargestRow = function(rows) {
            var largestRow = rows.reduce(function (largestRow, row) {
                Object.keys(row).forEach(function (key) {
                    var currentColumn = row[key].text,
                        currentColumnLength =
                            (currentColumn && currentColumn.length) ?
                                currentColumn.length :
                                currentColumn,
                        largestColumn = largestRow[key].text,
                        largestColumnLength =
                            (largestColumn && largestColumn.length) ?
                                largestColumn.length :
                                largestColumn;

                    if (currentColumnLength > largestColumnLength) {
                        largestRow[key] = JSON.parse(JSON.stringify(row[key]));
                    }
                });
                return largestRow;
            }, JSON.parse(JSON.stringify(rows[0] || {})));

            // Pad with characters to accomodate variable-width fonts,
            // and remove characters that would allow word-wrapping.
            largestRow = JSON.parse(JSON.stringify(largestRow));
            Object.keys(largestRow).forEach(function(key) {
                var padCharacters,
                    i;

                largestRow[key].text = String(largestRow[key].text);
                padCharacters = largestRow[key].text.length / 10;
                for (i = 0; i < padCharacters; i++) {
                    largestRow[key].text = largestRow[key].text + 'W';
                }
                largestRow[key].text = largestRow[key].text
                    .replace(/[ \-_]/g, 'W');
            });
            return largestRow;
        };

        MCTTableController.prototype.resize = function (){
            var largestRow = this.findLargestRow(this.$scope.displayRows);
            this.$scope.visibleRows = [
                {
                    rowIndex: 0,
                    offsetY: undefined,
                    contents: largestRow
                }
            ];

            this.$timeout(this.setElementSizes.bind(this));
        };

        /**
         * Update rows with new data.  If filtering is enabled, rows
         * will be sorted before display.
         */
        MCTTableController.prototype.updateRows = function (newRows) {
            var displayRows = newRows;
            this.$scope.visibleRows = [];
            this.$scope.overrideRowPositioning = false;

            if (!this.$scope.displayHeaders) {
                return;
            }

            if (this.$scope.enableFilter) {
                displayRows = this.filterRows(displayRows);
            }

            if (this.$scope.enableSort) {
                displayRows = this.sortRows(displayRows);
            }
            this.$scope.displayRows = displayRows;
            this.resize();
        };

        /**
         * Filter rows.
         */
        MCTTableController.prototype.filterRows = function(rowsToFilter) {
            var filters = {},
                self = this;

            /**
             * Returns true if row matches all filters.
             */
            function matchRow(filters, row) {
                return Object.keys(filters).every(function(key) {
                    if (!row[key]) {
                        return false;
                    }
                    var testVal = String(row[key].text).toLowerCase();
                    return testVal.indexOf(filters[key]) !== -1;
                });
            }

            if (!Object.keys(this.$scope.filters).length) {
                return rowsToFilter;
            }

            Object.keys(this.$scope.filters).forEach(function(key) {
                if (!self.$scope.filters[key]) {
                    return;
                }
                filters[key] = self.$scope.filters[key].toLowerCase();
            });

            return rowsToFilter.filter(matchRow.bind(null, filters));
        };


        return MCTTableController;
    }
);
