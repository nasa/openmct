/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * A controller for the MCTTable directive. Populates scope with
         * data used for populating, sorting, and filtering
         * tables.
         * @param $scope
         * @param $timeout
         * @param element
         * @constructor
         */
        function MCTTableController($scope, $timeout, element) {
            var self = this;

            this.$scope = $scope;
            this.element = element;
            this.$timeout = $timeout;
            this.maxDisplayRows = 50;

            this.scrollable = element.find('div');
            this.scrollable.on('scroll', this.onScroll.bind(this));

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

            /*
             * Define watches to listen for changes to headers and rows.
             */
            $scope.$watchCollection('filters', function () {
                self.updateRows($scope.rows);
            });
            $scope.$watch('headers', this.updateHeaders.bind(this));
            $scope.$watch('rows', this.updateRows.bind(this));

            /*
             * Listen for rows added individually (eg. for real-time tables)
             */
            $scope.$on('addRow', this.newRow.bind(this));
        }

        /**
         * If auto-scroll is enabled, this function will scroll to the
         * bottom of the page
         * @private
         */
        MCTTableController.prototype.scrollToBottom = function() {
            var self = this;

            //Use timeout to defer execution until next digest when any
            // pending UI changes have completed, eg. a new row in the table.
            if (this.$scope.autoScroll) {
                this.$timeout(function(){
                        self.scrollable[0].scrollTop = self.scrollable[0].scrollHeight;
                });
            }
        };

        /**
         * Handles a row add event. Rows can be added as needed using the
         * `addRow` broadcast event.
         * @private
         */
        MCTTableController.prototype.newRow = function (event, row) {
            //Add row to the filtered, sorted list of all rows
            if (this.filterRows([row]).length > 0) {
                this.insertSorted(this.$scope.displayRows, row);
            }

            //Keep 'rows' synchronized as it provides the unsorted,
            // unfiltered model for this view
            if (!this.$scope.rows) {
                this.$scope.rows = [];
            }
            this.$scope.rows.push(row);

            this.$timeout(this.setElementSizes.bind(this))
                .then(this.scrollToBottom.bind(this));
        };

        /**
         * @private
         */
        MCTTableController.prototype.onScroll = function (event) {
            //If user scrolls away from bottom, disable auto-scroll.
            // Auto-scroll will be re-enabled if user scrolls to bottom again.
            if (this.scrollable[0].scrollTop < (this.scrollable[0].scrollHeight - this.scrollable[0].offsetHeight)) {
                    this.$scope.autoScroll = false;
            } else {
                this.$scope.autoScroll = true;
            }
            this.setVisibleRows();
            this.$scope.$digest();
        };

        /**
         * Sets visible rows based on array
         * content and current scroll state.
         */
        MCTTableController.prototype.setVisibleRows = function () {
            var self = this,
                target = this.scrollable[0],
                topScroll = target.scrollTop,
                bottomScroll = topScroll + target.offsetHeight,
                firstVisible,
                lastVisible,
                totalVisible,
                numberOffscreen,
                start,
                end;

            //No need to scroll
            if (this.$scope.displayRows.length < this.maxDisplayRows) {
                //Check whether need to resynchronize visible with display
                // rows (if data added)
                if (this.$scope.visibleRows.length != this.$scope.displayRows.length){
                    start = 0;
                    end = this.$scope.displayRows.length;
                } else {
                    //Data is in sync, and no need to calculate scroll,
                    // so do nothing.
                    return;
                }
            } else {
                //rows has exceeded display maximum, so may be necessary to
                // scroll
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
                    end = Math.min(this.maxDisplayRows, this.$scope.displayRows.length);
                } else if (end >= this.$scope.displayRows.length) {
                    end = this.$scope.displayRows.length;
                    start = end - this.maxDisplayRows + 1;
                }
                if (this.$scope.visibleRows[0] && this.$scope.visibleRows[0].rowIndex === start &&
                    this.$scope.visibleRows[this.$scope.visibleRows.length - 1]
                        .rowIndex === end) {

                    return; // don't update if no changes are required.
                }
            }
            //Set visible rows from display rows, based on calculated offset.
            this.$scope.visibleRows = this.$scope.displayRows.slice(start, end)
                .map(function(row, i) {
                    return {
                        rowIndex: start + i,
                        offsetY: ((start + i) * self.$scope.rowHeight) +
                        self.$scope.headerHeight,
                        contents: row
                    };
                });
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
            // contain the column currently sorted on.
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
            this.setVisibleRows();
            this.$scope.overrideRowPositioning = true;
        };

        /**
         * @private
         */
        MCTTableController.prototype.insertSorted = function(array, element) {
            var index = -1,
                self = this,
                sortKey = this.$scope.sortColumn;

            function binarySearch(searchArray, searchElement, min, max){
                var sampleAt = Math.floor((max - min) / 2) + min,
                    valA,
                    valB;
                if (max < min) {
                    return min; // Element is not in array, min gives direction
                }

                valA = isNaN(searchElement[sortKey].text) ? searchElement[sortKey].text : parseFloat(searchElement[sortKey].text);
                valB = isNaN(searchArray[sampleAt][sortKey].text) ? searchArray[sampleAt][sortKey].text : searchArray[sampleAt][sortKey].text;

                switch(self.sortComparator(valA, valB)) {
                    case -1:
                        return binarySearch(searchArray, searchElement, min, sampleAt - 1);
                    case 0 :
                        return sampleAt;
                    case 1 :
                        return binarySearch(searchArray, searchElement, sampleAt + 1, max);
                }
            }

            if (!this.$scope.sortColumn || !this.$scope.sortDirection) {
                //No sorting applied, push it on the end.
                index = array.length;
            } else {
                //Sort is enabled, perform binary search to find insertion point
                index = binarySearch(array, element, 0, array.length - 1);
            }
            if (index === -1){
                array.unshift(element);
            } else if (index === array.length){
                array.push(element);
            } else {
                array.splice(index, 0, element);
            }
        };

        /**
         * Compare two variables, returning a number that represents
         * which is larger.  Similar to the default array sort
         * comparator, but does not coerce all values to string before
         * conversion.  Strings are lowercased before comparison.
         *
         * @private
         */
        MCTTableController.prototype.sortComparator = function(a, b) {
            var result = 0,
                sortDirectionMultiplier;

            if (typeof a === "string" && typeof b === "string") {
                a = a.toLowerCase();
                b = b.toLowerCase();
            }

            if (a < b) {
                result = -1;
            }
            if (a > b) {
                result = 1;
            }

            if (this.$scope.sortDirection === 'asc') {
                sortDirectionMultiplier = 1;
            } else if (this.$scope.sortDirection === 'desc') {
                sortDirectionMultiplier = -1;
            }

            return result * sortDirectionMultiplier;
        };

        /**
         * Returns a new array which is a result of applying the sort
         * criteria defined in $scope.
         *
         * Does not modify the array that was passed in.
         */
        MCTTableController.prototype.sortRows = function(rowsToSort) {
            var self = this,
                sortKey = this.$scope.sortColumn;

            if (!this.$scope.sortColumn || !this.$scope.sortDirection) {
                return rowsToSort;
            }

            return rowsToSort.slice(0).sort(function(a, b) {
                //If the values to compare can be compared as
                // numbers, do so. String comparison of number
                // values can cause inconsistencies
                var valA = isNaN(a[sortKey].text) ? a[sortKey].text : parseFloat(a[sortKey].text),
                    valB = isNaN(b[sortKey].text) ? b[sortKey].text : parseFloat(b[sortKey].text);

                return self.sortComparator(valA, valB);
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

            largestRow = JSON.parse(JSON.stringify(largestRow));

            // Pad with characters to accomodate variable-width fonts,
            // and remove characters that would allow word-wrapping.
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

        /**
         * Calculates the widest row in the table, pads that row, and adds
         * it to the table. Allows the table to size itself, then uses this
         * as basis for column dimensions.
         * @private
         */
        MCTTableController.prototype.resize = function (){
            var largestRow = this.findLargestRow(this.$scope.displayRows),
                self = this;
            this.$scope.visibleRows = [
                {
                    rowIndex: 0,
                    offsetY: undefined,
                    contents: largestRow
                }
            ];

            //Wait a timeout to allow digest of previous change to visible
            // rows to happen.
            this.$timeout(function() {
                //Remove temporary padding row used for setting column widths
                self.$scope.visibleRows = [];
                self.setElementSizes();
            });
        };

        /**
         * @priate
         */
        MCTTableController.prototype.filterAndSort = function(rows) {
            var displayRows = rows;
            if (this.$scope.enableFilter) {
                displayRows = this.filterRows(displayRows);
            }

            if (this.$scope.enableSort) {
                displayRows = this.sortRows(displayRows);
            }
            this.$scope.displayRows = displayRows;
        };

        /**
         * Update rows with new data.  If filtering is enabled, rows
         * will be sorted before display.
         */
        MCTTableController.prototype.updateRows = function (newRows) {
            //Reset visible rows because new row data available.
            this.$scope.visibleRows = [];

            this.$scope.overrideRowPositioning = false;

            //Nothing to show because no columns visible
            if (!this.$scope.displayHeaders) {
                return;
            }

            //Apply filters and sort a copy of the the new rows
            this.filterAndSort((newRows || []).slice(0));
            //Resize columns appropriately
            this.resize();
        };

        /**
         * Applies user defined filters to rows. These filters are based on
         * the text entered in the search areas in each column
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
