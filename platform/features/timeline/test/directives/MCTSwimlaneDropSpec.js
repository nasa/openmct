/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/directives/MCTSwimlaneDrop'],
    function (MCTSwimlaneDrop) {
        "use strict";

        var TEST_HEIGHT = 100,
            TEST_TOP = 600;

        describe("The mct-swimlane-drop directive", function () {
            var mockDndService,
                mockScope,
                mockElement,
                testAttrs,
                mockSwimlane,
                mockRealElement,
                testEvent,
                handlers,
                directive;

            function getterSetter(value) {
                return function (newValue) {
                    return (value = (arguments.length > 0) ? newValue : value);
                };
            }

            beforeEach(function () {
                var scopeExprs = {};

                handlers = {};

                mockDndService = jasmine.createSpyObj(
                    'dndService',
                    ['setData', 'getData', 'removeData']
                );
                mockScope = jasmine.createSpyObj('$scope', ['$eval']);
                mockElement = jasmine.createSpyObj('element', ['on']);
                testAttrs = { mctSwimlaneDrop: "mockSwimlane" };
                mockSwimlane = jasmine.createSpyObj(
                    "swimlane",
                    [ "allowDropIn", "allowDropAfter", "drop", "highlight", "highlightBottom" ]
                );
                mockElement[0] = jasmine.createSpyObj(
                    "realElement",
                    [ "getBoundingClientRect" ]
                );
                mockElement[0].offsetHeight = TEST_HEIGHT;
                mockElement[0].getBoundingClientRect.andReturn({ top: TEST_TOP });

                // Simulate evaluation of expressions in scope
                scopeExprs.mockSwimlane = mockSwimlane;
                mockScope.$eval.andCallFake(function (expr) {
                    return scopeExprs[expr];
                });


                mockSwimlane.allowDropIn.andReturn(true);
                mockSwimlane.allowDropAfter.andReturn(true);
                // Simulate getter-setter behavior
                mockSwimlane.highlight.andCallFake(getterSetter(false));
                mockSwimlane.highlightBottom.andCallFake(getterSetter(false));



                testEvent = {
                    pageY: TEST_TOP + TEST_HEIGHT / 10,
                    dataTransfer: { getData: jasmine.createSpy() },
                    preventDefault: jasmine.createSpy()
                };

                testEvent.dataTransfer.getData.andReturn('abc');
                mockDndService.getData.andReturn({ domainObject: 'someDomainObject' });

                directive = new MCTSwimlaneDrop(mockDndService);

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

            it("updates highlights on drag over", function () {
                // Near the top
                testEvent.pageY = TEST_TOP + TEST_HEIGHT / 10;

                handlers.dragover(testEvent);

                expect(mockSwimlane.highlight).toHaveBeenCalledWith(true);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(false);
            });

            it("updates bottom highlights on drag over", function () {
                // Near the bottom
                testEvent.pageY = TEST_TOP + TEST_HEIGHT - TEST_HEIGHT / 10;

                handlers.dragover(testEvent);

                expect(mockSwimlane.highlight).toHaveBeenCalledWith(false);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(true);
            });

            it("respects swimlane's allowDropIn response", function () {
                // Near the top
                testEvent.pageY = TEST_TOP + TEST_HEIGHT / 10;

                mockSwimlane.allowDropIn.andReturn(false);

                handlers.dragover(testEvent);

                expect(mockSwimlane.highlight).toHaveBeenCalledWith(false);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(false);
            });

            it("respects swimlane's allowDropAfter response", function () {
                // Near the top
                testEvent.pageY = TEST_TOP + TEST_HEIGHT - TEST_HEIGHT / 10;

                mockSwimlane.allowDropAfter.andReturn(false);

                handlers.dragover(testEvent);

                expect(mockSwimlane.highlight).toHaveBeenCalledWith(false);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(false);
            });

            it("notifies swimlane on drop", function () {
                handlers.drop(testEvent);
                expect(mockSwimlane.drop).toHaveBeenCalledWith('abc', 'someDomainObject');
            });

            it("clears highlights when drag leaves", function () {
                handlers.dragleave();
                expect(mockSwimlane.highlight).toHaveBeenCalledWith(false);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(false);
            });
        });
    }
);
