/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/directives/WARPSwimlaneDrag', '../../src/directives/SwimlaneDragConstants'],
    function (WARPSwimlaneDrag, SwimlaneDragConstants) {
        "use strict";

        describe("The warp-swimlane-drag directive", function () {
            var mockDndService,
                mockScope,
                mockElement,
                testAttrs,
                handlers,
                directive;

            beforeEach(function () {
                var scopeExprs = {
                    someTestExpr: "some swimlane"
                };

                handlers = {};

                mockDndService = jasmine.createSpyObj(
                    'dndService',
                    ['setData', 'getData', 'removeData']
                );
                mockScope = jasmine.createSpyObj('$scope', ['$eval']);
                mockElement = jasmine.createSpyObj('element', ['on']);
                testAttrs = { warpSwimlaneDrag: "someTestExpr" };

                // Simulate evaluation of expressions in scope
                mockScope.$eval.andCallFake(function (expr) {
                    return scopeExprs[expr];
                });

                directive = new WARPSwimlaneDrag(mockDndService);

                // Run the link function, then capture the event handlers
                // for testing.
                directive.link(mockScope, mockElement, testAttrs);

                mockElement.on.calls.forEach(function (call) {
                    handlers[call.args[0]] = call.args[1];
                });

            });

            it("is available as an attribute", function () {
                expect(directive.restrict).toEqual("A");
            });

            it("exposes the swimlane when dragging starts", function () {
                // Verify precondition
                expect(mockDndService.setData).not.toHaveBeenCalled();
                // Start a drag
                handlers.dragstart();
                // Should have exposed the swimlane
                expect(mockDndService.setData).toHaveBeenCalledWith(
                    SwimlaneDragConstants.WARP_SWIMLANE_DRAG_TYPE,
                    "some swimlane"
                );
            });

            it("clears the swimlane when dragging ends", function () {
                // Verify precondition
                expect(mockDndService.removeData).not.toHaveBeenCalled();
                // Start a drag
                handlers.dragend();
                // Should have exposed the swimlane
                expect(mockDndService.removeData).toHaveBeenCalledWith(
                    SwimlaneDragConstants.WARP_SWIMLANE_DRAG_TYPE
                );
            });
        });
    }
);