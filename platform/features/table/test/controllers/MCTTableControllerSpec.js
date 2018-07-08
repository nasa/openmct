/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
        "zepto",
        "moment",
        "../../src/controllers/MCTTableController"
    ],
    function ($, moment, MCTTableController) {

        var MOCK_ELEMENT_TEMPLATE =
            '<div><div class="l-view-section t-scrolling">' +
                '<table class="sizing-table"><tbody></tbody></table>' +
                '<table class="mct-table"><thead></thead></table>' +
            '</div></div>';

        describe('The MCTTable Controller', function () {

            var controller,
                mockScope,
                watches,
                mockWindow,
                mockElement,
                mockExportService,
                mockConductor,
                mockFormatService,
                mockFormat;

            function getCallback(target, event) {
                return target.calls.all().filter(function (call) {
                    return call.args[0] === event;
                })[0].args[1];
            }

            beforeEach(function () {
                watches = {};

                mockScope = jasmine.createSpyObj('scope', [
                   '$watch',
                   '$on',
                   '$watchCollection',
                   '$digest'
                ]);
                mockScope.$watchCollection.and.callFake(function (event, callback) {
                    watches[event] = callback;
                });

                mockElement = $(MOCK_ELEMENT_TEMPLATE);
                mockExportService = jasmine.createSpyObj('exportService', [
                    'exportCSV'
                ]);

                mockConductor = jasmine.createSpyObj('conductor', [
                    'bounds',
                    'timeOfInterest',
                    'timeSystem',
                    'on',
                    'off'
                ]);

                mockScope.displayHeaders = true;
                mockWindow = jasmine.createSpyObj('$window', ['requestAnimationFrame']);
                mockWindow.requestAnimationFrame.and.callFake(function (f) {
                    return f();
                });

                mockFormat = jasmine.createSpyObj('formatter', [
                    'parse',
                    'format'
                ]);
                mockFormatService = jasmine.createSpyObj('formatService', [
                    'getFormat'
                ]);
                mockFormatService.getFormat.and.returnValue(mockFormat);

                controller = new MCTTableController(
                    mockScope,
                    mockWindow,
                    mockElement,
                    mockExportService,
                    mockFormatService,
                    {time: mockConductor}
                );
                spyOn(controller, 'setVisibleRows').and.callThrough();
            });

            it('Reacts to changes to filters, headers, and rows', function () {
                expect(mockScope.$watchCollection).toHaveBeenCalledWith('filters', jasmine.any(Function));
                expect(mockScope.$watch).toHaveBeenCalledWith('headers', jasmine.any(Function));
                expect(mockScope.$watch).toHaveBeenCalledWith('rows', jasmine.any(Function));
            });

            it('unregisters listeners on destruction', function () {
                expect(mockScope.$on).toHaveBeenCalledWith('$destroy', jasmine.any(Function));
                getCallback(mockScope.$on, '$destroy')();

                expect(mockConductor.off).toHaveBeenCalledWith('timeSystem', controller.changeTimeSystem);
                expect(mockConductor.off).toHaveBeenCalledWith('timeOfInterest', controller.changeTimeOfInterest);
                expect(mockConductor.off).toHaveBeenCalledWith('bounds', controller.changeBounds);
            });

            describe('The time of interest', function () {
                var rowsAsc = [];
                var rowsDesc = [];
                beforeEach(function () {
                    rowsAsc = [
                        {
                            'col1': {'text': 'row1 col1 match'},
                            'col2': {'text': '2012-10-31 00:00:00.000Z'},
                            'col3': {'text': 'row1 col3'}
                        },
                        {
                            'col1': {'text': 'row2 col1 match'},
                            'col2': {'text': '2012-11-01 00:00:00.000Z'},
                            'col3': {'text': 'row2 col3'}
                        },
                        {
                            'col1': {'text': 'row3 col1'},
                            'col2': {'text': '2012-11-03 00:00:00.000Z'},
                            'col3': {'text': 'row3 col3'}
                        },
                        {
                            'col1': {'text': 'row3 col1'},
                            'col2': {'text': '2012-11-04 00:00:00.000Z'},
                            'col3': {'text': 'row3 col3'}
                        }
                    ];
                    rowsDesc = [
                        {
                            'col1': {'text': 'row1 col1 match'},
                            'col2': {'text': '2012-11-02 00:00:00.000Z'},
                            'col3': {'text': 'row1 col3'}
                        },
                        {
                            'col1': {'text': 'row2 col1 match'},
                            'col2': {'text': '2012-11-01 00:00:00.000Z'},
                            'col3': {'text': 'row2 col3'}
                        },
                        {
                            'col1': {'text': 'row3 col1'},
                            'col2': {'text': '2012-10-30 00:00:00.000Z'},
                            'col3': {'text': 'row3 col3'}
                        },
                        {
                            'col1': {'text': 'row3 col1'},
                            'col2': {'text': '2012-10-29 00:00:00.000Z'},
                            'col3': {'text': 'row3 col3'}
                        }
                    ];
                    mockScope.timeColumns = ['col2'];
                    mockScope.sortColumn = 'col2';
                    controller.toiFormatter = mockFormat;
                });
                it("is observed for changes", function () {
                    //Mock setting time columns
                    getCallback(mockScope.$watch, 'timeColumns')(['col2']);

                    expect(mockConductor.on).toHaveBeenCalledWith('timeOfInterest',
                        jasmine.any(Function));
                });
                describe("causes corresponding row to be highlighted", function () {
                    it("when changed and rows sorted ascending", function () {
                        var testDate = "2012-11-02 00:00:00.000Z";
                        mockScope.rows = rowsAsc;
                        mockScope.displayRows = rowsAsc;
                        mockScope.sortDirection = 'asc';

                        var toi = moment.utc(testDate).valueOf();
                        mockFormat.parse.and.returnValue(toi);
                        mockFormat.format.and.returnValue(testDate);

                        //mock setting the timeColumns parameter
                        getCallback(mockScope.$watch, 'timeColumns')(['col2']);

                        var toiCallback = getCallback(mockConductor.on, 'timeOfInterest');
                        toiCallback(toi);

                        expect(mockScope.toiRowIndex).toBe(2);
                    });
                    it("when changed and rows sorted descending", function () {
                        var testDate = "2012-10-31 00:00:00.000Z";
                        mockScope.rows = rowsDesc;
                        mockScope.displayRows = rowsDesc;
                        mockScope.sortDirection = 'desc';

                        var toi = moment.utc(testDate).valueOf();
                        mockFormat.parse.and.returnValue(toi);
                        mockFormat.format.and.returnValue(testDate);

                        //mock setting the timeColumns parameter
                        getCallback(mockScope.$watch, 'timeColumns')(['col2']);

                        var toiCallback = getCallback(mockConductor.on, 'timeOfInterest');
                        toiCallback(toi);

                        expect(mockScope.toiRowIndex).toBe(2);
                    });
                    it("when rows are set and sorted ascending", function () {
                        var testDate = "2012-11-02 00:00:00.000Z";
                        mockScope.sortDirection = 'asc';

                        var toi = moment.utc(testDate).valueOf();
                        mockFormat.parse.and.returnValue(toi);
                        mockFormat.format.and.returnValue(testDate);
                        mockConductor.timeOfInterest.and.returnValue(toi);

                        //mock setting the timeColumns parameter
                        getCallback(mockScope.$watch, 'timeColumns')(['col2']);

                        //Mock setting the rows on scope
                        var rowsCallback = getCallback(mockScope.$watch, 'rows');
                        var setRowsPromise = rowsCallback(rowsAsc);

                        return setRowsPromise.then(function () {
                            expect(mockScope.toiRowIndex).toBe(2);
                        });
                    });

                });
            });

            describe('rows', function () {
                var testRows = [];
                beforeEach(function () {
                    testRows = [
                        {
                            'col1': {'text': 'row1 col1 match'},
                            'col2': {'text': 'def'},
                            'col3': {'text': 'row1 col3'}
                        },
                        {
                            'col1': {'text': 'row2 col1 match'},
                            'col2': {'text': 'abc'},
                            'col3': {'text': 'row2 col3'}
                        },
                        {
                            'col1': {'text': 'row3 col1'},
                            'col2': {'text': 'ghi'},
                            'col3': {'text': 'row3 col3'}
                        }
                    ];
                    mockScope.rows = testRows;
                });

                it('Filters results based on filter input', function () {
                    var filters = {},
                        filteredRows;

                    mockScope.filters = filters;

                    filteredRows = controller.filterRows(testRows);
                    expect(filteredRows.length).toBe(3);
                    filters.col1 = 'row1';
                    filteredRows = controller.filterRows(testRows);
                    expect(filteredRows.length).toBe(1);
                    filters.col1 = 'match';
                    filteredRows = controller.filterRows(testRows);
                    expect(filteredRows.length).toBe(2);
                });

                it('Sets rows on scope when rows change', function () {
                    controller.setRows(testRows);
                    expect(mockScope.displayRows.length).toBe(3);
                    expect(mockScope.displayRows).toEqual(testRows);
                });

                it('Supports adding rows individually', function () {
                    var addRowFunc = getCallback(mockScope.$on, 'add:rows'),
                        row4 = {
                            'col1': {'text': 'row3 col1'},
                            'col2': {'text': 'ghi'},
                            'col3': {'text': 'row3 col3'}
                        };
                    controller.setRows(testRows);
                    expect(mockScope.displayRows.length).toBe(3);
                    testRows.push(row4);
                    addRowFunc(undefined, [row4]);
                    expect(mockScope.displayRows.length).toBe(4);
                });

                it('Supports removing rows individually', function () {
                    var removeRowFunc = getCallback(mockScope.$on, 'remove:rows');
                    controller.setRows(testRows);
                    expect(mockScope.displayRows.length).toBe(3);
                    removeRowFunc(undefined, [testRows[2]]);
                    expect(mockScope.displayRows.length).toBe(2);
                    expect(controller.setVisibleRows).toHaveBeenCalled();
                });

                it("can be exported as CSV", function () {
                    controller.setRows(testRows);
                    controller.setHeaders(Object.keys(testRows[0]));
                    mockScope.exportAsCSV();
                    expect(mockExportService.exportCSV)
                        .toHaveBeenCalled();
                    mockExportService.exportCSV.calls.mostRecent().args[0]
                        .forEach(function (row, i) {
                            Object.keys(row).forEach(function (k) {
                                expect(row[k]).toEqual(
                                    mockScope.displayRows[i][k].text
                                );
                            });
                        });
                });

                describe('sorting', function () {
                    var sortedRows;

                    beforeEach(function () {
                        sortedRows = [];
                    });

                    it('Sorts rows ascending', function () {
                        mockScope.sortColumn = 'col1';
                        mockScope.sortDirection = 'asc';

                        sortedRows = controller.sortRows(testRows);
                        expect(sortedRows[0].col1.text).toEqual('row1 col1 match');
                        expect(sortedRows[1].col1.text).toEqual('row2 col1' +
                            ' match');
                        expect(sortedRows[2].col1.text).toEqual('row3 col1');

                    });

                    it('Sorts rows descending', function () {
                        mockScope.sortColumn = 'col1';
                        mockScope.sortDirection = 'desc';

                        sortedRows = controller.sortRows(testRows);
                        expect(sortedRows[0].col1.text).toEqual('row3 col1');
                        expect(sortedRows[1].col1.text).toEqual('row2 col1 match');
                        expect(sortedRows[2].col1.text).toEqual('row1 col1 match');
                    });
                    it('Sorts rows descending based on selected sort column', function () {
                        mockScope.sortColumn = 'col2';
                        mockScope.sortDirection = 'desc';

                        sortedRows = controller.sortRows(testRows);
                        expect(sortedRows[0].col2.text).toEqual('ghi');
                        expect(sortedRows[1].col2.text).toEqual('def');
                        expect(sortedRows[2].col2.text).toEqual('abc');
                    });

                    it('Allows sort column to be changed externally by ' +
                       'setting or changing sortBy attribute', function () {
                        mockScope.displayRows = testRows;
                        var sortByCB = getCallback(mockScope.$watch, 'defaultSort');
                        sortByCB('col2');

                        expect(mockScope.sortDirection).toEqual('asc');

                        expect(mockScope.displayRows[0].col2.text).toEqual('abc');
                        expect(mockScope.displayRows[1].col2.text).toEqual('def');
                        expect(mockScope.displayRows[2].col2.text).toEqual('ghi');

                    });

                    // https://github.com/nasa/openmct/issues/910
                    it('updates visible rows in scope', function () {
                        var oldRows;
                        mockScope.rows = testRows;
                        var setRowsPromise = controller.setRows(testRows);

                        oldRows = mockScope.visibleRows;
                        mockScope.toggleSort('col2');

                        return setRowsPromise.then(function () {
                            expect(mockScope.visibleRows).not.toEqual(oldRows);
                        });
                    });

                    it('correctly sorts rows of differing types', function () {
                        mockScope.sortColumn = 'col2';
                        mockScope.sortDirection = 'desc';

                        testRows.push({
                            'col1': {'text': 'row4 col1'},
                            'col2': {'text': '123'},
                            'col3': {'text': 'row4 col3'}
                        });
                        testRows.push({
                            'col1': {'text': 'row5 col1'},
                            'col2': {'text': '456'},
                            'col3': {'text': 'row5 col3'}
                        });
                        testRows.push({
                            'col1': {'text': 'row5 col1'},
                            'col2': {'text': ''},
                            'col3': {'text': 'row5 col3'}
                        });

                        sortedRows = controller.sortRows(testRows);
                        expect(sortedRows[0].col2.text).toEqual('ghi');
                        expect(sortedRows[1].col2.text).toEqual('def');
                        expect(sortedRows[2].col2.text).toEqual('abc');

                        expect(sortedRows[sortedRows.length - 3].col2.text).toEqual('456');
                        expect(sortedRows[sortedRows.length - 2].col2.text).toEqual('123');
                        expect(sortedRows[sortedRows.length - 1].col2.text).toEqual('');
                    });

                    describe('The sort comparator', function () {
                        it('Correctly sorts different data types', function () {
                            var val1 = "",
                                val2 = "1",
                                val3 = "2016-04-05 18:41:30.713Z",
                                val4 = "1.1",
                                val5 = "8.945520958175627e-13";
                            mockScope.sortDirection = "asc";

                            expect(controller.sortComparator(val1, val2)).toEqual(-1);
                            expect(controller.sortComparator(val3, val1)).toEqual(1);
                            expect(controller.sortComparator(val3, val2)).toEqual(1);
                            expect(controller.sortComparator(val4, val2)).toEqual(1);
                            expect(controller.sortComparator(val2, val5)).toEqual(1);
                        });
                    });

                    describe('Adding new rows', function () {
                        var row4,
                            row5,
                            row6;

                        beforeEach(function () {
                            row4 = {
                                'col1': {'text': 'row4 col1'},
                                'col2': {'text': 'xyz'},
                                'col3': {'text': 'row4 col3'}
                            };
                            row5 = {
                                'col1': {'text': 'row5 col1'},
                                'col2': {'text': 'aaa'},
                                'col3': {'text': 'row5 col3'}
                            };
                            row6 = {
                                'col1': {'text': 'row6 col1'},
                                'col2': {'text': 'ggg'},
                                'col3': {'text': 'row6 col3'}
                            };
                        });

                        it('Adds new rows at the correct sort position when' +
                            ' sorted ', function () {
                            mockScope.sortColumn = 'col2';
                            mockScope.sortDirection = 'desc';

                            mockScope.displayRows = controller.sortRows(testRows.slice(0));

                            controller.addRows(undefined, [row4, row5, row6, row6]);
                            expect(mockScope.displayRows[0].col2.text).toEqual('xyz');
                            expect(mockScope.displayRows[6].col2.text).toEqual('aaa');
                            //Added a duplicate row
                            expect(mockScope.displayRows[2].col2.text).toEqual('ggg');
                            expect(mockScope.displayRows[3].col2.text).toEqual('ggg');
                        });

                        it('Inserts duplicate values for sort column in order received when sorted descending', function () {
                            mockScope.sortColumn = 'col2';
                            mockScope.sortDirection = 'desc';

                            mockScope.displayRows = controller.sortRows(testRows.slice(0));

                            var row6b = {
                                'col1': {'text': 'row6b col1'},
                                'col2': {'text': 'ggg'},
                                'col3': {'text': 'row6b col3'}
                            };
                            var row6c = {
                                'col1': {'text': 'row6c col1'},
                                'col2': {'text': 'ggg'},
                                'col3': {'text': 'row6c col3'}
                            };

                            controller.addRows(undefined, [row4, row5]);
                            controller.addRows(undefined, [row6, row6b, row6c]);
                            expect(mockScope.displayRows[0].col2.text).toEqual('xyz');
                            expect(mockScope.displayRows[7].col2.text).toEqual('aaa');

                            // Added duplicate rows
                            expect(mockScope.displayRows[2].col2.text).toEqual('ggg');
                            expect(mockScope.displayRows[3].col2.text).toEqual('ggg');
                            expect(mockScope.displayRows[4].col2.text).toEqual('ggg');

                            // Check that original order is maintained with dupes
                            expect(mockScope.displayRows[2].col3.text).toEqual('row6c col3');
                            expect(mockScope.displayRows[3].col3.text).toEqual('row6b col3');
                            expect(mockScope.displayRows[4].col3.text).toEqual('row6 col3');
                        });

                        it('Inserts duplicate values for sort column in order received when sorted ascending', function () {
                            mockScope.sortColumn = 'col2';
                            mockScope.sortDirection = 'asc';

                            mockScope.displayRows = controller.sortRows(testRows.slice(0));

                            var row6b = {
                                'col1': {'text': 'row6b col1'},
                                'col2': {'text': 'ggg'},
                                'col3': {'text': 'row6b col3'}
                            };
                            var row6c = {
                                'col1': {'text': 'row6c col1'},
                                'col2': {'text': 'ggg'},
                                'col3': {'text': 'row6c col3'}
                            };

                            controller.addRows(undefined, [row4, row5, row6]);
                            controller.addRows(undefined, [row6b, row6c]);
                            expect(mockScope.displayRows[0].col2.text).toEqual('aaa');
                            expect(mockScope.displayRows[7].col2.text).toEqual('xyz');

                            // Added duplicate rows
                            expect(mockScope.displayRows[3].col2.text).toEqual('ggg');
                            expect(mockScope.displayRows[4].col2.text).toEqual('ggg');
                            expect(mockScope.displayRows[5].col2.text).toEqual('ggg');
                            // Check that original order is maintained with dupes
                            expect(mockScope.displayRows[3].col3.text).toEqual('row6 col3');
                            expect(mockScope.displayRows[4].col3.text).toEqual('row6b col3');
                            expect(mockScope.displayRows[5].col3.text).toEqual('row6c col3');
                        });

                        it('Adds new rows at the correct sort position when' +
                            ' sorted and filtered', function () {
                            mockScope.sortColumn = 'col2';
                            mockScope.sortDirection = 'desc';
                            mockScope.filters = {'col2': 'a'};//Include only
                            // rows with 'a'

                            mockScope.displayRows = controller.sortRows(testRows.slice(0));
                            mockScope.displayRows = controller.filterRows(testRows);

                            controller.addRows(undefined, [row5]);
                            expect(mockScope.displayRows.length).toBe(2);
                            expect(mockScope.displayRows[1].col2.text).toEqual('aaa');

                            controller.addRows(undefined, [row6]);
                            expect(mockScope.displayRows.length).toBe(2);
                            //Row was not added because does not match filter
                        });

                        it('Adds new rows at the correct sort position when' +
                            ' not sorted ', function () {
                            mockScope.sortColumn = undefined;
                            mockScope.sortDirection = undefined;
                            mockScope.filters = {};

                            mockScope.displayRows = testRows.slice(0);

                            controller.addRows(undefined, [row5]);
                            expect(mockScope.displayRows[3].col2.text).toEqual('aaa');

                            controller.addRows(undefined, [row6]);
                            expect(mockScope.displayRows[4].col2.text).toEqual('ggg');
                        });

                        it('Resizes columns if length of any columns in new' +
                            ' row exceeds corresponding existing column', function () {
                            var row7 = {
                                'col1': {'text': 'row6 col1'},
                                'col2': {'text': 'some longer string'},
                                'col3': {'text': 'row6 col3'}
                            };

                            mockScope.sortColumn = undefined;
                            mockScope.sortDirection = undefined;
                            mockScope.filters = {};

                            mockScope.displayRows = testRows.slice(0);

                            controller.addRows(undefined, [row7]);
                            expect(controller.$scope.sizingRow.col2).toEqual({text: 'some longer string'});
                        });

                    });
                });
            });
        });
    });
