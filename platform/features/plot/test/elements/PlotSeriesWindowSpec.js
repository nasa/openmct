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
    ["../../src/elements/PlotSeriesWindow"],
    function (PlotSeriesWindow) {
        "use strict";

        describe("A plot's window on a telemetry series", function () {
            var mockSeries,
                testSeries,
                window;

            beforeEach(function () {
                testSeries = [
                    [ 0, 42 ],
                    [ 10, 1 ],
                    [ 20, 4 ],
                    [ 30, 9 ],
                    [ 40, 3 ]
                ];

                mockSeries = jasmine.createSpyObj(
                    'series',
                    ['getPointCount', 'getDomainValue', 'getRangeValue']
                );

                mockSeries.getPointCount.andCallFake(function () {
                    return testSeries.length;
                });
                mockSeries.getDomainValue.andCallFake(function (i) {
                    return testSeries[i][0];
                });
                mockSeries.getRangeValue.andCallFake(function (i) {
                    return testSeries[i][1];
                });

                window = new PlotSeriesWindow(
                    mockSeries,
                    "testDomain",
                    "testRange",
                    1,
                    testSeries.length
                );
            });

            it("provides a window upon a data series", function () {
                expect(window.getPointCount()).toEqual(4);
                expect(window.getDomainValue(0)).toEqual(10);
                expect(window.getRangeValue(0)).toEqual(1);
            });

            it("looks up using specific domain/range keys", function () {
                window.getDomainValue(0);
                window.getRangeValue(0);
                expect(mockSeries.getDomainValue)
                    .toHaveBeenCalledWith(1, 'testDomain');
                expect(mockSeries.getRangeValue)
                    .toHaveBeenCalledWith(1, 'testRange');
            });

            it("can be split into smaller windows", function () {
                var windows = window.split();
                expect(windows.length).toEqual(2);
                expect(windows[0].getPointCount()).toEqual(2);
                expect(windows[1].getPointCount()).toEqual(2);
                expect(windows[0].getDomainValue(0)).toEqual(10);
                expect(windows[1].getDomainValue(0)).toEqual(30);
                expect(windows[0].getRangeValue(0)).toEqual(1);
                expect(windows[1].getRangeValue(0)).toEqual(9);
            });

        });
    }
);