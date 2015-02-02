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