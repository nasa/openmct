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

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/ScrollingListPopulator"],
    function (ScrollingListPopulator) {
        "use strict";

        describe("The scrolling list populator", function () {
            var mockColumns,
                mockDatas,
                mockDomainObjects,
                populator;

            function makeMockColumn(name, index) {
                var mockColumn = jasmine.createSpyObj(
                    "column" + index,
                    [ "getTitle", "getValue" ]
                );
                mockColumn.getTitle.andReturn(name);
                mockColumn.getValue.andCallFake(function (obj, data, i) {
                    return data.getDomainValue(i);
                });
                return mockColumn;
            }

            function makeMockData(bias, index) {
                var mockData = jasmine.createSpyObj(
                    "data" + index,
                    [ "getDomainValue", "getPointCount" ]
                );
                mockData.getPointCount.andReturn(1000);
                mockData.getDomainValue.andCallFake(function (i) {
                    return i + bias;
                });
                return mockData;
            }

            function makeMockDomainObject(name, index) {
                var mockDomainObject = jasmine.createSpyObj(
                    "domainObject" + index,
                    [ "getId", "getModel" ]
                );
                return mockDomainObject;
            }

            beforeEach(function () {
                mockColumns = ["A", "B", "C", "D"].map(makeMockColumn);
                mockDatas = [ 10, 0, 3 ].map(makeMockData);
                mockDomainObjects = ["A", "B", "C"].map(makeMockDomainObject);
                populator = new ScrollingListPopulator(mockColumns);
            });

            it("returns column headers", function () {
                expect(populator.getHeaders()).toEqual(["A", "B", "C", "D"]);
            });

            xit("provides rows on request, with all columns in each row", function () {
                var rows = populator.getRows(mockDatas, mockDomainObjects, 84);
                expect(rows.length).toEqual(84);
                rows.forEach(function (row) {
                    expect(row.length).toEqual(4); // number of columns
                });
            });

            xit("returns rows in reverse domain order", function () {
                var rows = populator.getRows(mockDatas, mockDomainObjects, 84),
                    previous = Number.POSITIVE_INFINITY;

                // Should always be most-recent-first; since the mockColumn
                // returns the domain value, column contents should be
                // non-increasing.
                rows.forEach(function (row) {
                    expect(row[0]).not.toBeGreaterThan(previous);
                    previous = row[0];
                });

            });

        });
    }
);
