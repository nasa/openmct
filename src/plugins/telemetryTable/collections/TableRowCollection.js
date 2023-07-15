/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

define(['lodash', 'EventEmitter'], function (_, EventEmitter) {
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

    addRows(rows) {
      let rowsToAdd = this.filterRows(rows);

      this.sortAndMergeRows(rowsToAdd);

      // we emit filter no matter what to trigger
      // an update of visible rows
      if (rowsToAdd.length > 0) {
        this.emit('add', rowsToAdd);
      }
    }

    clearRowsFromTableAndFilter(rows) {
      let rowsToAdd = this.filterRows(rows);
      // Reset of all rows, need to wipe current rows
      this.rows = [];

      this.sortAndMergeRows(rowsToAdd);

      // We emit filter and update of visible rows
      this.emit('filter', rowsToAdd);
    }

    filterRows(rows) {
      if (Object.keys(this.columnFilters).length > 0) {
        return rows.filter(this.matchesFilters, this);
      }

      return rows;
    }

    sortAndMergeRows(rows) {
      const sortedRows = this.sortCollection(rows);

      if (this.rows.length === 0) {
        this.rows = sortedRows;

        return;
      }

      const firstIncomingRow = sortedRows[0];
      const lastIncomingRow = sortedRows[sortedRows.length - 1];
      const firstExistingRow = this.rows[0];
      const lastExistingRow = this.rows[this.rows.length - 1];

      if (this.firstRowInSortOrder(lastIncomingRow, firstExistingRow) === lastIncomingRow) {
        this.insertOrUpdateRows(sortedRows, true);
      } else if (this.firstRowInSortOrder(lastExistingRow, firstIncomingRow) === lastExistingRow) {
        this.insertOrUpdateRows(sortedRows, false);
      } else {
        this.mergeSortedRows(sortedRows);
      }
    }

    getInPlaceUpdateIndex(row) {
      const inPlaceUpdateKey = row.inPlaceUpdateKey;
      if (!inPlaceUpdateKey) {
        return -1;
      }

      const foundIndex = this.rows.findIndex(
        (existingRow) =>
          existingRow.datum[inPlaceUpdateKey] &&
          existingRow.datum[inPlaceUpdateKey] === row.datum[inPlaceUpdateKey]
      );

      return foundIndex;
    }

    updateRowInPlace(row, index) {
      const foundRow = this.rows[index];
      foundRow.updateWithDatum(row.datum);
      this.rows[index] = foundRow;
    }

    sortCollection(rows) {
      const sortedRows = _.orderBy(
        rows,
        (row) => row.getParsedValue(this.sortOptions.key),
        this.sortOptions.direction
      );

      return sortedRows;
    }

    insertOrUpdateRows(rowsToAdd, addToBeginning) {
      rowsToAdd.forEach((row) => {
        const index = this.getInPlaceUpdateIndex(row);
        if (index > -1) {
          this.updateRowInPlace(row, index);
        } else {
          if (addToBeginning) {
            this.rows.unshift(row);
          } else {
            this.rows.push(row);
          }
        }
      });
    }

    mergeSortedRows(rows) {
      const mergedRows = [];
      let i = 0;
      let j = 0;

      while (i < this.rows.length && j < rows.length) {
        const existingRow = this.rows[i];
        const incomingRow = rows[j];

        const index = this.getInPlaceUpdateIndex(incomingRow);
        if (index > -1) {
          this.updateRowInPlace(incomingRow, index);
        } else {
          if (this.firstRowInSortOrder(existingRow, incomingRow) === existingRow) {
            mergedRows.push(existingRow);
            i++;
          } else {
            mergedRows.push(incomingRow);
            j++;
          }
        }
      }

      // tail of existing rows is all that is left to merge
      if (i < this.rows.length) {
        for (i; i < this.rows.length; i++) {
          mergedRows.push(this.rows[i]);
        }
      }

      // tail of incoming rows is all that is left to merge
      if (j < rows.length) {
        for (j; j < rows.length; j++) {
          mergedRows.push(rows[j]);
        }
      }

      this.rows = mergedRows;
    }

    firstRowInSortOrder(row1, row2) {
      const val1 = this.getValueForSortColumn(row1);
      const val2 = this.getValueForSortColumn(row2);

      if (this.sortOptions.direction === 'asc') {
        return val1 <= val2 ? row1 : row2;
      } else {
        return val1 >= val2 ? row1 : row2;
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
        this.rows = _.orderBy(
          this.rows,
          (row) => row.getParsedValue(sortOptions.key),
          sortOptions.direction
        );
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

      return (
        this.columnFilters[columnKey] &&
        filter.startsWith(this.columnFilters[columnKey]) &&
        // startsWith check will otherwise fail when filter cleared
        // because anyString.startsWith('') === true
        filter !== ''
      );
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
