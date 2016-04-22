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
            this.thead = element.find('thead');
            this.tbody = element.find('tbody');
            this.$scope.sizingRow = {};

            this.scrollable.on('scroll', this.onScroll.bind(this));

            $scope.visibleRows = [];

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
                self.setRows($scope.rows);
            };

            /*
             * Define watches to listen for changes to headers and rows.
             */
            $scope.$watchCollection('filters', function () {
                self.setRows($scope.rows);
            });
            $scope.$watch('headers', this.setHeaders.bind(this));
            $scope.$watch('rows', this.setRows.bind(this));

            /*
             * Listen for rows added individually (eg. for real-time tables)
             */
            $scope.$on('add:row', this.addRow.bind(this));
            $scope.$on('remove:row', this.removeRow.bind(this));
        }

        /**
         * If auto-scroll is enabled, this function will scroll to the
         * bottom of the page
         * @private
         */
        MCTTableController.prototype.scrollToBottom = function () {
            var self = this;

            //Use timeout to defer execution until next digest when any
            // pending UI changes have completed, eg. a new row in the table.
            if (this.$scope.autoScroll) {
                this.$timeout(function (){
                        self.scrollable[0].scrollTop = self.scrollable[0].scrollHeight;
                });
            }
        };

        /**
         * Handles a row add event. Rows can be added as needed using the
         * `add:row` broadcast event.
         * @private
         */
        MCTTableController.prototype.addRow = function (event, rowIndex) {
            var row = this.$scope.rows[rowIndex];

            //Does the row pass the current filter?
            if (this.filterRows([row]).length === 1) {
                //Insert the row into the correct position in the array
                this.insertSorted(this.$scope.displayRows, row);
                
                //Resize the columns , then update the rows visible in the table
                this.resize([this.$scope.sizingRow, row])
                    .then(this.setVisibleRows.bind(this))
                    .then(this.scrollToBottom.bind(this));
            }
        };

        /**
         * Handles a row remove event. Rows can be removed as needed using the
         * `remove:row` broadcast event.
         * @private
         */
        MCTTableController.prototype.removeRow = function (event, rowIndex) {
            var row = this.$scope.rows[rowIndex],
                // Do a sequential search here. Only way of finding row is by
                // object equality, so array is in effect unsorted.
                indexInDisplayRows = this.$scope.displayRows.indexOf(row);
                if (indexInDisplayRows != -1) {
                    this.$scope.displayRows.splice(indexInDisplayRows, 1);
                    this.setVisibleRows();
                }
        };

        /**
         * @private
         */
        MCTTableController.prototype.onScroll = function (event) {
            //If user scrolls away from bottom, disable auto-scroll.
            // Auto-scroll will be re-enabled if user scrolls to bottom again.
            if (this.scrollable[0].scrollTop <
                (this.scrollable[0].scrollHeight - this.scrollable[0].offsetHeight)) {
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
                if (this.$scope.visibleRows.length !=
                    this.$scope.displayRows.length){
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
                        (topScroll - this.$scope.headerHeight) /
                        this.$scope.rowHeight
                    );
                }
                lastVisible = Math.ceil(
                    (bottomScroll - this.$scope.headerHeight) /
                    this.$scope.rowHeight
                );

                totalVisible = lastVisible - firstVisible;
                numberOffscreen = this.maxDisplayRows - totalVisible;
                start = firstVisible - Math.floor(numberOffscreen / 2);
                end = lastVisible + Math.ceil(numberOffscreen / 2);

                if (start < 0) {
                    start = 0;
                    end = Math.min(this.maxDisplayRows,
                        this.$scope.displayRows.length);
                } else if (end >= this.$scope.displayRows.length) {
                    end = this.$scope.displayRows.length;
                    start = end - this.maxDisplayRows + 1;
                }
                if (this.$scope.visibleRows[0] &&
                    this.$scope.visibleRows[0].rowIndex === start &&
                    this.$scope.visibleRows[this.$scope.visibleRows.length - 1]
                        .rowIndex === end) {

                    return; // don't update if no changes are required.
                }
            }
            //Set visible rows from display rows, based on calculated offset.
            this.$scope.visibleRows = this.$scope.displayRows.slice(start, end)
                .map(function (row, i) {
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
        MCTTableController.prototype.setHeaders = function (newHeaders) {
            if (!newHeaders){
                return;
            }

            this.$scope.displayHeaders = newHeaders;
            if (this.$scope.enableFilter) {
                this.$scope.filters = {};
            }
            // Reset column sort information unless the new headers
            // contain the column currently sorted on.
            if (this.$scope.enableSort &&
                newHeaders.indexOf(this.$scope.sortColumn) === -1) {
                    this.$scope.sortColumn = undefined;
                    this.$scope.sortDirection = undefined;
            }
            this.setRows(this.$scope.rows);
        };

        /**
         * Read styles from the DOM and use them to calculate offsets
         * for individual rows.
         */
        MCTTableController.prototype.setElementSizes = function () {
            var thead = this.thead,
                tbody = this.tbody,
                firstRow = tbody.find('tr'),
                column = firstRow.find('td'),
                headerHeight = thead.prop('offsetHeight'),
                rowHeight = firstRow.prop('offsetHeight'),
                columnWidth,
                tableWidth = 0,
                overallHeight = headerHeight + (rowHeight *
                    (this.$scope.displayRows ? this.$scope.displayRows.length - 1  : 0));

            this.$scope.columnWidths = [];

            while (column.length) {
                columnWidth = column.prop('offsetWidth');
                this.$scope.columnWidths.push(column.prop('offsetWidth'));
                tableWidth += columnWidth;
                column = column.next();
            }
            this.$scope.headerHeight = headerHeight;
            this.$scope.rowHeight = rowHeight;
            this.$scope.totalHeight = overallHeight;

            if (tableWidth > 0) {
                this.$scope.totalWidth = tableWidth + 'px';
            } else {
                this.$scope.totalWidth = 'none';
            }
        };

        /**
         * @private
         */
        MCTTableController.prototype.insertSorted = function (array, element) {
            var index = -1,
                self = this,
                sortKey = this.$scope.sortColumn;

            function binarySearch(searchArray, searchElement, min, max){
                var sampleAt = Math.floor((max - min) / 2) + min;

                if (max < min) {
                    return min; // Element is not in array, min gives direction
                }

                switch(self.sortComparator(searchElement[sortKey].text,
                    searchArray[sampleAt][sortKey].text)) {
                    case -1:
                        return binarySearch(searchArray, searchElement, min,
                            sampleAt - 1);
                    case 0 :
                        return sampleAt;
                    case 1 :
                        return binarySearch(searchArray, searchElement,
                            sampleAt + 1, max);
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
        MCTTableController.prototype.sortComparator = function (a, b) {
            var result = 0,
                sortDirectionMultiplier,
                numberA,
                numberB;
            /**
             * Given a value, if it is a number, or a string representation of a
             * number, then return a number representation. Otherwise, return
             * the original value. It's a little more robust than using just
             * Number() or parseFloat, or isNaN in isolation, all of which are
             * fairly inconsistent in their results.
             * @param value The value to return as a number.
             * @returns {*} The value cast to a Number, or the original value if
             * a Number representation is not possible.
             */
            function toNumber (value){
                var val = !isNaN(Number(value)) && !isNaN(parseFloat(value)) ? Number(value) : value;
                return val;
            }

            numberA = toNumber(a);
            numberB = toNumber(b);

            //If they're both numbers, then compare them as numbers
            if (typeof numberA === "number" && typeof numberB === "number") {
                a = numberA;
                b = numberB;
            }

            //If they're both strings, then ignore case
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
        MCTTableController.prototype.sortRows = function (rowsToSort) {
            var self = this,
                sortKey = this.$scope.sortColumn;

            if (!this.$scope.sortColumn || !this.$scope.sortDirection) {
                return rowsToSort;
            }

            return rowsToSort.sort(function (a, b) {
                return self.sortComparator(a[sortKey].text, b[sortKey].text);
            });
        };

        /**
         * Returns an object which contains the largest values
         * for each key in the given set of rows.  This is used to
         * pre-calculate optimal column sizes without having to render
         * every row.
         */
        MCTTableController.prototype.buildLargestRow = function (rows) {
            var largestRow = rows.reduce(function (prevLargest, row) {
                Object.keys(row).forEach(function (key) {
                    var currentColumn,
                        currentColumnLength,
                        largestColumn,
                        largestColumnLength;
                    if (row[key]){
                        currentColumn = (row[key]).text;
                        currentColumnLength =
                            (currentColumn && currentColumn.length) ?
                                currentColumn.length :
                                currentColumn;
                        largestColumn = prevLargest[key] ? prevLargest[key].text : "";
                        largestColumnLength = largestColumn.length;

                        if (currentColumnLength > largestColumnLength) {
                            prevLargest[key] = JSON.parse(JSON.stringify(row[key]));
                        }
                    }
                });
                return prevLargest;
            }, JSON.parse(JSON.stringify(rows[0] || {})));
            return largestRow;
        };

        /**
         * Calculates the widest row in the table, and if necessary, resizes
         * the table accordingly
         *
         * @param rows the rows on which to resize
         * @returns {Promise} a promise that will resolve when resizing has
         * occurred.
         * @private
         */
        MCTTableController.prototype.resize = function (rows) {
            this.$scope.sizingRow = this.buildLargestRow(rows);
            return this.$timeout(this.setElementSizes.bind(this));
        };

        /**
         * @private
         */
        MCTTableController.prototype.filterAndSort = function (rows) {
            var displayRows = rows;
            if (this.$scope.enableFilter) {
                displayRows = this.filterRows(displayRows);
            }

            if (this.$scope.enableSort) {
                displayRows = this.sortRows(displayRows.slice(0));
            }
            return displayRows;
        };

        /**
         * Update rows with new data.  If filtering is enabled, rows
         * will be sorted before display.
         */
        MCTTableController.prototype.setRows = function (newRows) {
            //Nothing to show because no columns visible
            if (!this.$scope.displayHeaders || !newRows) {
                return;
            }

            this.$scope.displayRows = this.filterAndSort(newRows || []);
            this.resize(newRows).then(this.setVisibleRows.bind(this));
        };

        /**
         * Applies user defined filters to rows. These filters are based on
         * the text entered in the search areas in each column.
         * @param rowsToFilter {Object[]} The rows to apply filters to
         * @returns {Object[]} A filtered copy of the supplied rows
         */
        MCTTableController.prototype.filterRows = function (rowsToFilter) {
            var filters = {},
                self = this;

            /**
             * Returns true if row matches all filters.
             */
            function matchRow(filters, row) {
                return Object.keys(filters).every(function (key) {
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

            Object.keys(this.$scope.filters).forEach(function (key) {
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
