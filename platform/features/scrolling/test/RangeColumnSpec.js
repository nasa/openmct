/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/RangeColumn"],
    function (RangeColumn) {
        "use strict";

        describe("A range column", function () {
            var mockDataSet,
                testMetadata,
                column;

            beforeEach(function () {
                mockDataSet = jasmine.createSpyObj(
                    "data",
                    [ "getRangeValue" ]
                );
                testMetadata = {
                    key: "testKey",
                    name: "Test Name"
                };
                column = new RangeColumn(testMetadata);
            });

            it("reports a column header from range metadata", function () {
                expect(column.getTitle()).toEqual("Test Name");
            });

            it("looks up data from a data set", function () {
                column.getValue(undefined, mockDataSet, 42);
                expect(mockDataSet.getRangeValue)
                    .toHaveBeenCalledWith(42, "testKey");
            });

            it("formats range values as time", function () {
                mockDataSet.getRangeValue.andReturn(123.45678);
                expect(column.getValue(undefined, mockDataSet, 42))
                    .toEqual("123.457");
            });
        });
    }
);