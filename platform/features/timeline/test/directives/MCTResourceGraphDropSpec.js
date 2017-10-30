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
    ['../../src/directives/MCTResourceGraphDrop', '../../src/directives/SwimlaneDragConstants'],
    function (MCTResourceGraphDrop, SwimlaneDragConstants) {

        describe("The mct-resource-graph-drop directive", function () {
            var mockDndService,
                mockScope,
                mockElement,
                testAttrs,
                mockSwimlane,
                testEvent,
                handlers,
                directive;

            beforeEach(function () {
                handlers = {};

                mockDndService = jasmine.createSpyObj(
                    'dndService',
                    ['setData', 'getData', 'removeData']
                );
                mockScope = jasmine.createSpyObj('$scope', ['$eval', '$apply']);
                mockElement = jasmine.createSpyObj('element', ['on', 'addClass', 'removeClass']);
                testAttrs = { mctSwimlaneDrop: "mockSwimlane" };
                mockSwimlane = jasmine.createSpyObj(
                    "swimlane",
                    ['graph', 'toggleGraph']
                );

                testEvent = {
                    dataTransfer: { getData: jasmine.createSpy() },
                    preventDefault: jasmine.createSpy(),
                    stopPropagation: jasmine.createSpy()
                };

                testEvent.dataTransfer.getData.andReturn('abc');
                mockDndService.getData.andCallFake(function (key) {
                    return key === SwimlaneDragConstants.TIMELINE_SWIMLANE_DRAG_TYPE ?
                        mockSwimlane : undefined;
                });

                mockSwimlane.graph.andReturn(false);

                directive = new MCTResourceGraphDrop(mockDndService);
                directive.link(mockScope, mockElement, testAttrs);

                mockElement.on.calls.forEach(function (call) {
                    handlers[call.args[0]] = call.args[1];
                });
            });

            it("is available as an attribute", function () {
                expect(directive.restrict).toEqual("A");
            });

            [false, true].forEach(function (graphing) {
                describe("when swimlane graph is " + (graphing ? "" : "not ") + "enabled", function () {
                    beforeEach(function () {
                        mockSwimlane.graph.andReturn(graphing);
                    });


                    describe("on dragover", function () {
                        var prefix = !graphing ? "does" : "does not";

                        beforeEach(function ()  {
                            handlers.dragover(testEvent);
                        });

                        it(prefix + " add a drop-over class", function () {
                            var expectAddClass = expect(mockElement.addClass);
                            (!graphing ? expectAddClass : expectAddClass.not)
                                .toHaveBeenCalledWith('drop-over');
                        });

                        it(prefix + " call $apply on scope", function () {
                            var expectApply = expect(mockScope.$apply);
                            (!graphing ? expectApply : expectApply.not)
                                .toHaveBeenCalled();
                        });

                        it(prefix + " prevent default", function () {
                            var expectPreventDefault = expect(testEvent.preventDefault);
                            (!graphing ? expectPreventDefault : expectPreventDefault.not)
                                .toHaveBeenCalled();
                        });
                    });

                    describe("on drop", function () {
                        var prefix = !graphing ? "does" : "does not";

                        beforeEach(function ()  {
                            handlers.drop(testEvent);
                        });

                        it("removes any drop-over class", function () {
                            expect(mockElement.removeClass)
                                .toHaveBeenCalledWith('drop-over');
                        });

                        it(prefix + " toggle the swimlane's resource graph", function () {
                            var expectToggle = expect(mockSwimlane.toggleGraph);
                            (!graphing ? expectToggle : expectToggle.not)
                                .toHaveBeenCalled();
                        });

                        it(prefix + " prevent default", function () {
                            var expectPreventDefault = expect(testEvent.preventDefault);
                            (!graphing ? expectPreventDefault : expectPreventDefault.not)
                                .toHaveBeenCalled();
                        });
                    });

                    describe("on dragleave", function () {
                        beforeEach(function ()  {
                            handlers.dragleave(testEvent);
                        });

                        it("removes any drop-over class", function () {
                            expect(mockElement.removeClass)
                                .toHaveBeenCalledWith('drop-over');
                        });

                        it("calls $apply on scope", function () {
                            expect(mockScope.$apply).toHaveBeenCalled();
                        });

                        it("calls preventDefault on events", function () {
                            expect(testEvent.preventDefault).toHaveBeenCalled();
                        });
                    });
                });
            });

        });
    }
);
