
define(
    ['zepto'],
    function ($) {

        /**
         * A controller for the MCTTable directive. Populates scope with
         * data used for populating, sorting, and filtering
         * tables.
         * @param $scope
         * @param $timeout
         * @param element
         * @constructor
         */
        function MCTTableController($scope, $window, element, exportService, formatService, openmct) {
            var self = this;

            this.$scope = $scope;
            this.element = $(element[0]);
            this.$window = $window;
            this.maxDisplayRows = 50;

            this.scrollable = this.element.find('.l-view-section.scrolling').first();
            this.resultsHeader = this.element.find('.mct-table>thead').first();
            this.sizingTableBody = this.element.find('.sizing-table>tbody').first();
            this.$scope.sizingRow = {};
            this.conductor = openmct.conductor;
            this.toiFormatter = undefined;
            this.formatService = formatService;
            this.callbacks = {};

            //Bind all class functions to 'this'
            _.bindAll(this, [
                'destroyConductorListeners',
                'changeTimeSystem',
                'scrollToBottom',
                'addRow',
                'removeRow',
                'onScroll',
                'firstVisible',
                'lastVisible',
                'setVisibleRows',
                'setHeaders',
                'setElementSizes',
                'binarySearch',
                'insertSorted',
                'sortComparator',
                'sortRows',
                'buildLargestRow',
                'resize',
                'filterAndSort',
                'setRows',
                'filterRows',
                'scrollToRow',
                'setTimeOfInterestRow',
                'changeTimeOfInterest',
                'changeBounds',
                'onRowClick',
                'digest'
            ]);

            this.scrollable.on('scroll', this.onScroll);

            $scope.visibleRows = [];

            /**
             * Set default values for optional parameters on a given scope
             */
            function setDefaults(scope) {
                if (typeof scope.enableFilter === 'undefined') {
                    scope.enableFilter = true;
                    scope.filters = {};
                }
                if (typeof scope.enableSort === 'undefined') {
                    scope.enableSort = true;
                    scope.sortColumn = undefined;
                    scope.sortDirection = undefined;
                }
                if (scope.sortColumn !== undefined) {
                    scope.sortDirection = "asc";
                }
            }

            setDefaults($scope);

            $scope.exportAsCSV = function () {
                var headers = $scope.displayHeaders;
                exportService.exportCSV($scope.displayRows.map(function (row) {
                    return headers.reduce(function (r, header) {
                        r[header] = row[header].text;
                        return r;
                    }, {});
                }), { headers: headers });
            };

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
                } else if ($scope.sortColumn !== undefined &&
                    $scope.sortDirection === undefined) {
                    $scope.sortDirection = 'asc';
                }
                self.setRows($scope.rows);
                self.setTimeOfInterestRow(self.conductor.timeOfInterest());
            };

            /*
             * Define watches to listen for changes to headers and rows.
             */
            $scope.$watchCollection('filters', function () {
                self.setRows($scope.rows);
            });
            $scope.$watch('headers', this.setHeaders);
            $scope.$watch('rows', this.setRows);

            /*
             * Listen for rows added individually (eg. for real-time tables)
             */
            $scope.$on('add:row', this.addRow);
            $scope.$on('remove:row', this.removeRow);

            /**
             * Populated from the default-sort attribute on MctTable
             * directive tag.
             */
            $scope.$watch('defaultSort', function (newColumn, oldColumn) {
                if (newColumn !== oldColumn) {
                    $scope.toggleSort(newColumn)
                }
            });

            /*
             * Listen for resize events to trigger recalculation of table width
             */
            $scope.resize = this.setElementSizes;

            /**
             * Scope variable that is populated from the 'time-columns'
             * attribute on the MctTable tag. Indicates which columns, while
             * sorted, can be used for indicated time of interest.
             */
            $scope.$watch("timeColumns", function (timeColumns) {
                if (timeColumns) {
                    this.destroyConductorListeners();

                    this.conductor.on('timeSystem', this.changeTimeSystem);
                    this.conductor.on('timeOfInterest', this.changeTimeOfInterest);
                    this.conductor.on('bounds', this.changeBounds);

                    // If time system defined, set initially
                    if (this.conductor.timeSystem()) {
                        this.changeTimeSystem(this.conductor.timeSystem());
                    }
                }
            }.bind(this));

            console.log('constructed');

            $scope.$on('$destroy', function() {
                this.scrollable.off('scroll', this.onScroll);
                this.destroyConductorListeners();

                // In case for some reason this controller instance lingers around,
                // destroy scope as it can be extremely large for large tables.
                delete this.$scope;

            }.bind(this));
        };

        MCTTableController.prototype.destroyConductorListeners = function () {
            this.conductor.off('timeSystem', this.changeTimeSystem);
            this.conductor.off('timeOfInterest', this.changeTimeOfInterest);
            this.conductor.off('bounds', this.changeBounds);
        };

        MCTTableController.prototype.changeTimeSystem = function () {
            var format = this.conductor.timeSystem().formats()[0];
            this.toiFormatter = this.formatService.getFormat(format);
        };

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
                this.digest(function () {
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

                var toi = this.conductor.timeOfInterest();
                if (toi !== -1) {
                    this.setTimeOfInterestRow(toi);
                }

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
            if (indexInDisplayRows !== -1) {
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
         * Return first visible row, based on current scroll state.
         * @private
         */
        MCTTableController.prototype.firstVisible = function () {
            var target = this.scrollable[0],
                topScroll = target.scrollTop,
                firstVisible;

            if (topScroll < this.$scope.headerHeight) {
                firstVisible = 0;
            } else {
                firstVisible = Math.floor(
                    (topScroll - this.$scope.headerHeight) /
                    this.$scope.rowHeight
                );
            }

            return firstVisible;
        };

        /**
         * Return last visible row, based on current scroll state.
         * @private
         */
        MCTTableController.prototype.lastVisible = function () {
            var target = this.scrollable[0],
                topScroll = target.scrollTop,
                bottomScroll = topScroll + target.offsetHeight,
                lastVisible;

            lastVisible = Math.ceil(
                (bottomScroll - this.$scope.headerHeight) /
                this.$scope.rowHeight
            );
            return lastVisible;
        };

        /**
         * Sets visible rows based on array
         * content and current scroll state.
         */
        MCTTableController.prototype.setVisibleRows = function () {
            var self = this,
                totalVisible,
                numberOffscreen,
                firstVisible,
                lastVisible,
                start,
                end;

            //No need to scroll
            if (this.$scope.displayRows.length < this.maxDisplayRows) {
                start = 0;
                end = this.$scope.displayRows.length;
            } else {
                firstVisible = this.firstVisible();
                lastVisible = this.lastVisible();
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
            if (!newHeaders) {
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
            var thead = this.resultsHeader,
                tbody = this.sizingTableBody,
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
        MCTTableController.prototype.binarySearch = function (searchArray, searchElement, min, max) {
            var sampleAt = Math.floor((max - min) / 2) + min;

            if (max < min) {
                return min; // Element is not in array, min gives direction
            }
            switch (this.sortComparator(searchElement,
                searchArray[sampleAt][this.$scope.sortColumn].text)) {
                case -1:
                    return this.binarySearch(searchArray, searchElement, min,
                        sampleAt - 1);
                case 0 :
                    return sampleAt;
                case 1 :
                    return this.binarySearch(searchArray, searchElement,
                        sampleAt + 1, max);
            }
        };

        /**
         * @private
         */
        MCTTableController.prototype.insertSorted = function (array, element) {
            var index = -1;

            if (!this.$scope.sortColumn || !this.$scope.sortDirection) {
                //No sorting applied, push it on the end.
                index = array.length;
            } else {
                //Sort is enabled, perform binary search to find insertion point
                index = this.binarySearch(array, element[this.$scope.sortColumn].text, 0, array.length - 1);
            }
            if (index === -1) {
                array.unshift(element);
            } else if (index === array.length) {
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
            function toNumber(value) {
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
                    if (row[key]) {
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

        MCTTableController.prototype.digest = function (callback) {
            var scope = this.$scope;
            var callbacks = this.callbacks;
            var requestAnimationFrame = this.$window.requestAnimationFrame;

            var promise = callbacks[callback];

            if (!promise){
                promise = new Promise(function (resolve) {
                    requestAnimationFrame(function() {
                        scope.$digest();
                        delete callbacks[callback];
                        resolve(callback && callback());
                    });
                });
                callbacks[callback] = promise;
            }

            return promise;
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
            return this.digest(this.setElementSizes);
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
            this.resize(newRows)
                .then(this.setVisibleRows)
                //Timeout following setVisibleRows to allow digest to
                // perform DOM changes, otherwise scrollTo won't work.
                .then(this.digest)
                .then(function () {
                    //If TOI specified, scroll to it
                    var timeOfInterest = this.conductor.timeOfInterest();
                    if (timeOfInterest) {
                        this.setTimeOfInterestRow(timeOfInterest);
                        this.scrollToRow(this.$scope.toiRowIndex);
                    }
                }.bind(this));
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
            function matchRow(filterMap, row) {
                return Object.keys(filterMap).every(function (key) {
                    if (!row[key]) {
                        return false;
                    }
                    var testVal = String(row[key].text).toLowerCase();
                    return testVal.indexOf(filterMap[key]) !== -1;
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

        /**
         * @param displayRowIndex {number} The index in the displayed rows
         * to scroll to.
         */
        MCTTableController.prototype.scrollToRow = function (displayRowIndex) {

            var visible = displayRowIndex > this.firstVisible() && displayRowIndex < this.lastVisible();

            if (!visible) {
                var scrollTop = displayRowIndex * this.$scope.rowHeight +
                    this.$scope.headerHeight -
                    (this.scrollable[0].offsetHeight / 2);
                this.scrollable[0].scrollTop = scrollTop;
                this.setVisibleRows();
            }
        };

        /**
         * Update rows with new data.  If filtering is enabled, rows
         * will be sorted before display.
         */
        MCTTableController.prototype.setTimeOfInterestRow = function (newTOI) {
            var isSortedByTime =
                this.$scope.timeColumns &&
                this.$scope.timeColumns.indexOf(this.$scope.sortColumn) !== -1;

            this.$scope.toiRowIndex = -1;

            if (newTOI && isSortedByTime) {
                var formattedTOI = this.toiFormatter.format(newTOI);
                var rowIndex = this.binarySearch(
                    this.$scope.displayRows,
                    formattedTOI,
                    0,
                    this.$scope.displayRows.length - 1);

                if (rowIndex > 0 && rowIndex < this.$scope.displayRows.length) {
                    this.$scope.toiRowIndex = rowIndex;
                }
            }
        };

        MCTTableController.prototype.changeTimeOfInterest = function (newTOI) {
            this.setTimeOfInterestRow(newTOI);
            this.scrollToRow(this.$scope.toiRowIndex);
        };

        /**
         * On zoom, pan, etc. reset TOI
         * @param bounds
         */
        MCTTableController.prototype.changeBounds = function (bounds) {
            this.setTimeOfInterestRow(this.conductor.timeOfInterest());
            this.scrollToRow(this.$scope.toiRowIndex);
        };

        /**
         * @private
         */
        MCTTableController.prototype.onRowClick = function (event, rowIndex) {
            if (this.$scope.timeColumns.indexOf(this.$scope.sortColumn) !== -1) {
                var selectedTime = this.$scope.displayRows[rowIndex][this.$scope.sortColumn].text;
                if (selectedTime &&
                    this.toiFormatter.validate(selectedTime) &&
                    event.altKey) {
                    this.conductor.timeOfInterest(this.toiFormatter.parse(selectedTime));
                }
            }
        };

        return MCTTableController;
    }
);
