/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    [
        "../src/LayoutController",
        "zepto"
    ],
    function (
        LayoutController,
        $
    ) {

        describe("The Layout controller", function () {
            var mockScope,
                mockEvent,
                testModel,
                testConfiguration,
                controller,
                mockCompositionCapability,
                mockComposition,
                mockCompositionObjects,
                mockOpenMCT,
                mockSelection,
                mockDomainObjectCapability,
                $element = [],
                selectable = [];

            function mockPromise(value) {
                return {
                    then: function (thenFunc) {
                        return mockPromise(thenFunc(value));
                    }
                };
            }

            function mockDomainObject(id) {
                return {
                    getId: function () {
                        return id;
                    },
                    useCapability: function () {
                        return mockCompositionCapability;
                    },
                    getModel: function () {
                        if (id === 'b') {
                            return {
                                type : 'hyperlink'
                            };
                        } else {
                            return {};
                        }
                    },
                    getCapability: function () {
                        return mockDomainObjectCapability;
                    },
                    hasCapability: function (param) {
                        if (param === 'composition') {
                            return id !== 'b';
                        }
                    }
                };
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$watch", "$watchCollection", "$on", "commit"]
                );
                mockEvent = jasmine.createSpyObj(
                    'event',
                    ['preventDefault', 'stopPropagation']
                );

                testModel = {};

                mockComposition = ["a", "b", "c"];
                mockCompositionObjects = mockComposition.map(mockDomainObject);

                testConfiguration = {
                    panels: {
                        a: {
                            position: [20, 10],
                            dimensions: [5, 5]
                        }
                    }
                };
                mockDomainObjectCapability = jasmine.createSpyObj('capability',
                    ['inEditContext']
                );
                mockCompositionCapability = mockPromise(mockCompositionObjects);

                mockScope.domainObject = mockDomainObject("mockDomainObject");
                mockScope.model = testModel;
                mockScope.configuration = testConfiguration;

                selectable[0] = {
                    context: {
                        oldItem: mockScope.domainObject
                    }
                };

                mockSelection = jasmine.createSpyObj("selection", [
                    'select',
                    'on',
                    'off',
                    'get'
                ]);
                mockSelection.get.andReturn(selectable);
                mockOpenMCT = {
                    selection: mockSelection
                };

                $element = $('<div></div>');
                $(document).find('body').append($element);
                spyOn($element[0], 'click');

                spyOn(mockScope.domainObject, "useCapability").andCallThrough();

                controller = new LayoutController(mockScope, $element, mockOpenMCT);
                spyOn(controller, "layoutPanels").andCallThrough();

                jasmine.Clock.useMock();
            });

            afterEach(function () {
                $element.remove();
            });


            it("listens for selection change events", function () {
                expect(mockOpenMCT.selection.on).toHaveBeenCalledWith(
                    'change',
                    jasmine.any(Function)
                );
            });

            it("cleans up on scope destroy", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    '$destroy',
                    jasmine.any(Function)
                );

                mockScope.$on.calls[0].args[1]();

                expect(mockOpenMCT.selection.off).toHaveBeenCalledWith(
                    'change',
                    jasmine.any(Function)
                );
            });

            // Model changes will indicate that panel positions
            // may have changed, for instance.
            it("watches for changes to composition", function () {
                expect(mockScope.$watchCollection).toHaveBeenCalledWith(
                    "model.composition",
                    jasmine.any(Function)
                );
            });

            it("Retrieves updated composition from composition capability", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();
                expect(mockScope.domainObject.useCapability).toHaveBeenCalledWith(
                    "composition"
                );
                expect(controller.layoutPanels).toHaveBeenCalledWith(
                    mockComposition
                );
            });

            it("Is robust to concurrent changes to composition", function () {
                var secondMockComposition = ["a", "b", "c", "d"],
                    secondMockCompositionObjects = secondMockComposition.map(mockDomainObject),
                    firstCompositionCB,
                    secondCompositionCB;

                spyOn(mockCompositionCapability, "then");
                mockScope.$watchCollection.mostRecentCall.args[1]();
                mockScope.$watchCollection.mostRecentCall.args[1]();

                firstCompositionCB = mockCompositionCapability.then.calls[0].args[0];
                secondCompositionCB = mockCompositionCapability.then.calls[1].args[0];

                //Resolve promises in reverse order
                secondCompositionCB(secondMockCompositionObjects);
                firstCompositionCB(mockCompositionObjects);

                //Expect the promise call that was initiated most recently to
                // be the one used to populate scope, irrespective of order that
                // it was eventually resolved
                expect(mockScope.composition).toBe(secondMockCompositionObjects);
            });


            it("provides styles for frames, from configuration", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();
                expect(controller.getFrameStyle("a")).toEqual({
                    top: "320px",
                    left: "640px",
                    width: "160px",
                    height: "160px",
                    minWidth : '160px',
                    minHeight : '160px'
                });
            });

            it("provides default styles for frames", function () {
                var styleB, styleC;

                // b and c do not have configured positions
                mockScope.$watchCollection.mostRecentCall.args[1]();

                styleB = controller.getFrameStyle("b");
                styleC = controller.getFrameStyle("c");

                // Should have a position, but we don't care what
                expect(styleB.left).toBeDefined();
                expect(styleB.top).toBeDefined();
                expect(styleC.left).toBeDefined();
                expect(styleC.top).toBeDefined();

                // Should have ensured some difference in position
                expect(styleB).not.toEqual(styleC);
            });

            it("allows panels to be dragged", function () {
                // Populate scope
                mockScope.$watchCollection.mostRecentCall.args[1]();

                // Verify precondition
                expect(testConfiguration.panels.b).not.toBeDefined();

                // Do a drag
                controller.startDrag("b", [1, 1], [0, 0]);
                controller.continueDrag([100, 100]);
                controller.endDrag();

                // We do not look closely at the details here;
                // that is tested in LayoutDragSpec. Just make sure
                // that a configuration for b has been defined.
                expect(testConfiguration.panels.b).toBeDefined();
            });


            it("invokes commit after drag", function () {
                // Populate scope
                mockScope.$watchCollection.mostRecentCall.args[1]();

                // Do a drag
                controller.startDrag("b", [1, 1], [0, 0]);
                controller.continueDrag([100, 100]);
                controller.endDrag();

                // Should have triggered commit (provided by
                // EditRepresenter) with some message.
                expect(mockScope.commit)
                    .toHaveBeenCalledWith(jasmine.any(String));
            });

            it("listens for drop events", function () {
                // Layout should position panels according to
                // where the user dropped them, so it needs to
                // listen for drop events.
                expect(mockScope.$on).toHaveBeenCalledWith(
                    'mctDrop',
                    jasmine.any(Function)
                );

                // Verify precondition
                expect(testConfiguration.panels.d).not.toBeDefined();

                // Notify that a drop occurred
                mockScope.$on.mostRecentCall.args[1](
                    mockEvent,
                    'd',
                    { x: 300, y: 100 }
                );
                expect(testConfiguration.panels.d).toBeDefined();
                expect(mockEvent.preventDefault).toHaveBeenCalled();

                // Should have triggered commit (provided by
                // EditRepresenter) with some message.
                expect(mockScope.commit)
                    .toHaveBeenCalledWith(jasmine.any(String));
            });

            it("ignores drops when default has been prevented", function () {
                // Avoids redundant drop-handling, WTD-1233
                mockEvent.defaultPrevented = true;

                // Notify that a drop occurred
                mockScope.$on.mostRecentCall.args[1](
                    mockEvent,
                    'd',
                    { x: 300, y: 100 }
                );
                expect(testConfiguration.panels.d).not.toBeDefined();
            });

            it("ensures a minimum frame size", function () {
                var styleB;

                // Start with a very small frame size
                testModel.layoutGrid = [1, 1];

                // White-boxy; we know which watch is which
                mockScope.$watch.calls[0].args[1](testModel.layoutGrid);
                mockScope.$watchCollection.calls[0].args[1](testModel.composition);

                styleB = controller.getFrameStyle("b");

                // Resulting size should still be reasonably large pixel-size
                expect(parseInt(styleB.width, 10)).toBeGreaterThan(63);
                expect(parseInt(styleB.width, 10)).toBeGreaterThan(31);
            });

            it("ensures a minimum frame size on drop", function () {
                var style;

                // Start with a very small frame size
                testModel.layoutGrid = [1, 1];
                mockScope.$watch.calls[0].args[1](testModel.layoutGrid);

                // Notify that a drop occurred
                mockScope.$on.mostRecentCall.args[1](
                    mockEvent,
                    'd',
                    { x: 300, y: 100 }
                );
                mockScope.$watch.calls[0].args[1](['d']);

                style = controller.getFrameStyle("d");

                // Resulting size should still be reasonably large pixel-size
                expect(parseInt(style.width, 10)).toBeGreaterThan(63);
                expect(parseInt(style.height, 10)).toBeGreaterThan(31);
            });

            it("updates positions of existing objects on a drop", function () {
                var oldStyle;

                mockScope.$watchCollection.mostRecentCall.args[1]();

                oldStyle = controller.getFrameStyle("b");

                expect(oldStyle).toBeDefined();

                // ...drop event...
                mockScope.$on.mostRecentCall
                    .args[1](mockEvent, 'b', { x: 300, y: 100 });

                expect(controller.getFrameStyle("b"))
                    .not.toEqual(oldStyle);
            });

            it("allows objects to be selected", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();
                var childObj = mockCompositionObjects[0];
                selectable[0].context.oldItem = childObj;
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);

                expect(controller.selected(childObj)).toBe(true);
            });

            it("prevents event bubbling while drag is in progress", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();
                var childObj = mockCompositionObjects[0];

                // Do a drag
                controller.startDrag(childObj.getId(), [1, 1], [0, 0]);
                controller.continueDrag([100, 100]);
                controller.endDrag();

                // Because mouse position could cause the parent object to be selected, this should be ignored.
                controller.bypassSelection(mockEvent);

                expect(mockEvent.stopPropagation).toHaveBeenCalled();

                // Shoud be able to select another object when dragging is done.
                jasmine.Clock.tick(0);
                mockEvent.stopPropagation.reset();
                controller.bypassSelection(mockEvent);

                expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
            });

            it("shows frames by default", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();

                expect(controller.hasFrame(mockCompositionObjects[0])).toBe(true);
            });

            it("hyperlinks hide frame by default", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();

                expect(controller.hasFrame(mockCompositionObjects[1])).toBe(false);
            });

            it("hides frame when selected object has frame ", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();
                var childObj = mockCompositionObjects[0];
                selectable[0].context.oldItem = childObj;
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);
                var toolbarObj = controller.getToolbar(childObj.getId(), childObj);

                expect(controller.hasFrame(childObj)).toBe(true);
                expect(toolbarObj.hideFrame).toBeDefined();
                expect(toolbarObj.hideFrame).toEqual(jasmine.any(Function));
            });

            it("shows frame when selected object has no frame", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();
                var childObj = mockCompositionObjects[1];
                selectable[0].context.oldItem = childObj;
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);
                var toolbarObj = controller.getToolbar(childObj.getId(), childObj);

                expect(controller.hasFrame(childObj)).toBe(false);
                expect(toolbarObj.showFrame).toBeDefined();
                expect(toolbarObj.showFrame).toEqual(jasmine.any(Function));
            });

            it("selects the parent object when selected object is removed", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();
                var childObj = mockCompositionObjects[0];
                selectable[0].context.oldItem = childObj;
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);

                var composition = ["b", "c"];
                mockScope.$watchCollection.mostRecentCall.args[1](composition);

                expect($element[0].click).toHaveBeenCalled();
            });

            it("allows objects to be drilled-in only when editing", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();
                var childObj = mockCompositionObjects[0];
                childObj.getCapability().inEditContext.andReturn(false);
                controller.drill(mockEvent, childObj);

                expect(controller.isDrilledIn(childObj)).toBe(false);
            });

            it("allows objects to be drilled-in only if it has sub objects", function () {
                mockScope.$watchCollection.mostRecentCall.args[1]();
                var childObj = mockCompositionObjects[1];
                childObj.getCapability().inEditContext.andReturn(true);
                controller.drill(mockEvent, childObj);

                expect(controller.isDrilledIn(childObj)).toBe(false);
            });

            it("selects a newly-dropped object", function () {
                mockScope.$on.mostRecentCall.args[1](
                    mockEvent,
                    'd',
                    { x: 300, y: 100 }
                );

                var childObj = mockDomainObject("d");
                var testElement = $("<div data-layout-id='some-id'></div>");
                $element.append(testElement);
                spyOn(testElement[0], 'click');

                controller.selectIfNew('some-id', childObj);
                jasmine.Clock.tick(0);

                expect(testElement[0].click).toHaveBeenCalled();
            });
        });
    }
);
