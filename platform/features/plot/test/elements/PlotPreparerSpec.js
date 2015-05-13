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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine,Float32Array*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotPreparer"],
    function (PlotPreparer) {
        "use strict";

        var START = 123456;

        describe("A plot preparer", function () {

            function makeMockData(scale) {
                var mockData = jasmine.createSpyObj(
                    "data" + scale,
                    [ "getPointCount", "getDomainValue", "getRangeValue" ]
                );
                mockData.getPointCount.andReturn(1000);
                mockData.getDomainValue.andCallFake(function (i) {
                    return START + i * 1000;
                });
                mockData.getRangeValue.andCallFake(function (i) {
                    return Math.sin(i / 100) * scale;
                });
                return mockData;
            }

            it("fits to provided data sets", function () {
                var datas = [1, 2, 3].map(makeMockData),
                    preparer = new PlotPreparer(datas);

                expect(preparer.getDomainOffset()).toEqual(START);
                expect(preparer.getOrigin()[0]).toBeCloseTo(START, 3);
                expect(preparer.getOrigin()[1]).toBeCloseTo(-3, 3);
                expect(preparer.getDimensions()[0]).toBeCloseTo(999000, 3);
                expect(preparer.getDimensions()[1]).toBeCloseTo(6, 3);
            });

            it("looks up values using a specified domain and range", function () {
                var datas = [makeMockData(1)],
                    preparer = new PlotPreparer(datas, "testDomain", "testRange");

                expect(datas[0].getDomainValue).toHaveBeenCalledWith(
                    jasmine.any(Number),
                    "testDomain"
                );

                expect(datas[0].getRangeValue).toHaveBeenCalledWith(
                    jasmine.any(Number),
                    "testRange"
                );
            });

            it("provides a default range if data set is flat", function () {
                var datas = [makeMockData(0)],
                    preparer = new PlotPreparer(datas);

                expect(preparer.getDimensions[1]).not.toEqual(0);
            });

            it("provides buffers", function () {
                var datas = [makeMockData(0)],
                    preparer = new PlotPreparer(datas);
                expect(preparer.getBuffers()[0] instanceof Float32Array)
                    .toBeTruthy();
            });

        });
    }
);