/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [
        'lodash',
        'EventEmitter'
    ],
    function (
        _,
        EventEmitter
    ) {
        const LESS_THAN = -1;
        const EQUAL = 0;
        const GREATER_THAN = 1;

        /**
         * @constructor
         */
        class TableRowCollection extends EventEmitter {
            constructor() {
                super();

                this.sortedRows = [];
                this.filteredRows = [];

                this.columnFilters = {};
                this.isFiltered = false;

                this.add = this.add.bind(this);
                this.removeAllRowsForObject = this.removeAllRowsForObject.bind(this);
                this.removeTheseRowIds = this.removeTheseRowIds.bind(this);
            }

            get mainRows() {
                return this.isFiltered ? this.filteredRows : this.sortedRows;
            }

            /**
             * Add a datum or array of data to this telemetry collection
             * @fires TelemetryCollection#added
             * @param {object[]} rows
             */
            add(rows) {
                if (this.sortOptions === undefined) {
                    throw 'Please specify sort options';
                }

                let addedRows = [];

                // if this is the first object or only object
                if (this.mainRows.length === 0) {
                    this.sortedRows = rows;

                    if (!this.isFiltered) {
                        this.emit('add', rows);
                    } else {
                        addedRows = rows.filter(this.matchesFilters, this);
                        this.filteredRows = addedRows;

                        this.emit('add', addedRows);
                    }

                    return;
                }

                // if rows currently exist already, need to sort insert
                if (!this.isFiltered) {
                    addedRows = rows.filter(this.addOne, this);

                    // upate filtered asynchronously
                    // setTimeout(() => {
                    //     rows.filter(this.addFilteredOne, this);
                    // });
                } else {
                    addedRows = rows.filter(this.addFilteredOne, this);

                    // upate sorted asynchronously
                    setTimeout(() => {
                        rows.filter(this.addOne, this);
                    });
                }

                if (addedRows.length > 0) {
                    this.emit('add', addedRows);
                }
            }

            /**
             * @private
             */
            addOne(row) {
                let index = this.sortedIndex(this.sortedRows, row, 'sorted');
                this.sortedRows.splice(index, 0, row);

                return true;
            }

            /**
             * @private
             */
            addFilteredOne(row) {

                if (!this.matchesFilters(row)) {
                    return false;
                }

                let index = this.sortedIndex(this.filteredRows, row, 'filtered');
                this.filteredRows.splice(index, 0, row);

                return true;
            }

            sortedLastIndex(rows, testRow, type) {
                return this.sortedIndex(rows, testRow, type, _.sortedLastIndex);
            }

            /**
             * Finds the correct insertion point for the given row.
             * Leverages lodash's `sortedIndex` function which implements a binary search.
             * @private
             */
            sortedIndex(rows, testRow, type, lodashFunction = _.sortedIndexBy) {
                const rowType = type + 'Rows';

                if (this[rowType].length === 0) {
                    return 0;
                }

                const testRowValue = this.getValueForSortColumn(testRow);
                const firstValue = this.getValueForSortColumn(this[rowType][0]);
                const lastValue = this.getValueForSortColumn(this[rowType][this[rowType].length - 1]);

                if (this.sortOptions.direction === 'asc') {
                    if (testRowValue > lastValue) {
                        return this[rowType].length;
                    } else if (testRowValue === lastValue) {
                        // Maintain stable sort
                        return this[rowType].length;
                    } else if (testRowValue <= firstValue) {
                        return 0;
                    } else {
                        return lodashFunction(rows, testRow, (thisRow) => {
                            return this.getValueForSortColumn(thisRow);
                        });
                    }
                } else {
                    if (testRowValue >= firstValue) {
                        return 0;
                    } else if (testRowValue < lastValue) {
                        return this[rowType].length;
                    } else if (testRowValue === lastValue) {
                        // Maintain stable sort
                        return this[rowType].length;
                    } else {
                        // Use a custom comparison function to support descending sort.
                        return lodashFunction(rows, testRow, (thisRow) => {
                            const thisRowValue = this.getValueForSortColumn(thisRow);
                            if (testRowValue === thisRowValue) {
                                return EQUAL;
                            } else if (testRowValue < thisRowValue) {
                                return LESS_THAN;
                            } else {
                                return GREATER_THAN;
                            }
                        });
                    }
                }
            }

            // ex. removeAllRowsByValue('objectKeyString', objectKeyString);
            removeAllRowsForObject(keystring) {
                let removed = [];
                let activeRows = 'sortedRows';
                let inactiveRows = 'filteredRows';

                if (this.isFiltered) {
                    activeRows = 'filteredRows';
                    inactiveRows = 'sortedRows';
                }

                this[activeRows] = this[activeRows].filter((row) => {
                    if (row.objectKeyString !== keystring) {
                        removed.push(row);

                        return false;
                    } else {
                        return true;
                    }
                });

                this.emit('remove', removed);

                // asynchronously remove from inactive rows
                setTimeout(() => {
                    this[inactiveRows] = this[inactiveRows].filter(row => row.objectKeyString !== keystring);
                });
            }

            removeTheseRowIds(rowIds) {
                let removed = [];

                let activeRows = 'sortedRows';
                let inactiveRows = 'filteredRows';

                if (this.isFiltered) {
                    activeRows = 'filteredRows';
                    inactiveRows = 'sortedRows';
                }

                this[activeRows] = this[activeRows].filter((row) => {
                    if (rowIds.includes(row.rowId)) {
                        removed.push(row);

                        return false;
                    } else {
                        return true;
                    }
                });

                this.emit('remove', removed);

                // asynchronously remove from inactive rows
                setTimeout(() => {
                    this[inactiveRows] = this[inactiveRows].filter(row => rowIds.includes(row.rowId));
                });

                this.emit('remove', removed);
            }

            /**
             * Sorts the telemetry collection based on the provided sort field
             * specifier. Subsequent inserts are sorted to maintain specified sport
             * order.
             *
             * @example
             * // First build some mock telemetry for the purpose of an example
             * let now = Date.now();
             * let telemetry = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (value) {
             *     return {
             *         // define an object property to demonstrate nested paths
             *         timestamp: {
             *             ms: now - value * 1000,
             *             text:
             *         },
             *         value: value
             *     }
             * });
             * let collection = new TelemetryCollection();
             *
             * collection.add(telemetry);
             *
             * // Sort by telemetry value
             * collection.sortBy({
             *  key: 'value', direction: 'asc'
             * });
             *
             * // Sort by ms since epoch
             * collection.sort({
             *  key: 'timestamp.ms',
             *  direction: 'asc'
             * });
             *
             * // Sort by 'text' attribute, descending
             * collection.sort("timestamp.text");
             *
             *
             * @param {object} sortOptions An object specifying a sort key, and direction.
             */
            sortBy(sortOptions) {
                if (arguments.length > 0) {

                    let activeRows = 'sortedRows';
                    let inactiveRows = 'filteredRows';

                    if (this.isFiltered) {
                        activeRows = 'filteredRows';
                        inactiveRows = 'sortedRows';
                    }

                    this.sortOptions = sortOptions;

                    this[activeRows] = _.orderBy(this[activeRows], (row) => row.getParsedValue(sortOptions.key), sortOptions.direction);
                    this.emit('sort');

                    setTimeout(() => {
                        this[inactiveRows] = _.orderBy(this[inactiveRows], (row) => row.getParsedValue(sortOptions.key), sortOptions.direction);
                    });
                }

                // Return duplicate to avoid direct modification of underlying object
                return Object.assign({}, this.sortOptions);
            }

            setColumnFilter(columnKey, filter) {
                console.log('set column filter', this.isFiltered, this.columnFilters);
                // let rowsToFilter = this.sortedRows;
                filter = filter.trim().toLowerCase();

                // if (this.isSubsetOfCurrentFilter(columnKey, filter)) {
                //     rowsToFilter = this.filteredRows;
                // }

                if (filter.length === 0) {
                    delete this.columnFilters[columnKey];
                } else {
                    this.columnFilters[columnKey] = filter;
                }

                this.isFiltered = Object.keys(this.columnFilters).length > 0;

                this.filteredRows = this.sortedRows.filter(this.matchesFilters, this);
                this.emit('filter');
            }

            setColumnRegexFilter(columnKey, filter) {
                filter = filter.trim();

                // let rowsToFilter = this.sortedRows;

                this.columnFilters[columnKey] = new RegExp(filter);
                this.isFiltered = Object.keys(this.columnFilters).length > 0;

                this.filteredRows = this.sortedRows.filter(this.matchesFilters, this);
                this.emit('filter');
            }

            /**
             * @private
             */
            isSubsetOfCurrentFilter(columnKey, filter) {
                if (this.columnFilters[columnKey] instanceof RegExp) {
                    return false;
                }

                return this.columnFilters[columnKey]
                    && filter.startsWith(this.columnFilters[columnKey])
                    // startsWith check will otherwise fail when filter cleared
                    // because anyString.startsWith('') === true
                    && filter !== '';
            }

            /**
             * @private
             */
            matchesFilters(row) {
                let doesMatchFilters = true;
                Object.keys(this.columnFilters).forEach((key) => {
                    if (!doesMatchFilters || !this.rowHasColumn(row, key)) {
                        return false;
                    }

                    let formattedValue = row.getFormattedValue(key);
                    if (formattedValue === undefined) {
                        return false;
                    }

                    if (this.columnFilters[key] instanceof RegExp) {
                        doesMatchFilters = this.columnFilters[key].test(formattedValue);
                    } else {
                        doesMatchFilters = formattedValue.toLowerCase().indexOf(this.columnFilters[key]) !== -1;
                    }
                });

                return doesMatchFilters;
            }

            rowHasColumn(row, key) {
                return Object.prototype.hasOwnProperty.call(row.columns, key);
            }

            getRows() {
                return this.mainRows;
            }

            getRowsLength() {
                return this.mainRows.length;
            }

            getValueForSortColumn(row) {
                return row.getParsedValue(this.sortOptions.key);
            }

            clear() {
                let removedRows = this.filteredRows;
                this.sortedRows = [];
                this.filteredRows = [];

                this.emit('remove', removedRows);
            }
        }

        return TableRowCollection;
    });
