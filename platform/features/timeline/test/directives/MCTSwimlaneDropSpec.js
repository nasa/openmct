/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    ['../../src/directives/MCTSwimlaneDrop'],
    (MCTSwimlaneDrop) => {

        let TEST_HEIGHT = 100,
            TEST_TOP = 600;

        describe("The mct-swimlane-drop directive", () => {
            let mockDndService,
                mockScope,
                mockElement,
                testAttrs,
                mockSwimlane,
                testEvent,
                handlers,
                directive;

            const getterSetter = (value) => {
                return (newValue) => {
                    return (value = (arguments.length > 0) ? newValue : value);
                };
            }

            beforeEach(() => {
                let scopeExprs = {};

                handlers = {};

                mockDndService = jasmine.createSpyObj(
                    'dndService',
                    ['setData', 'getData', 'removeData']
                );
                mockScope = jasmine.createSpyObj('$scope', ['$eval', '$apply']);
                mockElement = jasmine.createSpyObj('element', ['on']);
                testAttrs = { mctSwimlaneDrop: "mockSwimlane" };
                mockSwimlane = jasmine.createSpyObj(
                    "swimlane",
                    ["allowDropIn", "allowDropAfter", "drop", "highlight", "highlightBottom"]
                );
                mockElement[0] = jasmine.createSpyObj(
                    "realElement",
                    ["getBoundingClientRect"]
                );
                mockElement[0].offsetHeight = TEST_HEIGHT;
                mockElement[0].getBoundingClientRect.andReturn({ top: TEST_TOP });

                // Simulate evaluation of expressions in scope
                scopeExprs.mockSwimlane = mockSwimlane;
                mockScope.$eval.andCallFake( (expr) => {
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
                    preventDefault: jasmine.createSpy(),
                    stopPropagation: jasmine.createSpy()
                };

                testEvent.dataTransfer.getData.andReturn('abc');
                mockDndService.getData.andReturn({ domainObject: 'someDomainObject' });

                directive = new MCTSwimlaneDrop(mockDndService);

                // Run the link function, then capture the event handlers
                // for testing.
                directive.link(mockScope, mockElement, testAttrs);

                mockElement.on.calls.forEach( (call) => {
                    handlers[call.args[0]] = call.args[1];
                });

            });

            it("is available as an attribute", () => {
                expect(directive.restrict).toEqual("A");
            });

            it("updates highlights on drag over", () => {
                // Near the top
                testEvent.pageY = TEST_TOP + TEST_HEIGHT / 10;

                handlers.dragover(testEvent);

                expect(mockSwimlane.highlight).toHaveBeenCalledWith(true);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(false);
                expect(mockScope.$apply).toHaveBeenCalled();
            });

            it("updates bottom highlights on drag over", () => {
                // Near the bottom
                testEvent.pageY = TEST_TOP + TEST_HEIGHT - TEST_HEIGHT / 10;

                handlers.dragover(testEvent);

                expect(mockSwimlane.highlight).toHaveBeenCalledWith(false);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(true);
                expect(mockScope.$apply).toHaveBeenCalled();
            });

            it("respects swimlane's allowDropIn response", () => {
                // Near the top
                testEvent.pageY = TEST_TOP + TEST_HEIGHT / 10;

                mockSwimlane.allowDropIn.andReturn(false);

                handlers.dragover(testEvent);

                expect(mockSwimlane.highlight).toHaveBeenCalledWith(false);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(false);
            });

            it("respects swimlane's allowDropAfter response", () => {
                // Near the top
                testEvent.pageY = TEST_TOP + TEST_HEIGHT - TEST_HEIGHT / 10;

                mockSwimlane.allowDropAfter.andReturn(false);

                handlers.dragover(testEvent);

                expect(mockSwimlane.highlight).toHaveBeenCalledWith(false);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(false);
            });

            it("notifies swimlane on drop", () => {
                handlers.drop(testEvent);
                expect(mockSwimlane.drop).toHaveBeenCalledWith('abc', 'someDomainObject');
                expect(mockScope.$apply).toHaveBeenCalled();
            });

            it("invokes preventDefault on drop", () => {
                handlers.drop(testEvent);
                expect(testEvent.preventDefault).toHaveBeenCalled();
            });

            it("clears highlights when drag leaves", () => {
                mockSwimlane.highlight.andReturn(true);
                handlers.dragleave();
                expect(mockSwimlane.highlight).toHaveBeenCalledWith(false);
                expect(mockSwimlane.highlightBottom).toHaveBeenCalledWith(false);
                expect(mockScope.$apply).toHaveBeenCalled();
            });
        });
    }
);
