/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/directives/MCTDrag"],
    function (MCTDrag) {
        "use strict";

        var JQLITE_METHODS = [ "on", "off", "find" ];

        describe("The mct-drag directive", function () {
            var mockDocument,
                mockScope,
                mockElement,
                testAttrs,
                mockBody,
                mctDrag;

            function testEvent(x, y) {
                return {
                    pageX: x,
                    pageY: y,
                    preventDefault: jasmine.createSpy("preventDefault")
                };
            }

            beforeEach(function () {
                mockDocument =
                    jasmine.createSpyObj("$document", JQLITE_METHODS);
                mockScope =
                    jasmine.createSpyObj("$scope", [ "$eval", "$apply" ]);
                mockElement =
                    jasmine.createSpyObj("element", JQLITE_METHODS);
                mockBody =
                    jasmine.createSpyObj("body", JQLITE_METHODS);

                testAttrs = {
                    mctDragDown: "starting a drag",
                    mctDrag: "continuing a drag",
                    mctDragUp: "ending a drag"
                };

                mockDocument.find.andReturn(mockBody);

                mctDrag = new MCTDrag(mockDocument);
                mctDrag.link(mockScope, mockElement, testAttrs);
            });

            it("is valid as an attribute", function () {
                expect(mctDrag.restrict).toEqual("A");
            });

            it("listens for mousedown on its element", function () {
                expect(mockElement.on).toHaveBeenCalledWith(
                    "mousedown",
                    jasmine.any(Function)
                );

                // Verify no interactions with body as well
                expect(mockBody.on).not.toHaveBeenCalled();
            });

            it("invokes mctDragDown when dragging begins", function () {
                mockElement.on.mostRecentCall.args[1](testEvent(42, 60));
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctDragDown,
                    { delta: [0, 0] }
                );
            });

            it("listens for mousemove after dragging begins", function () {
                mockElement.on.mostRecentCall.args[1](testEvent(42, 60));
                expect(mockBody.on).toHaveBeenCalledWith(
                    "mousemove",
                    jasmine.any(Function)
                );
                expect(mockBody.on).toHaveBeenCalledWith(
                    "mouseup",
                    jasmine.any(Function)
                );
            });

            it("invokes mctDrag expression during drag", function () {
                mockElement.on.mostRecentCall.args[1](testEvent(42, 60));

                // Find and invoke the mousemove listener
                mockBody.on.calls.forEach(function (call) {
                    if (call.args[0] === 'mousemove') {
                        call.args[1](testEvent(52, 200));
                    }
                });

                // Should have passed that delta to mct-drag expression
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctDrag,
                    { delta: [10, 140] }
                );
            });

            it("invokes mctDragUp expression after drag", function () {
                mockElement.on.mostRecentCall.args[1](testEvent(42, 60));

                // Find and invoke the mousemove listener
                mockBody.on.calls.forEach(function (call) {
                    if (call.args[0] === 'mousemove') {
                        call.args[1](testEvent(52, 200));
                    }
                });
                // Find and invoke the mousemove listener
                mockBody.on.calls.forEach(function (call) {
                    if (call.args[0] === 'mouseup') {
                        call.args[1](testEvent(40, 71));
                    }
                });

                // Should have passed that delta to mct-drag-up expression
                // and that delta should have been relative to the
                // initial position
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctDragUp,
                    { delta: [-2, 11] }
                );

                // Should also have unregistered listeners
                expect(mockBody.off).toHaveBeenCalled();
            });

        });
    }
);