/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../src/LayoutController"],
    function (LayoutController) {
        "use strict";

        describe("The Layout controller", function () {
            var mockScope,
                mockEvent,
                testModel,
                testConfiguration,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch", "$on", "commit" ]
                );
                mockEvent = jasmine.createSpyObj(
                    'event',
                    [ 'preventDefault', 'isDefaultPrevented' ]
                );

                testModel = {
                    composition: [ "a", "b", "c" ]
                };

                testConfiguration = {
                    panels: {
                        a: {
                            position: [20, 10],
                            dimensions: [5, 5]
                        }
                    }
                };

                mockScope.model = testModel;
                mockScope.configuration = testConfiguration;

                controller = new LayoutController(mockScope);
            });

            // Model changes will indicate that panel positions
            // may have changed, for instance.
            it("watches for changes to composition", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "model.composition",
                    jasmine.any(Function)
                );
            });

            it("provides styles for frames, from configuration", function () {
                mockScope.$watch.mostRecentCall.args[1](testModel.composition);
                expect(controller.getFrameStyle("a")).toEqual({
                    top: "320px",
                    left: "640px",
                    width: "160px",
                    height: "160px"
                });
            });

            it("provides default styles for frames", function () {
                var styleB, styleC;

                // b and c do not have configured positions
                mockScope.$watch.mostRecentCall.args[1](testModel.composition);

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
                mockScope.$watch.mostRecentCall.args[1](testModel.composition);

                // Verify precondtion
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
                mockScope.$watch.mostRecentCall.args[1](testModel.composition);

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
                testModel.composition.push('d');
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
                mockEvent.isDefaultPrevented.andReturn(true);

                // Notify that a drop occurred
                testModel.composition.push('d');
                mockScope.$on.mostRecentCall.args[1](
                    mockEvent,
                    'd',
                    { x: 300, y: 100 }
                );
                expect(testConfiguration.panels.d).not.toBeDefined();
            });
        });
    }
);
