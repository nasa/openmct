/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../src/TimelineConstants'],
    function (TimelineConstants) {
        "use strict";
        describe("The set of Timeline constants", function () {
            it("specifies a handle width", function () {
                expect(TimelineConstants.HANDLE_WIDTH)
                    .toEqual(jasmine.any(Number));
            });
        });
    }
);
