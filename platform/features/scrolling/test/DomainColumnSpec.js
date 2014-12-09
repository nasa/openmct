/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/DomainColumn"],
    function (DomainColumn) {
        "use strict";

        describe("A domain column", function () {
            var mockDataSet,
                testMetadata,
                column;

            beforeEach(function () {
                mockDataSet = jasmine.createSpyObj(
                    "data",
                    [ "getDomainValue" ]
                );
                testMetadata = {
                    key: "testKey",
                    name: "Test Name"
                };
                column = new DomainColumn(testMetadata);
            });

            it("reports a column header from domain metadata", function () {
                expect(column.getTitle()).toEqual("Test Name");
            });

            it("looks up data from a data set", function () {
                column.getValue(undefined, mockDataSet, 42);
                expect(mockDataSet.getDomainValue)
                    .toHaveBeenCalledWith(42, "testKey");
            });

            it("formats domain values as time", function () {
                mockDataSet.getDomainValue.andReturn(402513731000);
                expect(column.getValue(undefined, mockDataSet, 42))
                    .toEqual("1982-276 17:22:11");
            });

        });
    }
);