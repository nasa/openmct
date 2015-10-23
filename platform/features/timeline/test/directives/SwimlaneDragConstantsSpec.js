/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/directives/SwimlaneDragConstants'],
    function (SwimlaneDragConstants) {
        "use strict";

        describe("Timeline swimlane drag constants", function () {
            it("define a custom type for swimlane drag-drop", function () {
                expect(SwimlaneDragConstants.TIMELINE_SWIMLANE_DRAG_TYPE)
                    .toEqual(jasmine.any(String));
            });
        });
    }
);
