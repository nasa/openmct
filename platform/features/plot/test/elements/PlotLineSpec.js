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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/elements/PlotLine"],
    function (PlotLine) {
        "use strict";

        describe("A plot line", function () {
            var mockBuffer,
                mockSeries,
                testDomainBuffer,
                testRangeBuffer,
                testSeries,
                line;

            beforeEach(function () {
                testDomainBuffer = [];
                testRangeBuffer = [];
                testSeries = [];

                mockBuffer = jasmine.createSpyObj(
                    'buffer',
                    ['findInsertionIndex', 'insert', 'insertPoint', 'trim']
                );
                mockSeries = jasmine.createSpyObj(
                    'series',
                    ['getPointCount', 'getDomainValue', 'getRangeValue']
                );

                mockSeries.getPointCount.andCallFake(function () {
                    return testSeries.length;
                });
                mockSeries.getDomainValue.andCallFake(function (i) {
                    return (testSeries[i] || [])[0];
                });
                mockSeries.getRangeValue.andCallFake(function (i) {
                    return (testSeries[i] || [])[1];
                });

                // Function like PlotLineBuffer, to aid in testability
                mockBuffer.findInsertionIndex.andCallFake(function (v) {
                    var index = 0;
                    if (testDomainBuffer.indexOf(v) !== -1) {
                        return -1;
                    }
                    while ((index < testDomainBuffer.length) &&
                            (testDomainBuffer[index] < v)) {
                        index += 1;
                    }
                    return index;
                });
                mockBuffer.insert.andCallFake(function (series, index) {
                    var domains = [], ranges = [], i;
                    for (i = 0; i < series.getPointCount(); i += 1) {
                        domains.push(series.getDomainValue(i));
                        ranges.push(series.getRangeValue(i));
                    }
                    testDomainBuffer = testDomainBuffer.slice(0, index)
                        .concat(domains)
                        .concat(testDomainBuffer.slice(index));
                    testRangeBuffer = testRangeBuffer.slice(0, index)
                        .concat(ranges)
                        .concat(testRangeBuffer.slice(index));
                    return true;
                });
                mockBuffer.insertPoint.andCallFake(function (dv, rv, index) {
                    testDomainBuffer.splice(index, 0, dv);
                    testRangeBuffer.splice(index, 0, rv);
                    return true;
                });

                line = new PlotLine(mockBuffer);
            });

            it("allows single point insertion", function () {
                line.addPoint(100, 200);
                line.addPoint(50, 42);
                line.addPoint(150, 12321);
                // Should have managed insertion index choices to get to...
                expect(testDomainBuffer).toEqual([50, 100, 150]);
                expect(testRangeBuffer).toEqual([42, 200, 12321]);
            });

            it("allows series insertion", function () {
                testSeries = [ [ 50, 42 ], [ 100, 200 ], [ 150, 12321 ] ];
                line.addSeries(mockSeries);
                // Should have managed insertion index choices to get to...
                expect(testDomainBuffer).toEqual([50, 100, 150]);
                expect(testRangeBuffer).toEqual([42, 200, 12321]);
            });

            it("splits series insertion when necessary", function () {
                testSeries = [ [ 50, 42 ], [ 100, 200 ], [ 150, 12321 ] ];
                line.addPoint(75, 1);
                line.addSeries(mockSeries);
                // Should have managed insertion index choices to get to...
                expect(testDomainBuffer).toEqual([50, 75, 100, 150]);
                expect(testRangeBuffer).toEqual([42, 1, 200, 12321]);
            });

            it("attempts to remove points when insertion fails", function () {
                // Verify precondition - normally doesn't try to trim
                line.addPoint(1, 2);
                expect(mockBuffer.trim).not.toHaveBeenCalled();

                // But if insertPoint fails, it should trim
                mockBuffer.insertPoint.andReturn(false);
                line.addPoint(2, 3);
                expect(mockBuffer.trim).toHaveBeenCalled();
            });

        });
    }
);