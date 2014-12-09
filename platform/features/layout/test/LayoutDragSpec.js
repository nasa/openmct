/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../src/LayoutDrag"],
    function (LayoutDrag) {
        "use strict";

        describe("A Layout drag handler", function () {
            var testPosition = {
                    position: [ 8, 11 ],
                    dimensions: [ 3, 2 ]
                };

            it("changes position by a supplied factor, rounding by grid size", function () {
                var handler = new LayoutDrag(
                    testPosition,
                    [ 1, 1 ],
                    [ 0, 0 ],
                    [ 10, 20 ]
                );

                expect(handler.getAdjustedPosition([ 37, 84 ])).toEqual({
                    position: [ 12, 15 ],
                    dimensions: [ 3, 2 ]
                });
                expect(handler.getAdjustedPosition([ -37, 84 ])).toEqual({
                    position: [ 4, 15 ],
                    dimensions: [ 3, 2 ]
                });
            });

            it("changes dimensions by a supplied factor, rounding by grid size", function () {
                var handler = new LayoutDrag(
                    testPosition,
                    [ 0, 0 ],
                    [ 1, 1 ],
                    [ 10, 20 ]
                );

                expect(handler.getAdjustedPosition([ 37, 84 ])).toEqual({
                    position: [ 8, 11 ],
                    dimensions: [ 7, 6 ]
                });
            });

            it("allows mixing dimension and position factors", function () {
                var handler = new LayoutDrag(
                    testPosition,
                    [ 0, 1 ],
                    [ -1, 0 ],
                    [ 10, 20 ]
                );

                expect(handler.getAdjustedPosition([ 11, 84 ])).toEqual({
                    position: [ 8, 15 ],
                    dimensions: [ 2, 2 ]
                });
            });

        });
    }
);