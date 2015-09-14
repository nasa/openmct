/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../../src/controllers/drag/TimelineSnapHandler'],
    function (TimelineSnapHandler) {
        'use strict';

        describe("A Timeline snap handler", function () {
            var mockDragHandler,
                handler;

            beforeEach(function () {
                var starts = { a: 1000, b: 2000, c: 2500, d: 2600 },
                    ends = { a: 2050, b: 3000, c: 2700, d: 10000 };

                mockDragHandler = jasmine.createSpyObj(
                    'dragHandler',
                    [ 'start', 'end', 'ids' ]
                );

                mockDragHandler.ids.andReturn(['a', 'b', 'c', 'd']);
                mockDragHandler.start.andCallFake(function (id) {
                    return starts[id];
                });
                mockDragHandler.end.andCallFake(function (id) {
                    return ends[id];
                });

                handler = new TimelineSnapHandler(mockDragHandler);
            });

            it("provides a preferred snap location within tolerance", function () {
                expect(handler.snap(2511, 15, 'a')).toEqual(2500); // c's start
                expect(handler.snap(2488, 15, 'a')).toEqual(2500); // c's start
                expect(handler.snap(10, 1000, 'b')).toEqual(1000); // a's start
                expect(handler.snap(2711, 20, 'd')).toEqual(2700); // c's end
            });

            it("excludes provided id from snapping", function () {
                // Don't want objects to snap to themselves, so we need
                // this exclusion.
                expect(handler.snap(2010, 50, 'b')).toEqual(2050); // a's end
                // Verify that b's start would have been used had the
                // id not been provided
                expect(handler.snap(2010, 50, 'd')).toEqual(2000);
            });

            it("snaps to the closest point, when multiple match", function () {
                // 2600 and 2700 (plus others) are both in range here
                expect(handler.snap(2651, 1000, 'a')).toEqual(2700);
            });

            it("does not snap if no points are within tolerance", function () {
                // Closest are 1000 and 2000, which are well outside of tolerance
                expect(handler.snap(1503, 100, 'd')).toEqual(1503);
            });

        });
    }
);