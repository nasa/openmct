/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotLineBuffer"],
    function (PlotLineBuffer) {
        "use strict";

        var TEST_INITIAL_SIZE = 10,
            TEST_MAX_SIZE = 40,
            TEST_DOMAIN_OFFSET = 42;

        describe("A plot line buffer", function () {
            var mockSeries,
                testDomainValues,
                testRangeValues,
                buffer;

            beforeEach(function () {
                testDomainValues = [ 1, 3, 7, 9, 14, 15 ];
                testRangeValues = [ 8, 0, 3, 9, 8, 11 ];
                mockSeries = jasmine.createSpyObj(
                    "series",
                    ['getPointCount', 'getDomainValue', 'getRangeValue']
                );
                mockSeries.getPointCount.andCallFake(function () {
                    return testDomainValues.length;
                });
                mockSeries.getDomainValue.andCallFake(function (i) {
                    return testDomainValues[i];
                });
                mockSeries.getRangeValue.andCallFake(function (i) {
                    return testRangeValues[i];
                });

                buffer = new PlotLineBuffer(
                    TEST_DOMAIN_OFFSET,
                    TEST_INITIAL_SIZE,
                    TEST_MAX_SIZE
                );

                // Start with some data in there
                buffer.insert(mockSeries, 0);
            });

            it("allows insertion of series data", function () {
                // Convert to a regular array for checking.
                // Verify that domain/ranges were interleaved and
                // that domain offset was adjusted for.
                expect(
                    Array.prototype.slice.call(buffer.getBuffer()).slice(0, 12)
                ).toEqual([ -41, 8, -39, 0, -35, 3, -33, 9, -28, 8, -27, 11]);
            });

            it("finds insertion indexes", function () {
                expect(buffer.findInsertionIndex(0)).toEqual(0);
                expect(buffer.findInsertionIndex(2)).toEqual(1);
                expect(buffer.findInsertionIndex(5)).toEqual(2);
                expect(buffer.findInsertionIndex(10)).toEqual(4);
                expect(buffer.findInsertionIndex(14.5)).toEqual(5);
                expect(buffer.findInsertionIndex(20)).toEqual(6);

                // 9 is already in there, disallow insertion
                expect(buffer.findInsertionIndex(9)).toEqual(-1);
            });

            it("allows insertion in the middle", function () {
                var head = [ -41, 8, -39, 0, -35, 3 ],
                    tail = [ -33, 9, -28, 8, -27, 11];
                buffer.insert(mockSeries, 3);
                expect(
                    Array.prototype.slice.call(buffer.getBuffer()).slice(0, 24)
                ).toEqual(head.concat(head).concat(tail).concat(tail));
            });

        });
    }
);