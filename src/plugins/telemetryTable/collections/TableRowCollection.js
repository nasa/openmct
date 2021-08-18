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

                this.rows = [];
                this.columnFilters = {};
                this.addRows = this.addRows.bind(this);
                this.removeRowsByObject = this.removeRowsByObject.bind(this);
                this.removeRowsByData = this.removeRowsByData.bind(this);

                this.clear = this.clear.bind(this);
            }

            removeRowsByObject(keyString) {
                let removed = [];

                this.rows = this.rows.filter((row) => {
                    if (row.objectKeyString === keyString) {
                        removed.push(row);

                        return false;
                    } else {
                        return true;
                    }
                });

                this.emit('remove', removed);
            }

            addRows(rows, type = 'add') {
                if (this.sortOptions === undefined) {
                    throw 'Please specify sort options';
                }

                let isFilterTriggeredReset = type === 'filter';
                let anyActiveFilters = Object.keys(this.columnFilters).length > 0;
                let rowsToAdd = !anyActiveFilters ? rows : rows.filter(this.matchesFilters, this);

                // if type is filter, then it's a reset of all rows,
                // need to wipe current rows
                if (isFilterTriggeredReset) {
                    this.rows = [];
                }

                for (let row of rowsToAdd) {
                    let index = this.sortedIndex(this.rows, row);
                    this.rows.splice(index, 0, row);
                }

                // we emit filter no matter what to trigger
                // an update of visible rows
                if (rowsToAdd.length > 0 || isFilterTriggeredReset) {
                    this.emit(type, rowsToAdd);
                }
            }

            sortedLastIndex(rows, testRow) {
                return this.sortedIndex(rows, testRow, _.sortedLastIndex);
            }

            /**
             * Finds the correct insertion point for the given row.
             * Leverages lodash's `sortedIndex` function which implements a binary search.
             * @private
             */
            sortedIndex(rows, testRow, lodashFunction = _.sortedIndexBy) {
                if (this.rows.length === 0) {
                    return 0;
                }

                const testRowValue = this.getValueForSortColumn(testRow);
                const firstValue = this.getValueForSortColumn(this.rows[0]);
                const lastValue = this.getValueForSortColumn(this.rows[this.rows.length - 1]);

                if (this.sortOptions.direction === 'asc') {
                    if (testRowValue > lastValue) {
                        return this.rows.length;
                    } else if (testRowValue === lastValue) {
                        // Maintain stable sort
                        return this.rows.length;
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
                        return this.rows.length;
                    } else if (testRowValue === lastValue) {
                        // Maintain stable sort
                        return this.rows.length;
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

            removeRowsByData(data) {
                let removed = [];

                this.rows = this.rows.filter((row) => {
                    if (data.includes(row.fullDatum)) {
                        removed.push(row);

                        return false;
                    } else {
                        return true;
                    }
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
                    this.sortOptions = sortOptions;
                    this.rows = _.orderBy(this.rows, (row) => row.getParsedValue(sortOptions.key), sortOptions.direction);

                    this.emit('sort');
                }

                // Return duplicate to avoid direct modification of underlying object
                return Object.assign({}, this.sortOptions);
            }

            setColumnFilter(columnKey, filter) {
                filter = filter.trim().toLowerCase();
                let wasBlank = this.columnFilters[columnKey] === undefined;
                let isSubset = this.isSubsetOfCurrentFilter(columnKey, filter);

                if (filter.length === 0) {
                    delete this.columnFilters[columnKey];
                } else {
                    this.columnFilters[columnKey] = filter;
                }

                if (isSubset || wasBlank) {
                    this.rows = this.rows.filter(this.matchesFilters, this);
                    this.emit('filter');
                } else {
                    this.emit('resetRowsFromAllData');
                }

            }

            setColumnRegexFilter(columnKey, filter) {
                filter = filter.trim();
                this.columnFilters[columnKey] = new RegExp(filter);

                this.emit('resetRowsFromAllData');
            }

            getColumnMapForObject(objectKeyString) {
                let columns = this.configuration.getColumns();

                if (columns[objectKeyString]) {
                    return columns[objectKeyString].reduce((map, column) => {
                        map[column.getKey()] = column;

                        return map;
                    }, {});
                }

                return {};
            }

            // /**
            //  * @private
            //  */
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
                return this.rows;
            }

            getRowsLength() {
                return this.rows.length;
            }

            getValueForSortColumn(row) {
                return row.getParsedValue(this.sortOptions.key);
            }

            clear() {
                let removedRows = this.rows;
                this.rows = [];

                this.emit('remove', removedRows);
            }

            destroy() {
                this.removeAllListeners();
            }
        }

        return TableRowCollection;
    });
