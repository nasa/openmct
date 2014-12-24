/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/RangeColumn"],
    function (RangeColumn) {
        "use strict";

        var TEST_RANGE_VALUE = "some formatted range value";

        describe("A range column", function () {
            var mockDataSet,
                testMetadata,
                mockFormatter,
                column;

            beforeEach(function () {
                mockDataSet = jasmine.createSpyObj(
                    "data",
                    [ "getRangeValue" ]
                );
                mockFormatter = jasmine.createSpyObj(
                    "formatter",
                    [ "formatDomainValue", "formatRangeValue" ]
                );
                testMetadata = {
                    key: "testKey",
                    name: "Test Name"
                };
                mockFormatter.formatRangeValue.andReturn(TEST_RANGE_VALUE);

                column = new RangeColumn(testMetadata, mockFormatter);
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
                    .toEqual(TEST_RANGE_VALUE);

                // Make sure that service interactions were as expected
                expect(mockFormatter.formatRangeValue)
                    .toHaveBeenCalledWith(123.45678);
                expect(mockFormatter.formatDomainValue)
                    .not.toHaveBeenCalled();
            });
        });
    }
);