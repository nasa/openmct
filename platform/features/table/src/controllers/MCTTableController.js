
define(
    [
        'zepto',
        'lodash'
    ],
    function ($, _) {

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
            this.maxDisplayRows = 100;

            this.scrollable = this.element.find('.t-scrolling').first();
            this.resultsHeader = this.element.find('.mct-table>thead').first();
            this.sizingTableBody = this.element.find('.t-sizing-table>tbody').first();
            this.$scope.sizingRow = {};
            this.$scope.calcTableWidthPx = '100%';
            this.timeApi = openmct.time;
            this.toiFormatter = undefined;
            this.formatService = formatService;
            this.callbacks = {};

            //Bind all class functions to 'this'
            _.bindAll(this, [
                'addRows',
                'binarySearch',
                'buildLargestRow',
                'changeBounds',
                'changeTimeOfInterest',
                'changeTimeSystem',
                'destroyConductorListeners',
                'digest',
                'filterAndSort',
                'filterRows',
                'firstVisible',
                'insertSorted',
                'lastVisible',
                'onRowClick',
                'onScroll',
                'removeRows',
                'resize',
                'scrollToBottom',
                'scrollToRow',
                'setElementSizes',
                'setHeaders',
                'setRows',
                'setTimeOfInterestRow',
                'setVisibleRows',
                'sortComparator',
                'sortRows'
            ]);

            this.scrollable.on('scroll', this.onScroll);

            $scope.visibleRows = [];
            $scope.displayRows = [];

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
                var headers = $scope.displayHeaders,
                    filename = $(element[0]).attr('export-as');

                exportService.exportCSV($scope.displayRows.map(function (row) {
                    return headers.reduce(function (r, header) {
                        r[header] = row[header].text;
                        return r;
                    }, {});
                }), {
                    headers: headers,
                    filename: filename
                });
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
                self.setTimeOfInterestRow(self.timeApi.timeOfInterest());
            };

            /*
             * Define watches to listen for changes to headers and rows.
             */
            $scope.$watchCollection('filters', function () {
                self.setRows($scope.rows);
            });
            $scope.$watch('headers', function (newHeaders, oldHeaders) {
                if (newHeaders !== oldHeaders) {
                    this.setHeaders(newHeaders);
                }
            }.bind(this));
            $scope.$watch('rows', this.setRows);

            /*
             * Listen for rows added individually (eg. for real-time tables)
             */
            $scope.$on('add:rows', this.addRows);
            $scope.$on('remove:rows', this.removeRows);

            /**
             * Populated from the default-sort attribute on MctTable
             * directive tag.
             */
            $scope.$watch('defaultSort', function (newColumn, oldColumn) {
                if (newColumn !== oldColumn) {
                    $scope.toggleSort(newColumn);
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

                    this.timeApi.on('timeSystem', this.changeTimeSystem);
                    this.timeApi.on('timeOfInterest', this.changeTimeOfInterest);
                    this.timeApi.on('bounds', this.changeBounds);

                    // If time system defined, set initially
                    if (this.timeApi.timeSystem() !== undefined) {
                        this.changeTimeSystem(this.timeApi.timeSystem());
                    }
                }
            }.bind(this));

            $scope.$on('$destroy', function () {
                this.scrollable.off('scroll', this.onScroll);
                this.destroyConductorListeners();

            }.bind(this));
        }

        MCTTableController.prototype.destroyConductorListeners = function () {
            this.timeApi.off('timeSystem', this.changeTimeSystem);
            this.timeApi.off('timeOfInterest', this.changeTimeOfInterest);
            this.timeApi.off('bounds', this.changeBounds);
        };

        MCTTableController.prototype.changeTimeSystem = function (timeSystem) {
            var format = timeSystem.timeFormat;
            this.toiFormatter = this.formatService.getFormat(format);
        };

        /**
         * If auto-scroll is enabled, this function will scroll to the
         * bottom of the page
         * @private
         */
        MCTTableController.prototype.scrollToBottom = function () {
            this.scrollable[0].scrollTop = this.scrollable[0].scrollHeight;
        };

        /**
         * Handles a row add event. Rows can be added as needed using the
         * `add:row` broadcast event.
         * @private
         */
        MCTTableController.prototype.addRows = function (event, rows) {
            //Does the row pass the current filter?
            if (this.filterRows(rows).length > 0) {
                rows.forEach(this.insertSorted.bind(this, this.$scope.displayRows));

                //Resize the columns , then update the rows visible in the table
                this.resize([this.$scope.sizingRow].concat(rows))
                    .then(this.setVisibleRows)
                    .then(function () {
                        if (this.$scope.autoScroll) {
                            this.scrollToBottom();
                        }
                    }.bind(this));

                var toi = this.timeApi.timeOfInterest();
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
        MCTTableController.prototype.removeRows = function (event, rows) {
            var indexInDisplayRows;
            rows.forEach(function (row) {
                // Do a sequential search here. Only way of finding row is by
                // object equality, so array is in effect unsorted.
                indexInDisplayRows = this.$scope.displayRows.indexOf(row);
                if (indexInDisplayRows !== -1) {
                    this.$scope.displayRows.splice(indexInDisplayRows, 1);
                }
            }, this);

            this.$scope.sizingRow = this.buildLargestRow([this.$scope.sizingRow].concat(rows));

            this.setElementSizes();
            this.setVisibleRows()
                .then(function () {
                    if (this.$scope.autoScroll) {
                        this.scrollToBottom();
                    }
                }.bind(this));

        };

        /**
         * @private
         */
        MCTTableController.prototype.onScroll = function (event) {
            this.scrollWindow = {
                top: this.scrollable[0].scrollTop,
                bottom: this.scrollable[0].scrollTop + this.scrollable[0].offsetHeight,
                offsetHeight: this.scrollable[0].offsetHeight,
                height: this.scrollable[0].scrollHeight
            };
            this.$window.requestAnimationFrame(function () {
                this.setVisibleRows();
                this.digest();

                // If user scrolls away from bottom, disable auto-scroll.
                // Auto-scroll will be re-enabled if user scrolls to bottom again.
                if (this.scrollWindow.top <
                    (this.scrollWindow.height - this.scrollWindow.offsetHeight) - 20) {
                    this.$scope.autoScroll = false;
                } else {
                    this.$scope.autoScroll = true;
                }
                this.scrolling = false;
                delete this.scrollWindow;
            }.bind(this));
        };

        /**
         * Return first visible row, based on current scroll state.
         * @private
         */
        MCTTableController.prototype.firstVisible = function () {
            var topScroll = this.scrollWindow ?
                this.scrollWindow.top :
                this.scrollable[0].scrollTop;

            return Math.floor(
                (topScroll) / this.$scope.rowHeight
            );

        };

        /**
         * Return last visible row, based on current scroll state.
         * @private
         */
        MCTTableController.prototype.lastVisible = function () {
            var bottomScroll = this.scrollWindow ?
                this.scrollWindow.bottom :
                this.scrollable[0].scrollTop + this.scrollable[0].offsetHeight;

            return Math.ceil(
                (bottomScroll) /
                this.$scope.rowHeight
            );
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
                    return this.digest();
                }
            }
            //Set visible rows from display rows, based on calculated offset.
            this.$scope.visibleRows = this.$scope.displayRows.slice(start, end)
                .map(function (row, i) {
                    return {
                        rowIndex: start + i,
                        offsetY: ((start + i) * self.$scope.rowHeight),
                        contents: row
                    };
                });
            return this.digest();
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
            var tbody = this.sizingTableBody,
                firstRow = tbody.find('tr'),
                column = firstRow.find('td'),
                rowHeight = firstRow.prop('offsetHeight'),
                columnWidth,
                tableWidth = 0,
                overallHeight = (rowHeight *
                    (this.$scope.displayRows ? this.$scope.displayRows.length - 1  : 0));

            this.$scope.columnWidths = [];

            while (column.length) {
                columnWidth = column.prop('offsetWidth');
                this.$scope.columnWidths.push(column.prop('offsetWidth'));
                tableWidth += columnWidth;
                column = column.next();
            }
            this.$scope.rowHeight = rowHeight;
            this.$scope.totalHeight = overallHeight;

            var scrollW = this.scrollable[0].offsetWidth - this.scrollable[0].clientWidth;
            if (scrollW && scrollW > 0) {
                this.$scope.calcTableWidthPx = 'calc(100% - ' + scrollW + 'px)';
            }

            if (tableWidth > 0) {
                this.$scope.totalWidth = tableWidth + 'px';
            } else {
                this.$scope.totalWidth = 'none';
            }
        };

        /**
         * Finds the correct insertion point for a new row, which takes into
         * account duplicates to make sure new rows are inserted in a way that
         * maintains arrival order.
         *
         * @private
         * @param {Array} searchArray
         * @param {Object} searchElement Object to find the insertion point for
         */
        MCTTableController.prototype.findInsertionPoint = function (searchArray, searchElement) {
            var index;
            var testIndex;
            var first = searchArray[0];
            var last = searchArray[searchArray.length - 1];

            if (first) {
                first = first[this.$scope.sortColumn].text;
            }
            if (last) {
                last = last[this.$scope.sortColumn].text;
            }
            // Shortcut check for append/prepend
            if (first && this.sortComparator(first, searchElement) >= 0) {
                index = testIndex = 0;
            } else if (last && this.sortComparator(last, searchElement) <= 0) {
                index = testIndex = searchArray.length;
            } else {
                // use a binary search to find the correct insertion point
                index = testIndex =  this.binarySearch(
                    searchArray,
                    searchElement,
                    0,
                    searchArray.length - 1
                );
            }

            //It's possible that the insertion point is a duplicate of the element to be inserted
            var isDupe = function () {
                return this.sortComparator(searchElement,
                        searchArray[testIndex][this.$scope.sortColumn].text) === 0;
            }.bind(this);

            // In the event of a duplicate, scan left or right (depending on
            // sort order) to find an insertion point that maintains order received
            while (testIndex >= 0 && testIndex < searchArray.length && isDupe()) {
                if (this.$scope.sortDirection === 'asc') {
                    index = ++testIndex;
                } else {
                    index = testIndex--;
                }
            }
            return index;
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
                case 0:
                    return sampleAt;
                case 1:
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
                index = this.findInsertionPoint(array, element[this.$scope.sortColumn].text);
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

        // Will effectively cap digests at 60Hz
        // Also turns digest into a promise allowing code to force digest, then
        // schedule something to happen afterwards
        MCTTableController.prototype.digest = function () {
            var scope = this.$scope;
            var self = this;
            var raf = this.$window.requestAnimationFrame;
            var promise = this.digestPromise;

            if (!promise) {
                self.digestPromise = promise = new Promise(function (resolve) {
                    raf(function () {
                        scope.$digest();
                        self.digestPromise = undefined;
                        resolve();
                    });
                });
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
            return this.digest().then(this.setElementSizes);
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
            return this.resize(newRows)
                .then(function (rows) {
                    return this.setVisibleRows(rows);
                }.bind(this))
                //Timeout following setVisibleRows to allow digest to
                // perform DOM changes, otherwise scrollTo won't work.
                .then(function () {
                    //If TOI specified, scroll to it
                    var timeOfInterest = this.timeApi.timeOfInterest();
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
         * Scroll the view to a given row index
         * @param displayRowIndex {number} The index in the displayed rows
         * to scroll to.
         */
        MCTTableController.prototype.scrollToRow = function (displayRowIndex) {

            var visible = displayRowIndex > this.firstVisible() && displayRowIndex < this.lastVisible();

            if (!visible) {
                var scrollTop = displayRowIndex * this.$scope.rowHeight +
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
            this.setTimeOfInterestRow(this.timeApi.timeOfInterest());
            if (this.$scope.toiRowIndex !== -1) {
                this.scrollToRow(this.$scope.toiRowIndex);
            }
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
                    this.timeApi.timeOfInterest(this.toiFormatter.parse(selectedTime));
                }
            }
        };

        return MCTTableController;
    }
);
