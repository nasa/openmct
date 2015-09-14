/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../../src/controllers/graph/TimelineGraphRenderer'],
    function (TimelineGraphRenderer) {
        'use strict';

        describe("A Timeline's graph renderer", function () {
            var renderer;

            beforeEach(function () {
                renderer = new TimelineGraphRenderer();
            });

            it("converts utilizations to buffers", function () {
                var utilization = {
                        getPointCount: function () {
                            return 10;
                        },
                        getDomainValue: function (i) {
                            return i * 10;
                        },
                        getRangeValue: function (i) {
                            return Math.sin(i);
                        }
                    },
                    buffer = renderer.render(utilization),
                    i;

                // Should be flat list of alternating x/y,
                // so 20 elements
                expect(buffer.length).toEqual(20);

                // Verify contents
                for (i = 0; i < 10; i += 1) {
                    // Check for 6 decimal digits of precision, roughly
                    // what we expect after conversion to 32-bit float
                    expect(buffer[i * 2]).toBeCloseTo(i * 10, 6);
                    expect(buffer[i * 2 + 1]).toBeCloseTo(Math.sin(i), 6);
                }
            });

            it("decodes color strings", function () {
                // Note that decoded color should have alpha channel as well
                expect(renderer.decode('#FFFFFF'))
                    .toEqual([1, 1, 1, 1]);
                expect(renderer.decode('#000000'))
                    .toEqual([0, 0, 0, 1]);
                expect(renderer.decode('#FF8000'))
                    .toEqual([1, 0.5019607843137255, 0, 1]);
            });


        });
    }
);