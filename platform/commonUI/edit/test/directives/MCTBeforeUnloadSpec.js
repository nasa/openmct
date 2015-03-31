/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/directives/MCTBeforeUnload"],
    function (MCTBeforeUnload) {
        "use strict";

        describe("The mct-before-unload directive", function () {
            var mockWindow,
                directive;

            beforeEach(function () {
                mockWindow = {};
                directive = new MCTBeforeUnload(mockWindow);
            });

            it("can be used only as an attribute", function () {
                expect(directive.restrict).toEqual('A');
            });

        });
    }
);