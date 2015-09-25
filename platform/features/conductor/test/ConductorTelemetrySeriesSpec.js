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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/ConductorTelemetrySeries", "./TestTimeConductor"],
    function (ConductorTelemetrySeries, TestTimeConductor) {
        "use strict";

        describe("ConductorTelemetrySeries", function () {
            var mockSeries,
                mockConductor,
                testArray,
                series;

            beforeEach(function () {
                testArray = [ -10, 0, 42, 1977, 12321 ];

                mockSeries = jasmine.createSpyObj(
                    'series',
                    [ 'getPointCount', 'getDomainValue', 'getRangeValue' ]
                );
                mockConductor = new TestTimeConductor();

                mockSeries.getPointCount.andCallFake(function () {
                    return testArray.length;
                });
                mockSeries.getDomainValue.andCallFake(function (i) {
                    return testArray[i];
                });
                mockSeries.getRangeValue.andCallFake(function (i) {
                    return testArray[i] * 2;
                });

                mockConductor.displayStart.andReturn(0);
                mockConductor.displayEnd.andReturn(2000);

                series = new ConductorTelemetrySeries(
                    mockSeries,
                    mockConductor
                );
            });

            it("reduces the apparent size of a series", function () {
                expect(series.getPointCount()).toEqual(3);
            });

            it("maps domain value indexes to the displayable range", function () {
                [0, 1, 2].forEach(function (i) {
                    expect(series.getDomainValue(i))
                        .toEqual(mockSeries.getDomainValue(i + 1));
                });
            });

            it("maps range value indexes to the displayable range", function () {
                [0, 1, 2].forEach(function (i) {
                    expect(series.getRangeValue(i))
                        .toEqual(mockSeries.getRangeValue(i + 1));
                });
            });

        });
    }
);
