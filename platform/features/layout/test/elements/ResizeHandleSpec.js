/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ['../../src/elements/ResizeHandle'],
    function (ResizeHandle) {
        "use strict";

        var TEST_MIN_WIDTH = 4, TEST_MIN_HEIGHT = 2;

        describe("A fixed position drag handle", function () {
            var testElement,
                handle;

            beforeEach(function () {
                testElement = {
                    x: 3,
                    y: 42,
                    width: 30,
                    height: 36
                };

                handle = new ResizeHandle(
                    testElement,
                    TEST_MIN_WIDTH,
                    TEST_MIN_HEIGHT
                );
            });

            it("provides x/y grid coordinates for lower-right corner", function () {
                expect(handle.x()).toEqual(33);
                expect(handle.y()).toEqual(78);
            });

            it("changes width of an element", function () {
                handle.x(30);
                // Should change width, not x
                expect(testElement.x).toEqual(3);
                expect(testElement.width).toEqual(27);
            });

            it("changes height of an element", function () {
                handle.y(60);
                // Should change height, not y
                expect(testElement.y).toEqual(42);
                expect(testElement.height).toEqual(18);
            });

            it("enforces minimum width/height", function () {
                handle.x(testElement.x);
                handle.y(testElement.y);
                expect(testElement.x).toEqual(3);
                expect(testElement.y).toEqual(42);
                expect(testElement.width).toEqual(TEST_MIN_WIDTH);
                expect(testElement.height).toEqual(TEST_MIN_HEIGHT);
            });

        });
    }
);