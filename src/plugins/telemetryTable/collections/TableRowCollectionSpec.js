/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
import TableRowCollection from './TableRowCollection.js';

const COLUMN_KEY = 'some.telemetry.value';

/**
 * A stand-in for TelemetryTableRow. Filtering only reaches `columns` and
 * `getFormattedValue()`, so there is no need for a real row here.
 */
function createRow(formattedValue) {
  return {
    objectKeyString: 'mock-telemetry-object',
    columns: { [COLUMN_KEY]: {} },
    getFormattedValue: () => formattedValue
  };
}

describe('The TableRowCollection', () => {
  let tableRowCollection;
  let resetRows;

  beforeEach(() => {
    tableRowCollection = new TableRowCollection();
    resetRows = jasmine.createSpy('resetRowsFromAllData');
    tableRowCollection.on('resetRowsFromAllData', resetRows);
  });

  describe('when given a regex column filter', () => {
    it('applies a well formed pattern and filters rows with it', () => {
      expect(tableRowCollection.setColumnRegexFilter(COLUMN_KEY, '^-?[0-9]+$')).toBe(true);
      expect(tableRowCollection.columnFilters[COLUMN_KEY]).toEqual(/^-?[0-9]+$/);
      expect(resetRows).toHaveBeenCalled();

      const matching = tableRowCollection.filterRows([createRow('-12'), createRow('12.5')]);

      expect(matching.length).toBe(1);
    });

    it('rejects a pattern that will not compile, rather than throwing', () => {
      // TableComponent only checks that the input opens and closes with a
      // slash, so a half typed pattern such as `/(/` arrives here intact.
      let applied;

      expect(() => {
        applied = tableRowCollection.setColumnRegexFilter(COLUMN_KEY, '(');
      }).not.toThrow();

      expect(applied).toBe(false);
      expect(tableRowCollection.columnFilters[COLUMN_KEY]).toBeUndefined();
      expect(resetRows).not.toHaveBeenCalled();
    });

    it('leaves the previous filter in place when a pattern is rejected', () => {
      tableRowCollection.setColumnRegexFilter(COLUMN_KEY, '^-?[0-9]+$');
      tableRowCollection.setColumnRegexFilter(COLUMN_KEY, '(');

      expect(tableRowCollection.columnFilters[COLUMN_KEY]).toEqual(/^-?[0-9]+$/);
    });

    it('rejects a pattern that can backtrack catastrophically', () => {
      expect(tableRowCollection.setColumnRegexFilter(COLUMN_KEY, '(a+)+$')).toBe(false);
      expect(tableRowCollection.columnFilters[COLUMN_KEY]).toBeUndefined();
      expect(resetRows).not.toHaveBeenCalled();
    });

    it('never runs a rejected pattern against a row', () => {
      // Filtering happens on the main thread, once per row. `(a+)+$` takes over
      // ten seconds against a thirty character run of "a", so the pattern must
      // not reach a value at all.
      tableRowCollection.setColumnRegexFilter(COLUMN_KEY, '(a+)+$');

      const row = createRow(`${'a'.repeat(3)}b`);
      spyOn(row, 'getFormattedValue').and.callThrough();

      expect(tableRowCollection.filterRows([row]).length).toBe(1);
      expect(row.getFormattedValue).not.toHaveBeenCalled();
    });
  });
});
