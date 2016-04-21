/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,xit*/

define(
    [
        "../../src/controllers/MCTTableController"
    ],
    function (MCTTableController) {
        "use strict";

        describe('The MCTTable Controller', function() {

            var controller,
                mockScope,
                watches,
                mockTimeout,
                mockElement;

            function promise(value) {
                return {
                    then: function (callback){
                        return promise(callback(value));
                    }
                };
            }

            beforeEach(function() {
                watches = {};

                mockScope = jasmine.createSpyObj('scope', [
                   '$watch',
                   '$on',
                   '$watchCollection'
                ]);
                mockScope.$watchCollection.andCallFake(function(event, callback) {
                    watches[event] = callback;
                });

                mockElement = jasmine.createSpyObj('element', [
                    'find',
                    'prop',
                    'on'
                ]);
                mockElement.find.andReturn(mockElement);
                mockElement.prop.andReturn(0);

                mockScope.displayHeaders = true;
                mockTimeout = jasmine.createSpy('$timeout');
                mockTimeout.andReturn(promise(undefined));

                controller = new MCTTableController(mockScope, mockTimeout, mockElement);
                spyOn(controller, 'setVisibleRows');
            });

            it('Reacts to changes to filters, headers, and rows', function() {
                expect(mockScope.$watchCollection).toHaveBeenCalledWith('filters', jasmine.any(Function));
                expect(mockScope.$watch).toHaveBeenCalledWith('headers', jasmine.any(Function));
                expect(mockScope.$watch).toHaveBeenCalledWith('rows', jasmine.any(Function));
            });

            describe('rows', function() {
                var testRows = [];
                beforeEach(function() {
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

                it('Filters results based on filter input', function() {
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

                it('Sets rows on scope when rows change', function() {
                    controller.setRows(testRows);
                    expect(mockScope.displayRows.length).toBe(3);
                    expect(mockScope.displayRows).toEqual(testRows);
                });

                it('Supports adding rows individually', function() {
                    var addRowFunc = mockScope.$on.calls[mockScope.$on.calls.length-2].args[1],
                        row4 = {
                            'col1': {'text': 'row3 col1'},
                            'col2': {'text': 'ghi'},
                            'col3': {'text': 'row3 col3'}
                        };
                    controller.setRows(testRows);
                    expect(mockScope.displayRows.length).toBe(3);
                    testRows.push(row4);
                    addRowFunc(undefined, 3);
                    expect(mockScope.displayRows.length).toBe(4);
                });

                it('Supports removing rows individually', function() {
                    var removeRowFunc = mockScope.$on.calls[mockScope.$on.calls.length-1].args[1];
                    controller.setRows(testRows);
                    expect(mockScope.displayRows.length).toBe(3);
                    removeRowFunc(undefined, 2);
                    expect(mockScope.displayRows.length).toBe(2);
                    expect(controller.setVisibleRows).toHaveBeenCalled();
                });

                describe('sorting', function() {
                    var sortedRows;

                    it('Sorts rows ascending', function() {
                        mockScope.sortColumn = 'col1';
                        mockScope.sortDirection = 'asc';

                        sortedRows = controller.sortRows(testRows);
                        expect(sortedRows[0].col1.text).toEqual('row1 col1 match');
                        expect(sortedRows[1].col1.text).toEqual('row2 col1' +
                            ' match');
                        expect(sortedRows[2].col1.text).toEqual('row3 col1');

                    });

                    it('Sorts rows descending', function() {
                        mockScope.sortColumn = 'col1';
                        mockScope.sortDirection = 'desc';

                        sortedRows = controller.sortRows(testRows);
                        expect(sortedRows[0].col1.text).toEqual('row3 col1');
                        expect(sortedRows[1].col1.text).toEqual('row2 col1 match');
                        expect(sortedRows[2].col1.text).toEqual('row1 col1 match');
                    });
                    it('Sorts rows descending based on selected sort column', function() {
                        mockScope.sortColumn = 'col2';
                        mockScope.sortDirection = 'desc';

                        sortedRows = controller.sortRows(testRows);
                        expect(sortedRows[0].col2.text).toEqual('ghi');
                        expect(sortedRows[1].col2.text).toEqual('def');
                        expect(sortedRows[2].col2.text).toEqual('abc');
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

                        expect(sortedRows[sortedRows.length-3].col2.text).toEqual('456');
                        expect(sortedRows[sortedRows.length-2].col2.text).toEqual('123');
                        expect(sortedRows[sortedRows.length-1].col2.text).toEqual('');
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

                        beforeEach(function() {
                            row4 = {
                                'col1': {'text': 'row5 col1'},
                                'col2': {'text': 'xyz'},
                                'col3': {'text': 'row5 col3'}
                            };
                            row5 = {
                                'col1': {'text': 'row6 col1'},
                                'col2': {'text': 'aaa'},
                                'col3': {'text': 'row6 col3'}
                            };
                            row6 = {
                                'col1': {'text': 'row6 col1'},
                                'col2': {'text': 'ggg'},
                                'col3': {'text': 'row6 col3'}
                            };
                        });

                        it('Adds new rows at the correct sort position when' +
                            ' sorted ', function() {
                            mockScope.sortColumn = 'col2';
                            mockScope.sortDirection = 'desc';

                            mockScope.displayRows = controller.sortRows(testRows.slice(0));

                            mockScope.rows.push(row4);
                            controller.addRow(undefined, mockScope.rows.length-1);
                            expect(mockScope.displayRows[0].col2.text).toEqual('xyz');

                            mockScope.rows.push(row5);
                            controller.addRow(undefined, mockScope.rows.length-1);
                            expect(mockScope.displayRows[4].col2.text).toEqual('aaa');

                            mockScope.rows.push(row6);
                            controller.addRow(undefined, mockScope.rows.length-1);
                            expect(mockScope.displayRows[2].col2.text).toEqual('ggg');

                            //Add a duplicate row
                            mockScope.rows.push(row6);
                            controller.addRow(undefined, mockScope.rows.length-1);
                            expect(mockScope.displayRows[2].col2.text).toEqual('ggg');
                            expect(mockScope.displayRows[3].col2.text).toEqual('ggg');
                        });

                        it('Adds new rows at the correct sort position when' +
                            ' sorted and filtered', function() {
                            mockScope.sortColumn = 'col2';
                            mockScope.sortDirection = 'desc';
                            mockScope.filters = {'col2': 'a'};//Include only
                            // rows with 'a'

                            mockScope.displayRows = controller.sortRows(testRows.slice(0));
                            mockScope.displayRows = controller.filterRows(testRows);

                            mockScope.rows.push(row5);
                            controller.addRow(undefined, mockScope.rows.length-1);
                            expect(mockScope.displayRows.length).toBe(2);
                            expect(mockScope.displayRows[1].col2.text).toEqual('aaa');

                            mockScope.rows.push(row6);
                            controller.addRow(undefined, mockScope.rows.length-1);
                            expect(mockScope.displayRows.length).toBe(2);
                            //Row was not added because does not match filter
                        });

                        it('Adds new rows at the correct sort position when' +
                            ' not sorted ', function () {
                            mockScope.sortColumn = undefined;
                            mockScope.sortDirection = undefined;
                            mockScope.filters = {};

                            mockScope.displayRows = testRows.slice(0);

                            mockScope.rows.push(row5);
                            controller.addRow(undefined, mockScope.rows.length-1);
                            expect(mockScope.displayRows[3].col2.text).toEqual('aaa');

                            mockScope.rows.push(row6);
                            controller.addRow(undefined, mockScope.rows.length-1);
                            expect(mockScope.displayRows[4].col2.text).toEqual('ggg');
                        });

                        it('Resizes columns if length of any columns in new' +
                            ' row exceeds corresponding existing column', function() {
                            var row7 = {
                                'col1': {'text': 'row6 col1'},
                                'col2': {'text': 'some longer string'},
                                'col3': {'text': 'row6 col3'}
                            };

                            mockScope.sortColumn = undefined;
                            mockScope.sortDirection = undefined;
                            mockScope.filters = {};

                            mockScope.displayRows = testRows.slice(0);

                            mockScope.rows.push(row7);
                            controller.addRow(undefined, mockScope.rows.length-1);
                            expect(controller.$scope.sizingRow.col2).toEqual({text: 'some longer string'});
                        });

                    });
                });


            });
        });
    });
